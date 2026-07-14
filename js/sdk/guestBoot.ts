/**
 * IFRAME GUEST BOOTSTRAP (Fase 1.y)
 * Loaded inside a process iframe. Waits for the authenticated MessagePort
 * handshake from the host (parent), then runs an App Runtime over that dedicated
 * port using the SDK — demonstrating "the SDK inside the iframe runtime".
 *
 * Served from 'self' so it loads under the app's strict CSP (`script-src 'self'`),
 * which blocks inline/cross-origin guest scripts. Paired with an iframe that has
 * `allow-same-origin` (first-party realm/document isolation + a dedicated,
 * spoof-proof channel). True opaque-origin isolation would require serving guests
 * from a separate origin — see docs/webos-roadmap.
 */

import { createPortRuntime } from './appRuntime';
import { IFRAME_CONNECT_TYPE } from '../core/ipc/protocol';

window.addEventListener('message', (e: MessageEvent) => {
    // Per-process auth: only accept the port from our host (the parent frame).
    if (e.source !== window.parent) return;
    if (!e.data || e.data.type !== IFRAME_CONNECT_TYPE) return;
    const port = e.ports[0];
    if (!port) return;

    createPortRuntime(port)
        .on('echo', (payload) => payload)
        .on('reverse', (payload) => String(payload).split('').reverse().join(''))
        .start();
}, { once: true });
