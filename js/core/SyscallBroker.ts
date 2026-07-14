/**
 * SYSCALL BROKER (host side)
 * Mediates an isolated process's access to real system services over its
 * dedicated IPC channel. A process can't touch the VFS/Notify directly (it runs
 * in a Worker/iframe); it issues syscalls (`fs.read`, `fs.write`, `notify`,
 * `sys.log`) which the broker executes on the host after a guard check.
 *
 * Guards (Fase 2): a per-process capability set (which syscalls are allowed) and
 * an `fsRoot` that confines fs.* paths. Fase 3 replaces the static set with a
 * capability/consent broker and per-app home directories. Phase 2 of the roadmap.
 */

import { Utils } from '../utils';
import { Services } from './ServiceContainer';
import { VFS } from './VFS';
import { PermissionBroker } from './PermissionBroker';
import type { WorkerProcess } from './WorkerProcess';

export interface SyscallContext {
    appId: string;
    pid: number;
    /** fs.* paths must stay under this root (the app's home dir). */
    fsRoot: string;
}

/** The syscalls the broker can serve. */
export const DEFAULT_SYSCALLS = ['sys.log', 'notify', 'fs.read', 'fs.list', 'fs.write'] as const;

/**
 * Capability required by each syscall. `null` = always allowed (no consent).
 * fs.read/fs.list share `fs:read`; fs.write is `fs:write`. Consent is per capability.
 */
const SYSCALL_CAPABILITY: Record<string, string | null> = {
    'sys.log': null,
    'notify': 'notify',
    'fs.read': 'fs:read',
    'fs.list': 'fs:read',
    'fs.write': 'fs:write',
};

type Args = Record<string, unknown>;

function asString(v: unknown): string {
    return typeof v === 'string' ? v : '';
}

/** Rejects fs.* paths that escape the process's fsRoot. */
function assertInRoot(path: string, ctx: SyscallContext): void {
    const norm = path.replace(/\//g, '\\');
    if (norm !== ctx.fsRoot && !norm.startsWith(ctx.fsRoot + '\\')) {
        throw new Error(`fs access denied outside ${ctx.fsRoot}: ${path}`);
    }
}

const HANDLERS: Record<string, (args: Args, ctx: SyscallContext) => unknown | Promise<unknown>> = {
    'sys.log': (args, ctx) => {
        Utils.Logger.log(`[proc ${ctx.pid} ${ctx.appId}] ${asString(args.message)}`);
        return true;
    },
    'notify': (args) => {
        const notify = Services.get('Notify');
        const level = asString(args.level) || 'info';
        const message = asString(args.message);
        if (notify && typeof (notify as any)[level] === 'function') (notify as any)[level](message);
        else notify?.info(message);
        return true;
    },
    'fs.read': (args, ctx) => {
        const path = asString(args.path);
        assertInRoot(path, ctx);
        return VFS.readFileAsync(path);
    },
    'fs.list': (args, ctx) => {
        const path = asString(args.path);
        assertInRoot(path, ctx);
        return VFS.listDir(path);
    },
    'fs.write': async (args, ctx) => {
        const dir = asString(args.path);
        const name = asString(args.name);
        assertInRoot(dir, ctx);
        const ok = await VFS.writeFileAsync(dir, name, args.content as string | Blob);
        return ok;
    },
};

/**
 * Registers the syscall handlers on a process handle. Every call is guarded by
 * the context's capability set before dispatch.
 */
export function attachSyscalls(proc: WorkerProcess, ctx: SyscallContext): void {
    for (const name of Object.keys(HANDLERS)) {
        proc.onRequest(name, async (payload) => {
            // Consent gate: capability-bearing syscalls require a user grant
            // (prompted on first use, then remembered) via the PermissionBroker.
            const cap = SYSCALL_CAPABILITY[name];
            if (cap && !(await PermissionBroker.check(ctx.appId, cap))) {
                throw new Error(`permission denied: ${cap}`);
            }
            return HANDLERS[name]!((payload ?? {}) as Args, ctx);
        });
    }
}
