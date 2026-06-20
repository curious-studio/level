const GREEN = '#4ade80';
const YELLOW = '#fbbf24';
const RED = '#ef4444';
const WHITE = 'rgba(255,255,255,0.9)';

export class Overlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pitch = 0;
    this.roll = 0;
    this.rawBeta = 90;
    this.rawGamma = 0;
    this.mode = 'angle';
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
    this._w = w;
    this._h = h;
  }

  update(data) {
    this.pitch = data.pitch;
    this.roll = data.roll;
    this.rawBeta = data.rawBeta;
    this.rawGamma = data.rawGamma;
    this._draw();
  }

  toggleMode() {
    this.mode = this.mode === 'angle' ? 'bubble' : 'angle';
    return this.mode;
  }

  _colorForAngle(angle) {
    const a = Math.abs(angle);
    if (a < 1) return GREEN;
    if (a < 3) return YELLOW;
    return RED;
  }

  _draw() {
    if (this.mode === 'bubble') {
      this._drawBubble();
    } else {
      this._drawAngle();
    }
  }

  _drawAngle() {
    const { ctx, _w: w, _h: h, rawBeta } = this;
    ctx.clearRect(0, 0, w, h);

    const betaAbs = Math.abs(rawBeta);
    const deviation = 90 - betaAbs;
    const fromVertical = Math.min(90, Math.max(0, Math.abs(deviation)));

    const pivotX = w / 2;
    const pivotY = h * 0.1;
    const lineLen = Math.min(w, h) * 0.58;
    const bottomY = pivotY + lineLen;

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, bottomY);
    ctx.stroke();

    const swingRad = (fromVertical * Math.sign(deviation)) * Math.PI / 180;
    const endX = pivotX + Math.sin(swingRad) * lineLen;
    const endY = pivotY + Math.cos(swingRad) * lineLen;

    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
    ctx.fill();

    if (fromVertical > 0.5) {
      const arcR = Math.min(w, h) * 0.12;
      const refAngle = Math.PI / 2;
      const measAngle = Math.PI / 2 + swingRad;

      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (swingRad >= 0) {
        ctx.arc(pivotX, pivotY, arcR, refAngle, measAngle);
      } else {
        ctx.arc(pivotX, pivotY, arcR, measAngle, refAngle);
      }
      ctx.stroke();

      const midAngle = (refAngle + measAngle) / 2;
      const labelR = arcR + Math.round(Math.min(w, h) * 0.07);
      const labelX = pivotX + Math.cos(midAngle) * labelR;
      const labelY = pivotY + Math.sin(midAngle) * labelR;

      const fontSize = Math.round(Math.min(w, h) * 0.1);
      ctx.fillStyle = WHITE;
      ctx.font = `700 ${fontSize}px SFMono-Regular, ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${fromVertical.toFixed(1)}°`, labelX, labelY);
    } else {
      const fontSize = Math.round(Math.min(w, h) * 0.06);
      ctx.fillStyle = GREEN;
      ctx.font = `700 ${fontSize}px SFMono-Regular, ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('0.0°', pivotX, pivotY + 10);
    }

    const infoSize = Math.round(Math.min(w, h) * 0.035);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = `${infoSize}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('from vertical', pivotX, h - 36);

    this._drawModeLabel('angle');
  }

  _drawBubble() {
    const { ctx, _w: w, _h: h, pitch, roll } = this;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 - 20;
    const radius = Math.min(w, h) * 0.18;
    const pxPerDeg = radius / 15;

    const maxAngle = Math.max(Math.abs(roll), Math.abs(pitch));
    const color = this._colorForAngle(maxAngle);

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 1.5, cy);
    ctx.lineTo(cx + radius * 1.5, cy);
    ctx.moveTo(cx, cy - radius * 1.5);
    ctx.lineTo(cx, cy + radius * 1.5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    const tickLen = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const x1 = cx + Math.cos(a) * (radius - tickLen);
      const y1 = cy + Math.sin(a) * (radius - tickLen);
      const x2 = cx + Math.cos(a) * radius;
      const y2 = cy + Math.sin(a) * radius;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const dx = Math.max(-radius, Math.min(radius, roll * pxPerDeg));
    const dy = Math.max(-radius, Math.min(radius, pitch * pxPerDeg));
    const dotX = cx + dx;
    const dotY = cy + dy;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 13, 0, Math.PI * 2);
    ctx.stroke();

    const fontSize = Math.round(Math.min(w, h) * 0.055);
    ctx.fillStyle = color;
    ctx.font = `700 ${fontSize}px SFMono-Regular, ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const rs = roll >= 0 ? '+' : '';
    const ps = pitch >= 0 ? '+' : '';
    const labelY = cy + radius + 24;
    ctx.fillText(`ROLL  ${rs}${roll.toFixed(1)}°`, cx, labelY);
    ctx.fillText(`PITCH ${ps}${pitch.toFixed(1)}°`, cx, labelY + fontSize + 8);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = `${Math.round(fontSize * 0.5)}px -apple-system, sans-serif`;
    ctx.textBaseline = 'bottom';
    ctx.fillText('Hold against a surface to measure', cx, h - 16);

    this._drawModeLabel('bubble');
  }

  _drawModeLabel(mode) {
    const { ctx, _w: w, _h: h } = this;
    const label = mode === 'angle' ? 'angle' : 'bubble';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    const fs = Math.round(Math.min(w, h) * 0.03);
    ctx.font = `${fs}px -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`\u25C9 ${label}`, 12, 12);
  }
}
