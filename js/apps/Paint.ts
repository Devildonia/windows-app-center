/**
 * WINDOWS 95 APP CENTER - PAINT
 * Basic drawing application with Undo/Redo
 * Version: 4.1 (TypeScript)
 */

import { Utils } from '../utils.js';
import { Kernel } from '../core/Kernel.js';

const MAX_HISTORY = 30;

export interface IPaintParams {
    [key: string]: any;
}

export type PaintTool = 'pencil' | 'brush' | 'eraser' | 'rect' | 'line' | 'clear' | 'undo' | 'redo' | 'separator';

class Paint {
    public windowId: string = 'win-paint';
    private canvasId: string = 'paint-canvas';
    private color: string = '#000000';
    private isDrawing: boolean = false;
    private brushSize: number = 2;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private onResize = (): void => this.resizeCanvas();
    private onKeyDown = (e: KeyboardEvent): void => {
        const win = document.getElementById(this.windowId);
        if (!win || win.style.display === 'none') return;

        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                this.redo();
            } else {
                this.undo();
            }
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            this.redo();
        }
    };
    private onMouseUp = (): void => this.stopDrawing();

    // Undo/Redo stacks (ImageData snapshots)
    private _undoStack: ImageData[] = [];
    private _redoStack: ImageData[] = [];

    constructor(params: IPaintParams = {}) {
        this.init();
    }

    private init(): void {
        this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
        if (!this.canvas) return;

        this.resizeCanvas();
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.setupToolbar();
        this.setupColors();
        this.setupCanvasEvents();
        this._setupKeyboardShortcuts();

        // Save initial blank state
        this._saveState();

        window.addEventListener('resize', this.onResize);

        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
            const container = document.querySelector(`#${this.windowId} .paint-canvas-container`);
            if (container) this.resizeObserver.observe(container);
        }

        Utils.Logger.log('Paint initialized with Undo/Redo');
    }

    // ========================================
    // UNDO / REDO
    // ========================================

    private _saveState(): void {
        if (!this.ctx || !this.canvas || !this.canvas.width || !this.canvas.height) return;

        try {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this._undoStack.push(imageData);

            // Trim to max history
            if (this._undoStack.length > MAX_HISTORY) {
                this._undoStack.shift();
            }

            // Any new action clears the redo stack
            this._redoStack = [];

            this._updateUndoRedoButtons();
        } catch (e) {
            Utils.Logger.error('Failed to save paint state:', e);
        }
    }

    public undo(): void {
        if (this._undoStack.length <= 1 || !this.ctx) return;

        const current = this._undoStack.pop();
        if (current) this._redoStack.push(current);

        const prev = this._undoStack[this._undoStack.length - 1];
        if (prev) this.ctx.putImageData(prev, 0, 0);

        this._updateUndoRedoButtons();
        Utils.Logger.log('[Paint] Undo');
    }

    public redo(): void {
        if (this._redoStack.length === 0 || !this.ctx) return;

        const next = this._redoStack.pop();
        if (next) {
            this._undoStack.push(next);
            this.ctx.putImageData(next, 0, 0);
        }

        this._updateUndoRedoButtons();
        Utils.Logger.log('[Paint] Redo');
    }

    private _updateUndoRedoButtons(): void {
        const undoBtn = document.getElementById('paint-undo-btn') as HTMLButtonElement;
        const redoBtn = document.getElementById('paint-redo-btn') as HTMLButtonElement;
        if (undoBtn) undoBtn.disabled = this._undoStack.length <= 1;
        if (redoBtn) redoBtn.disabled = this._redoStack.length === 0;
    }

    private _setupKeyboardShortcuts(): void {
        document.addEventListener('keydown', this.onKeyDown);
    }

    // ========================================
    // CANVAS
    // ========================================

    private resizeCanvas(): void {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        if (!container) return;

        const width = container.clientWidth - 20;
        const height = container.clientHeight - 20;

        if (this.canvas.width !== width || this.canvas.height !== height) {
            let tempCanvas: HTMLCanvasElement | null = null;
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.canvas.width;
                tempCanvas.height = this.canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) tempCtx.drawImage(this.canvas, 0, 0);
            }

            this.canvas.width = width;
            this.canvas.height = height;

            if (tempCanvas) {
                this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
                if (this.ctx) this.ctx.drawImage(tempCanvas, 0, 0);
            }

            if (this.ctx) {
                this.ctx.lineCap = 'round';
                this.ctx.lineWidth = this.brushSize;
                this.ctx.strokeStyle = this.color;
            }
        }
    }

    private setupToolbar(): void {
        const toolbar = document.querySelector(`#${this.windowId} .paint-toolbar`);
        if (!toolbar) return;

        toolbar.innerHTML = ''; // Clear to prevent duplication

        const tools: { id: PaintTool, icon: string }[] = [
            { id: 'pencil', icon: '✏️' },
            { id: 'brush', icon: '🖌️' },
            { id: 'eraser', icon: '🧽' },
            { id: 'rect', icon: '⬜' },
            { id: 'line', icon: '📏' },
            { id: 'clear', icon: '🗑️' },
            { id: 'separator', icon: '' },
            { id: 'undo', icon: '↩️' },
            { id: 'redo', icon: '↪️' }
        ];

        tools.forEach(tool => {
            if (tool.id === 'separator') {
                const sep = document.createElement('span');
                sep.style.cssText = 'grid-column: span 2; width: 100%; height: 1px; background: #808080; margin: 4px 0;';
                toolbar.appendChild(sep);
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'win95-btn';
            btn.style.cssText = 'width: 24px; height: 24px; padding: 0;';
            btn.title = tool.id;
            const iconSpan = document.createElement('span');
            iconSpan.style.fontSize = '14px';
            iconSpan.textContent = tool.icon;
            btn.appendChild(iconSpan);

            if (tool.id === 'undo') {
                btn.id = 'paint-undo-btn';
                btn.disabled = true;
                btn.onclick = () => this.undo();
            } else if (tool.id === 'redo') {
                btn.id = 'paint-redo-btn';
                btn.disabled = true;
                btn.onclick = () => this.redo();
            } else {
                btn.onclick = () => this.selectTool(tool.id);
            }

            toolbar.appendChild(btn);
        });
    }

    private setupColors(): void {
        const colorBar = document.querySelector(`#${this.windowId} .paint-color-bar`);
        if (!colorBar) return;

        colorBar.innerHTML = ''; // Clear to prevent duplication

        const colors = [
            '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
            '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'
        ];

        colors.forEach(col => {
            const box = document.createElement('div');
            box.style.cssText = `width: 15px; height: 15px; background: ${col}; border: 1px solid #808080; margin: 1px; cursor: pointer;`;
            box.onclick = () => { this.color = col; };
            colorBar.appendChild(box);
        });
    }

    private setupCanvasEvents(): void {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e: MouseEvent) => this.draw(e));
        Utils.eventManager.add(document, 'mouseup', this.onMouseUp);
    }

    private getMousePos(e: MouseEvent): { x: number, y: number } {
        if (!this.canvas) return { x: 0, y: 0 };
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    private startDrawing(e: MouseEvent): void {
        if (!this.ctx) return;
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }

    private draw(e: MouseEvent): void {
        if (!this.isDrawing || !this.ctx) return;
        const pos = this.getMousePos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    private stopDrawing(): void {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        // Save state after each stroke for undo
        this._saveState();
    }

    private selectTool(tool: PaintTool): void {
        if (!this.ctx || !this.canvas) return;
        switch (tool) {
            case 'eraser':
                this.color = '#ffffff';
                this.brushSize = 10;
                break;
            case 'pencil':
                this.brushSize = 1;
                break;
            case 'brush':
                this.brushSize = 5;
                break;
            case 'clear':
                this._saveState(); // Save before clearing for undo
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this._saveState();
                break;
            default:
                Utils.Logger.log(`Tool selected: ${tool}`);
        }
    }

    public destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('keydown', this.onKeyDown);
        Utils.eventManager.remove(document, 'mouseup', this.onMouseUp);
    }
}

// Register with Kernel
Kernel.registerApp('paint', Paint, {
    name: 'Paint',
    icon: '🎨',
    description: 'Basic drawing application with Undo/Redo'
});

export { Paint };
