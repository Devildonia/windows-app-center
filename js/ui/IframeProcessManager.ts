import { Utils } from '../utils';

// ============================================
// IFRAME PROCESS MANAGER
// Trata cada iframe de una ventana como un "proceso": lo termina por completo
// al cerrar (detiene red, rAFs, timers, audio y descarga el src guardándolo) y
// lo restaura al reabrir. Extraído de WindowManager. Sin estado propio.
// ============================================

export class IframeProcessManager {
    /**
     * Restore iframe sources if they were unloaded (process restoration)
     */
    public restoreIframes(win: HTMLElement, windowId: string): void {
        const iframes = win.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const savedSrc = iframe.getAttribute('data-src');
            const isBlank = !iframe.src || iframe.src === 'about:blank' || iframe.src.startsWith('about:blank');

            if (savedSrc && isBlank) {
                iframe.src = savedSrc;
                Utils.Logger.window(`Restored process in ${windowId}`);
            } else if (!savedSrc && !isBlank) {
                iframe.setAttribute('data-src', iframe.src);
            }
        });
    }

    /**
     * Terminates all iframes of a window (stops rAF, intervals, audio, unloads).
     */
    public terminateWindowIframes(win: HTMLElement, windowId: string): void {
        const iframes = win.querySelectorAll('iframe');
        iframes.forEach(iframe => this.terminateIframe(iframe, windowId));
    }

    /**
     * Terminates an iframe completely — stops execution, clears intervals/rAFs, unloads
     */
    public terminateIframe(iframe: HTMLIFrameElement, context: string): void {
        try {
            const iframeWindow = iframe.contentWindow as any;
            if (iframeWindow) {
                // Stop all network requests and parsing
                iframeWindow.stop();

                // Cancel any pending animation frames (brute-force up to 100k IDs)
                const highestId = iframeWindow.requestAnimationFrame?.(() => { });
                if (highestId) {
                    for (let i = 0; i <= highestId; i++) {
                        iframeWindow.cancelAnimationFrame(i);
                    }
                }

                // Clear all intervals and timeouts (brute-force)
                const highestTimeout = iframeWindow.setTimeout?.(() => { }, 0);
                if (highestTimeout) {
                    for (let i = 0; i <= highestTimeout; i++) {
                        iframeWindow.clearTimeout(i);
                        iframeWindow.clearInterval(i);
                    }
                }

                // Close any AudioContext
                if (iframeWindow.AudioContext || iframeWindow.webkitAudioContext) {
                    try {
                        // Games may store their context differently
                        const audioCtx = iframeWindow._audioContext || iframeWindow.audioContext;
                        if (audioCtx && audioCtx.state !== 'closed') {
                            audioCtx.close();
                        }
                    } catch { /* ignore */ }
                }
            }
        } catch {
            // Cross-origin iframe — cannot access contentWindow, just unload
            Utils.Logger.window(`Cross-origin iframe in ${context}, unloading directly`);
        }

        // Save src for potential restoration and unload
        if (iframe.src && iframe.src !== 'about:blank' && !iframe.src.startsWith('about:blank')) {
            iframe.setAttribute('data-src', iframe.src);
        }
        iframe.src = 'about:blank';
        Utils.Logger.window(`Terminated process in ${context}`);
    }
}
