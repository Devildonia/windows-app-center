/**
 * APP RUNTIME SDK (guest side)
 * The small library an isolated app (Web Worker now, sandboxed iframe later)
 * loads to speak the process IPC protocol without hand-rolling postMessage:
 *   - announces `sys:ready`,
 *   - auto-answers `sys:ping` with `sys:pong` (keeps the watchdog happy),
 *   - routes `app` requests to registered handlers and replies with the result
 *     or an error, correlated by id.
 *
 * Transport-agnostic (an `IGuestTransport`) so the same app code runs in a
 * Worker (`workerGuestTransport`) or an iframe MessagePort later. Phase 1.x.
 */

import { isAppMessage, isSysMessage, type AppMessage, type ProcMessage } from '../core/ipc/protocol';

export type RequestHandler = (payload: unknown) => unknown | Promise<unknown>;

export interface IGuestTransport {
    post(msg: ProcMessage): void;
    onMessage(handler: (msg: unknown) => void): void;
}

export class AppRuntime {
    private readonly handlers = new Map<string, RequestHandler>();
    private started = false;

    constructor(private readonly transport: IGuestTransport) {
        this.transport.onMessage(m => { void this.handle(m); });
    }

    /** Registers a handler for an app request `type`. Chainable. */
    on(type: string, handler: RequestHandler): this {
        this.handlers.set(type, handler);
        return this;
    }

    /** Announces readiness to the host. Call once after registering handlers. */
    start(): this {
        if (this.started) return this;
        this.started = true;
        this.transport.post({ ch: 'sys', type: 'ready' });
        return this;
    }

    private reply(id: number | undefined, payload?: unknown, error?: string): void {
        const msg: AppMessage = { ch: 'app', type: 'response' };
        if (id !== undefined) msg.id = id;
        if (payload !== undefined) msg.payload = payload;
        if (error !== undefined) msg.error = error;
        this.transport.post(msg);
    }

    private async handle(raw: unknown): Promise<void> {
        const msg = raw as ProcMessage;
        if (isSysMessage(msg)) {
            if (msg.type === 'ping') this.transport.post({ ch: 'sys', type: 'pong', id: msg.id });
            return;
        }
        if (isAppMessage(msg) && msg.type !== 'response') {
            const handler = this.handlers.get(msg.type);
            if (!handler) {
                this.reply(msg.id, undefined, `unknown request: ${msg.type}`);
                return;
            }
            try {
                const result = await handler(msg.payload);
                this.reply(msg.id, result);
            } catch (err) {
                this.reply(msg.id, undefined, err instanceof Error ? err.message : String(err));
            }
        }
    }
}

/** Guest transport backed by the Web Worker global scope. */
export function workerGuestTransport(): IGuestTransport {
    const ctx = self as unknown as {
        postMessage(m: ProcMessage): void;
        onmessage: ((e: MessageEvent) => void) | null;
    };
    return {
        post: (msg) => ctx.postMessage(msg),
        onMessage: (handler) => { ctx.onmessage = (e: MessageEvent) => handler(e.data); },
    };
}

/** Convenience: an AppRuntime wired to the Worker global scope. */
export function createWorkerRuntime(): AppRuntime {
    return new AppRuntime(workerGuestTransport());
}

/** Guest transport over a dedicated MessagePort (for iframe processes). */
export function messagePortGuestTransport(port: MessagePort): IGuestTransport {
    port.start();
    return {
        post: (msg) => port.postMessage(msg),
        onMessage: (handler) => { port.onmessage = (e: MessageEvent) => handler(e.data); },
    };
}

/** Convenience: an AppRuntime wired to a MessagePort. */
export function createPortRuntime(port: MessagePort): AppRuntime {
    return new AppRuntime(messagePortGuestTransport(port));
}
