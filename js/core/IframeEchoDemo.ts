/**
 * IFRAME PROCESS DEMO (Fase 1.y)
 * Spawns a sandboxed iframe process running the App SDK (see js/sdk/guestBoot.ts)
 * over a dedicated, authenticated MessagePort — proving the iframe-process path
 * end-to-end with the SDK inside the guest.
 *
 * The guest is SERVED from 'self' (process-guest.html) because the app's strict
 * CSP (`script-src 'self'`) blocks inline/cross-origin guest scripts, and the
 * iframe uses `allow-same-origin` so the served module loads and the parent-origin
 * check works — first-party realm/document isolation plus a spoof-proof channel.
 * Full opaque-origin isolation for untrusted third-party apps needs a separate
 * origin (deployment concern). See docs/webos-roadmap/phase-1-process-model.md.
 */

import { Kernel } from './Kernel';
import type { WorkerProcess } from './WorkerProcess';

/** URL of the served guest document (resolved relative to the app base). */
export const PROCESS_GUEST_URL = new URL('process-guest.html', document.baseURI).href;

export interface EchoIframeHandle {
    pid: number;
    worker: WorkerProcess;
    iframe: HTMLIFrameElement;
}

/** Spawns the SDK-based guest as an isolated iframe process. */
export function spawnEchoIframe(): Promise<EchoIframeHandle> {
    return Kernel.spawnIframe('echo-iframe', {
        src: PROCESS_GUEST_URL,
        sandbox: 'allow-same-origin',
    });
}
