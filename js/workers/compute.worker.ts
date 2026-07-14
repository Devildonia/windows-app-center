/**
 * COMPUTE DEMO WORKER (process runtime, guest side)
 * Runs off the main thread. Speaks the IPC protocol: announces `sys:ready`,
 * answers `sys:ping` with `sys:pong`, and handles the `compute:primes` app
 * request. The work is chunked with periodic yields so the worker's own event
 * loop keeps answering pings while computing (so the watchdog sees it alive).
 *
 * A `compute:hang` request deliberately blocks forever — used to demonstrate the
 * watchdog killing an unresponsive process.
 */

import type { ProcMessage, AppMessage } from '../core/ipc/protocol';

const ctx = self as unknown as Worker & { postMessage(m: ProcMessage): void };

function reply(id: number | undefined, payload?: unknown, error?: string): void {
    const msg: AppMessage = { ch: 'app', type: 'response' };
    if (id !== undefined) msg.id = id;
    if (payload !== undefined) msg.payload = payload;
    if (error !== undefined) msg.error = error;
    ctx.postMessage(msg);
}

/** Chunked prime sieve that yields to the event loop so pings stay answered. */
async function firstNPrimes(n: number): Promise<number[]> {
    const primes: number[] = [];
    let candidate = 2;
    let sinceYield = 0;
    while (primes.length < n) {
        let isPrime = true;
        for (let i = 0; i < primes.length; i++) {
            const p = primes[i];
            if (p === undefined) break;
            if (p * p > candidate) break;
            if (candidate % p === 0) { isPrime = false; break; }
        }
        if (isPrime) primes.push(candidate);
        candidate++;
        if (++sinceYield >= 5_000) {
            sinceYield = 0;
            await new Promise<void>(r => setTimeout(r, 0)); // yield
        }
    }
    return primes;
}

ctx.onmessage = async (e: MessageEvent) => {
    const msg = e.data as ProcMessage;
    if (!msg || typeof msg !== 'object') return;

    if (msg.ch === 'sys' && msg.type === 'ping') {
        ctx.postMessage({ ch: 'sys', type: 'pong', id: msg.id });
        return;
    }

    if (msg.ch === 'app') {
        try {
            if (msg.type === 'compute:primes') {
                const count = Math.max(1, Math.min(100_000, Number((msg.payload as any)?.count) || 1000));
                const primes = await firstNPrimes(count);
                reply(msg.id, { count: primes.length, last: primes[primes.length - 1] });
            } else if (msg.type === 'compute:hang') {
                // Intentional infinite loop: never answers, never pongs → watchdog kills it.
                // eslint-disable-next-line no-constant-condition
                while (true) { /* block forever */ }
            } else {
                reply(msg.id, undefined, `unknown request: ${msg.type}`);
            }
        } catch (err) {
            reply(msg.id, undefined, err instanceof Error ? err.message : String(err));
        }
    }
};

// Announce readiness once the handler is wired.
ctx.postMessage({ ch: 'sys', type: 'ready' });
