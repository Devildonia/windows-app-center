import { describe, it, expect, beforeEach } from 'vitest';
import { WorkerProcess, messagePortTransport } from '../js/core/WorkerProcess.js';
import { AppRuntime, messagePortGuestTransport } from '../js/sdk/appRuntime.js';
import { attachSyscalls, DEFAULT_SYSCALLS } from '../js/core/SyscallBroker.js';
import { VFS } from '../js/core/VFS.js';

/**
 * Full-duplex IPC + syscall broker over a real MessagePort: a guest AppRuntime
 * issues syscalls (guest->host) that the host WorkerProcess serves via the
 * broker against the real VFS/Notify — the Fase 2 mediated-access path.
 */
function connect({ allowed = DEFAULT_SYSCALLS, fsRoot = 'C:\\DOCUMENTS' } = {}) {
    const channel = new MessageChannel();
    const host = new WorkerProcess(messagePortTransport(channel.port1));
    const guest = new AppRuntime(messagePortGuestTransport(channel.port2));
    attachSyscalls(host, { appId: 'test', pid: 1, allowed: new Set(allowed), fsRoot });
    guest.start();
    return { host, guest };
}

describe('Syscalls over the process channel (Fase 2)', () => {
    beforeEach(async () => {
        localStorage.clear();
        VFS.__reset();
        await VFS.init();
    });

    it('guest sys.log syscall reaches the host and returns true', async () => {
        const { host, guest } = connect();
        await host.ready;
        expect(await guest.syscall('sys.log', { message: 'hello from guest' })).toBe(true);
    });

    it('guest fs.write syscall writes to the real VFS', async () => {
        const { host, guest } = connect();
        await host.ready;
        const ok = await guest.syscall('fs.write', { path: 'C:\\DOCUMENTS', name: 'from-proc.txt', content: 'proc data' });
        expect(ok).toBe(true);
        expect(VFS.readFile('C:\\DOCUMENTS\\from-proc.txt')).toBe('proc data');
    });

    it('guest fs.read syscall returns file content', async () => {
        VFS.writeFile('C:\\DOCUMENTS', 'seed.txt', 'seeded');
        const { host, guest } = connect();
        await host.ready;
        expect(await guest.syscall('fs.read', { path: 'C:\\DOCUMENTS\\seed.txt' })).toBe('seeded');
    });

    it('denies a syscall the process is not granted', async () => {
        const { host, guest } = connect({ allowed: ['sys.log'] }); // no fs.write
        await host.ready;
        await expect(guest.syscall('fs.write', { path: 'C:\\DOCUMENTS', name: 'x', content: 'y' }))
            .rejects.toThrow('permission denied');
    });

    it('confines fs.* to the process fsRoot', async () => {
        const { host, guest } = connect({ fsRoot: 'C:\\DOCUMENTS' });
        await host.ready;
        await expect(guest.syscall('fs.write', { path: 'C:\\WINDOWS\\SYSTEM', name: 'evil', content: 'x' }))
            .rejects.toThrow('fs access denied');
        expect(VFS.resolve('C:\\WINDOWS\\SYSTEM\\evil')).toBeNull();
    });

    it('supports both directions without id collision (host->guest and guest->host)', async () => {
        const { host, guest } = connect();
        guest.on('double', (n) => n * 2);
        await host.ready;
        const [hostToGuest, guestToHost] = await Promise.all([
            host.request('double', 21),                 // host -> guest
            guest.syscall('sys.log', { message: 'x' }),  // guest -> host
        ]);
        expect(hostToGuest).toBe(42);
        expect(guestToHost).toBe(true);
    });
});
