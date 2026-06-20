export async function initCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera API not available in this browser');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  });

  return stream;
}

export function stopCamera(stream) {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }
}
