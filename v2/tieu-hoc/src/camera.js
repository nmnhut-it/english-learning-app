/**
 * Camera module - Captures user photos via webcam
 */

const CAPTURE_INTERVAL = 20;
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

let stream = null;
let videoElement = null;
let canvasElement = null;

/**
 * Requests camera permission and initializes stream
 * @returns {Promise<MediaStream>} Camera stream
 */
export async function initCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        facingMode: 'user'
      },
      audio: false
    });
    return stream;
  } catch (error) {
    console.error('Camera initialization failed:', error);
    throw new Error('Unable to access camera. Please grant camera permission.');
  }
}

/**
 * Creates hidden video and canvas elements for capture
 */
export function setupCameraElements() {
  if (!videoElement) {
    videoElement = document.createElement('video');
    videoElement.style.display = 'none';
    videoElement.width = VIDEO_WIDTH;
    videoElement.height = VIDEO_HEIGHT;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    document.body.appendChild(videoElement);
  }

  if (!canvasElement) {
    canvasElement = document.createElement('canvas');
    canvasElement.style.display = 'none';
    canvasElement.width = VIDEO_WIDTH;
    canvasElement.height = VIDEO_HEIGHT;
    document.body.appendChild(canvasElement);
  }

  if (stream && videoElement) {
    videoElement.srcObject = stream;
  }
}

/**
 * Captures photo from camera
 * @returns {Promise<Blob>} Photo as blob
 */
export async function capturePhoto() {
  if (!stream || !videoElement || !canvasElement) {
    throw new Error('Camera not initialized');
  }

  return new Promise((resolve, reject) => {
    try {
      const context = canvasElement.getContext('2d');
      context.drawImage(videoElement, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

      canvasElement.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture photo'));
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Checks if photo should be captured at current question number
 * @param {number} questionNumber - Current question number (1-based)
 * @returns {boolean} True if photo should be captured
 */
export function shouldCapturePhoto(questionNumber) {
  return questionNumber > 0 && questionNumber % CAPTURE_INTERVAL === 0;
}

/**
 * Stops camera stream and cleans up
 */
export function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  if (videoElement) {
    videoElement.srcObject = null;
    videoElement.remove();
    videoElement = null;
  }

  if (canvasElement) {
    canvasElement.remove();
    canvasElement = null;
  }
}

/**
 * Gets current camera status
 * @returns {boolean} True if camera is active
 */
export function isCameraActive() {
  return stream !== null && stream.active;
}
