export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointerDown = false;
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this._lastX = 0;
    this._lastY = 0;
    this.tapQueue = [];

    canvas.addEventListener("pointerdown", (e) => this._onDown(e));
    canvas.addEventListener("pointermove", (e) => this._onMove(e));
    window.addEventListener("pointerup", (e) => this._onUp(e));
    window.addEventListener("pointercancel", (e) => this._onUp(e));
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
  }

  _toCanvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  _onDown(e) {
    const p = this._toCanvasCoords(e.clientX, e.clientY);
    this.pointerDown = true;
    this.x = p.x;
    this.y = p.y;
    this._lastX = p.x;
    this._lastY = p.y;
    this.tapQueue.push({ x: p.x, y: p.y });
  }

  _onMove(e) {
    if (!this.pointerDown) return;
    const p = this._toCanvasCoords(e.clientX, e.clientY);
    this.dx = p.x - this._lastX;
    this.dy = p.y - this._lastY;
    this.x = p.x;
    this.y = p.y;
    this._lastX = p.x;
    this._lastY = p.y;
  }

  _onUp() {
    this.pointerDown = false;
    this.dx = 0;
    this.dy = 0;
  }

  endFrame() {
    this.dx = 0;
    this.dy = 0;
    this.tapQueue.length = 0;
  }

  consumeTap(rect) {
    for (let i = 0; i < this.tapQueue.length; i++) {
      const t = this.tapQueue[i];
      if (
        t.x >= rect.x &&
        t.x <= rect.x + rect.w &&
        t.y >= rect.y &&
        t.y <= rect.y + rect.h
      ) {
        this.tapQueue.splice(i, 1);
        return true;
      }
    }
    return false;
  }
}
