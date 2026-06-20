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
const retryBtn = document.getElementById('retry-btn');

const overlay = new Overlay(canvas);

let latestData = { pitch: 0, roll: 0, rawBeta: 90, rawGamma: 0 };
let animFrameId = null;
let stream = null;
let orientationReady = false;
let cameraReady = false;
let retryCount = 0;

modeBtn.addEventListener('click', () => {
  const mode = overlay.toggleMode();
  modeBtn.textContent = mode === 'angle' ? 'Bubble Level' : 'Angle Measure';
});

retryBtn.addEventListener('click', async () => {
  retryBtn.disabled = true;
  errorMsg.classList.add('hidden');
  statusMsg.textContent = 'Requesting sensors...';
  await startOrientation();
});

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  statusMsg.textContent = 'Requesting sensors...';
  await startOrientation();
});

async function startOrientation() {
  try {
    await initOrientation((data) => {
      latestData = data;
    });
    orientationReady = true;
    await startCamera();
  } catch (err) {
    const msg = err.message || '';
    retryCount++;
    if (msg.includes('denied') && retryCount >= 2) {
      showPermissionHelp();
    } else if (msg.includes('denied')) {
      showRetry('Orientation permission needed');
    } else {
      showError(msg || 'Failed to start');
      startBtn.disabled = false;
      statusMsg.textContent = 'Tap to retry';
    }
  }
}

async function startCamera() {
  try {
    statusMsg.textContent = 'Requesting camera...';
    stream = await initCamera();
    video.srcObject = stream;
    await video.play();
    cameraReady = true;
    startOverlay.classList.add('hidden');
    modeBtn.classList.remove('hidden');
    startAnimation();
  } catch (err) {
    showError(err.message || 'Camera failed');
    startBtn.disabled = false;
    statusMsg.textContent = 'Tap to retry';
  }
}

function startAnimation() {
  function tick() {
    overlay.update(latestData);
    animFrameId = requestAnimationFrame(tick);
  }
  tick();
}

function showRetry(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
  retryBtn.classList.remove('hidden');
  startBtn.disabled = false;
  statusMsg.textContent = '';
}

function showPermissionHelp() {
  errorMsg.innerHTML =
    'Permission still denied on this device.<br><br>' +
    '<b>Safari:</b> Settings > Safari > Clear History & Website Data<br>' +
    '<b>Brave:</b> Quit & relaunch the app, then tap Start again';
  errorMsg.classList.remove('hidden');
  retryBtn.classList.add('hidden');
  startBtn.disabled = false;
  statusMsg.textContent = 'Tap start to try again';
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}
