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

  _gaugeColor(deg) {
    if (deg < 5) return GREEN;
    if (deg < 15) return YELLOW;
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
    const { ctx, _w: w, _h: h, rawBeta, rawGamma } = this;
    ctx.clearRect(0, 0, w, h);

    const betaAbs = Math.abs(rawBeta);
    const pitchDev = Math.abs(90 - betaAbs);
    const gammaAbs = Math.abs(rawGamma);
    const totalRad = Math.sqrt(
      Math.pow((90 - betaAbs) * Math.PI / 180, 2) +
      Math.pow(gammaAbs * Math.PI / 180, 2)
    );
    const fromVertical = Math.min(90, totalRad * 180 / Math.PI);

    const color = this._gaugeColor(fromVertical);
    const cx = w / 2;
    const fontSize = Math.round(Math.min(w, h) * 0.12);
    const labelSize = Math.round(fontSize * 0.3);
    const infoSize = Math.round(fontSize * 0.22);

    const gaugeR = Math.min(w, h) * 0.3;
    const gaugeY = h * 0.38;

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, gaugeY, gaugeR, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    const angleRad = (fromVertical / 90) * Math.PI * 1.5 + Math.PI * 0.75;
    const endAngle = Math.min(angleRad, Math.PI * 2.25);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, gaugeY, gaugeR, Math.PI * 0.75, endAngle);
    ctx.stroke();

    const ndX = cx + Math.cos(endAngle) * gaugeR;
    const ndY = gaugeY + Math.sin(endAngle) * gaugeR;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ndX, ndY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = WHITE;
    ctx.font = `300 ${fontSize}px SFMono-Regular, ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${fromVertical.toFixed(1)}°`, cx, h * 0.52);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${labelSize}px -apple-system, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText('from vertical', cx, h * 0.52 + fontSize * 0.5);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${infoSize}px SFMono-Regular, ui-monospace, monospace`;
    ctx.textBaseline = 'bottom';
    const signG = rawGamma >= 0 ? '+' : '';
    const signB = rawBeta >= 90 ? '' : '-';
    ctx.fillText(
      `pitch ${signB}${Math.abs(90 - betaAbs).toFixed(1)}°  roll ${signG}${gammaAbs.toFixed(1)}°`,
      cx, h - 40
    );

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = `${Math.round(infoSize * 0.7)}px -apple-system, sans-serif`;
    ctx.textBaseline = 'bottom';
    ctx.fillText('press edge against surface to measure', cx, h - 12);

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
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    const fs = Math.round(Math.min(w, h) * 0.035);
    ctx.font = `${fs}px -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`◉ ${label}`, 14, 14);
  }
}
