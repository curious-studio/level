const SMOOTHING = 0.3;

let smoothPitch = 0;
let smoothRoll = 0;
let smoothRawBeta = 90;
let smoothRawGamma = 0;
const listeners = [];

function handleOrientation(event) {
  const beta = event.beta;
  const gamma = event.gamma;

  if (beta == null || gamma == null) return;

  let pitch;
  if (Math.abs(beta) < 45) {
    pitch = beta;
  } else {
    pitch = beta - 90;
  }
  const roll = gamma;

  smoothPitch += SMOOTHING * (pitch - smoothPitch);
  smoothRoll += SMOOTHING * (roll - smoothRoll);
  smoothRawBeta += SMOOTHING * (beta - smoothRawBeta);
  smoothRawGamma += SMOOTHING * (gamma - smoothRawGamma);

  const data = {
    pitch: smoothPitch,
    roll: smoothRoll,
    rawBeta: smoothRawBeta,
    rawGamma: smoothRawGamma,
  };
  listeners.forEach(fn => fn(data));
}

export async function initOrientation(onData) {
  listeners.push(onData);

  if (typeof DeviceOrientationEvent === 'undefined') {
    throw new Error('Device orientation not supported');
  }

  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const result = await DeviceOrientationEvent.requestPermission();
    if (result !== 'granted') {
      throw new Error('Device orientation permission denied');
    }
  }

  window.addEventListener('deviceorientation', handleOrientation);
}
