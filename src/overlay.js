const GREEN = '#4ade80';
const YELLOW = '#fbbf24';
const RED = '#ef4444';

export class Overlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pitch = 0;
    this.roll = 0;
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

  update(pitch, roll) {
    this.pitch = pitch;
    this.roll = roll;
    this._draw();
  }

  _colorForAngle(angle) {
    const a = Math.abs(angle);
    if (a < 1) return GREEN;
    if (a < 3) return YELLOW;
    return RED;
  }

  _draw() {
    const { ctx, _w: w, _h: h, pitch, roll } = this;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 - 20;
    const radius = Math.min(w, h) * 0.18;
    const pxPerDeg = radius / 15;

    const maxAngle = Math.max(Math.abs(roll), Math.abs(pitch));
    const color = this._colorForAngle(maxAngle);

    // crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 1.5, cy);
    ctx.lineTo(cx + radius * 1.5, cy);
    ctx.moveTo(cx, cy - radius * 1.5);
    ctx.lineTo(cx, cy + radius * 1.5);
    ctx.stroke();

    // bubble ring
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // cardinal ticks
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

    // bubble dot position
    const dx = Math.max(-radius, Math.min(radius, roll * pxPerDeg));
    const dy = Math.max(-radius, Math.min(radius, pitch * pxPerDeg));
    const dotX = cx + dx;
    const dotY = cy + dy;

    // inner dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    ctx.fill();

    // outer ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 13, 0, Math.PI * 2);
    ctx.stroke();

    // numeric labels
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

    // subtle hint at bottom
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = `${Math.round(fontSize * 0.5)}px -apple-system, sans-serif`;
    ctx.textBaseline = 'bottom';
    ctx.fillText('Hold against a surface to measure', cx, h - 16);
  }
}
