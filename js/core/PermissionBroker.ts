/**
 * PERMISSION BROKER (host side, Fase 3)
 * Mediates isolated processes' capabilities with user consent. On a process's
 * first use of a capability (e.g. `fs:write`, `notify`) the broker asks the user
 * to allow or deny; the decision is remembered per (app, capability) and
 * persisted in the VFS, so later calls resolve without prompting. Replaces the
 * SyscallBroker's static capability set.
 *
 * The consent prompt is injectable (`setPrompt`) so it can be a real dialog in
 * the app and an auto-decider in tests.
 */

import { VFS } from './VFS';
import { Utils } from '../utils';

export type Decision = 'granted' | 'denied';
export type ConsentPrompt = (appId: string, capability: string) => Promise<Decision>;

const GRANTS_DIR = 'C:\\WINDOWS\\SYSTEM';
const GRANTS_NAME = 'permissions.json';
const GRANTS_PATH = `${GRANTS_DIR}\\${GRANTS_NAME}`;

/** Human-readable descriptions shown in the consent dialog. */
const CAP_LABELS: Record<string, string> = {
    'fs:read': 'read your files',
    'fs:write': 'save files',
    'notify': 'show notifications',
    'net': 'access the network',
};

/** Default consent UI: a small modal with Allow / Deny. */
function defaultPrompt(appId: string, capability: string): Promise<Decision> {
    return new Promise((resolve) => {
        const label = CAP_LABELS[capability] ?? capability;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:100000;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div role="dialog" aria-modal="true" style="background:#c0c0c0;border:2px outset #fff;padding:16px;min-width:280px;font-family:'MS Sans Serif',sans-serif;font-size:12px;box-shadow:2px 2px 8px rgba(0,0,0,.4);">
                <p style="margin:0 0 12px;">🔐 <strong>${appId}</strong> wants to <strong>${label}</strong>.</p>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="win95-btn" data-consent="denied">Deny</button>
                    <button class="win95-btn" data-consent="granted">Allow</button>
                </div>
            </div>`;
        const finish = (d: Decision) => { overlay.remove(); resolve(d); };
        overlay.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('[data-consent]') as HTMLElement | null;
            if (btn) finish(btn.dataset.consent as Decision);
        });
        document.body.appendChild(overlay);
    });
}

export const PermissionBroker = (() => {
    let grants: Record<string, Record<string, Decision>> = {};
    let prompt: ConsentPrompt = defaultPrompt;

    /** Loads persisted grants from the VFS (call once at boot). */
    function init(): void {
        const raw = VFS.readFile(GRANTS_PATH);
        if (raw) {
            try { grants = JSON.parse(raw) || {}; }
            catch { grants = {}; }
        }
    }

    /** Overrides the consent UI (used by tests). */
    function setPrompt(p: ConsentPrompt): void { prompt = p; }

    /**
     * Resolves whether `appId` may use `capability`, prompting for consent on
     * first use and remembering the decision.
     */
    async function check(appId: string, capability: string): Promise<boolean> {
        const appGrants = grants[appId] ?? (grants[appId] = {});
        const existing = appGrants[capability];
        if (existing) return existing === 'granted';

        let decision: Decision;
        try {
            decision = await prompt(appId, capability);
        } catch {
            decision = 'denied';
        }
        appGrants[capability] = decision;
        persist();
        Utils.Logger.log(`[PermissionBroker] ${appId} ${decision} "${capability}"`);
        return decision === 'granted';
    }

    /** Returns a stored decision without prompting (or undefined if none). */
    function peek(appId: string, capability: string): Decision | undefined {
        return grants[appId]?.[capability];
    }

    function persist(): void {
        VFS.mkdir('C:\\WINDOWS', 'SYSTEM'); // idempotent; ensures the dir exists
        VFS.writeFile(GRANTS_DIR, GRANTS_NAME, JSON.stringify(grants));
        void VFS.flush();
    }

    /** Grants/denies programmatically (settings UI, tests). */
    function set(appId: string, capability: string, decision: Decision): void {
        (grants[appId] ?? (grants[appId] = {}))[capability] = decision;
        persist();
    }

    function reset(): void {
        grants = {};
        prompt = defaultPrompt;
    }

    return { init, check, peek, set, setPrompt, persist, reset };
})();
