import { images } from "./assetLoader.js";
import * as AudioMgr from "./audio.js";

export class Button {
  constructor({ x, y, w, h, label, imgKey, pressedImgKey, font = "PixelBody", fontSize = 20, textColor = "#fff", disabled = false, imgFit = "stretch" }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.imgKey = imgKey;
    this.pressedImgKey = pressedImgKey;
    this.font = font;
    this.fontSize = fontSize;
    this.textColor = textColor;
    this.disabled = disabled;
    this.imgFit = imgFit;
    this._pressedVisual = 0;
  }

  get rect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  handle(input) {
    if (this.disabled) return false;
    const tapped = input.consumeTap(this.rect);
    if (tapped) {
      this._pressedVisual = 120;
      AudioMgr.playSfx("click");
    }
    return tapped;
  }

  update(dt) {
    if (this._pressedVisual > 0) this._pressedVisual -= dt;
  }

  draw(ctx) {
    const key = this._pressedVisual > 0 && this.pressedImgKey ? this.pressedImgKey : this.imgKey;
    const img = key ? images[key] : null;
    ctx.save();
    if (this.disabled) ctx.globalAlpha = 0.5;
    if (img) {
      if (this.imgFit === "contain") {
        drawImageContain(ctx, img, this.x, this.y, this.w, this.h);
      } else {
        ctx.drawImage(img, this.x, this.y, this.w, this.h);
      }
    } else {
      ctx.fillStyle = "#2c3550";
      ctx.strokeStyle = "#7aa2ff";
      ctx.lineWidth = 2;
      roundRect(ctx, this.x, this.y, this.w, this.h, 10);
      ctx.fill();
      ctx.stroke();
    }
    if (this.label) {
      ctx.fillStyle = this.textColor;
      ctx.font = `${this.fontSize}px ${this.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2 + 2);
    }
    ctx.restore();
  }
}

export function drawImageContain(ctx, img, x, y, w, h) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawText(ctx, text, x, y, { font = "PixelBody", size = 18, color = "#fff", align = "center" } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

// Breaks `text` into an array of lines that each fit within maxWidth,
// measured using the given font (e.g. "15px PixelTitle"). Used for any
// longer block of text (credits, descriptions) that shouldn't just run
// off the edges of the canvas as a single line.
export function wrapText(ctx, text, maxWidth, font) {
  ctx.font = font;
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawBar(ctx, x, y, w, h, ratio, { bg = "rgba(0,0,0,0.5)", fg = "#4caf50" } = {}) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
}

export function drawSkillButton(ctx, x, y, size, iconKey, state, cooldownRatio) {
  const colors = { cooldown: "#e53935", ready: "#2196f3", active: "#43a047" };
  ctx.save();
  ctx.fillStyle = "rgba(10,10,20,0.6)";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, 0, Math.PI * 2);
  ctx.fill();

  const icon = images[iconKey];
  if (icon) ctx.drawImage(icon, x, y, size, size);

  ctx.lineWidth = 4;
  ctx.strokeStyle = colors[state] || "#888";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - cooldownRatio));
  ctx.stroke();
  ctx.restore();
}

export class Slider {
  constructor({ x, y, w, h = 28, value = 0.5, onChange, onRelease }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.value = value;
    this.onChange = onChange;
    this.onRelease = onRelease;
    this.dragging = false;
  }

  _hitTest(px, py) {
    const pad = 16;
    return px >= this.x - pad && px <= this.x + this.w + pad && py >= this.y - pad && py <= this.y + this.h + pad;
  }

  handle(input) {
    if (!this.dragging && input.pointerDown && this._hitTest(input.x, input.y)) this.dragging = true;
    if (this.dragging && !input.pointerDown) {
      this.dragging = false;
      if (this.onRelease) this.onRelease(this.value);
    }
    if (this.dragging) {
      const v = Math.max(0, Math.min(1, (input.x - this.x) / this.w));
      if (v !== this.value) {
        this.value = v;
        if (this.onChange) this.onChange(v);
      }
    }
  }

  draw(ctx) {
    const midY = this.y + this.h / 2;
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(this.x, midY);
    ctx.lineTo(this.x + this.w, midY);
    ctx.stroke();

    ctx.strokeStyle = "#7aa2ff";
    ctx.beginPath();
    ctx.moveTo(this.x, midY);
    ctx.lineTo(this.x + this.w * this.value, midY);
    ctx.stroke();

    const knobX = this.x + this.w * this.value;
    const knobImg = images.sliderButton;
    if (knobImg) {
      ctx.drawImage(knobImg, knobX - this.h / 2, this.y, this.h, this.h);
    } else {
      ctx.fillStyle = "#7aa2ff";
      ctx.beginPath();
      ctx.arc(knobX, midY, this.h / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
