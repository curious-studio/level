import { initCamera } from './camera.js';
import { initOrientation } from './orientation.js';
import { Overlay } from './overlay.js';

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const statusMsg = document.getElementById('status-msg');
const errorMsg = document.getElementById('error-msg');
const modeBtn = document.getElementById('mode-btn');

const overlay = new Overlay(canvas);

let latestData = { pitch: 0, roll: 0, rawBeta: 90, rawGamma: 0 };
let animFrameId = null;
let stream = null;

modeBtn.addEventListener('click', () => {
  const mode = overlay.toggleMode();
  modeBtn.textContent = mode === 'angle' ? 'Bubble Level' : 'Angle Measure';
});

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;

  try {
    statusMsg.textContent = 'Requesting sensors...';
    await initOrientation((data) => {
      latestData = data;
    });

    statusMsg.textContent = 'Requesting camera...';
    stream = await initCamera();
    video.srcObject = stream;
    await video.play();

    startOverlay.classList.add('hidden');
    modeBtn.classList.remove('hidden');
    startAnimation();
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('permission') || msg.includes('denied')) {
      showError(
        'Permission denied. On iPhone: Settings > Safari > Clear History & Website Data, then refresh and try again.'
      );
    } else {
      showError(msg || 'Failed to start');
    }
    startBtn.disabled = false;
    statusMsg.textContent = 'Tap to retry';
  }
});

function startAnimation() {
  function tick() {
    overlay.update(latestData);
    animFrameId = requestAnimationFrame(tick);
  }
  tick();
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}
