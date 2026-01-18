/**
 * Student info module - Manages student name and photo collection/storage
 */

const STORAGE_KEY = 'ioe_student_info';

/**
 * Gets student info from localStorage
 * @returns {Object|null} Student info {name, photo, savedAt} or null
 */
export function getStoredStudentInfo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve student info:', error);
    return null;
  }
}

/**
 * Saves student info to localStorage
 * @param {string} name - Student name
 * @param {string} photoDataUrl - Photo as data URL
 */
export function saveStudentInfo(name, photoDataUrl) {
  try {
    const info = {
      name: name.trim(),
      photo: photoDataUrl,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch (error) {
    console.error('Failed to save student info:', error);
    throw error;
  }
}

/**
 * Clears student info from localStorage
 */
export function clearStudentInfo() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Prompts for student info and returns it
 * Checks localStorage first, prompts modal if not found
 * @returns {Promise<Object>} Student info {name, photo}
 */
export async function ensureStudentInfo() {
  const existing = getStoredStudentInfo();

  if (existing && existing.name && existing.photo) {
    return existing;
  }

  return new Promise((resolve) => {
    showStudentInfoModal(resolve);
  });
}

/**
 * Shows modal to collect student name and photo
 * @param {Function} onComplete - Callback with student info
 */
function showStudentInfoModal(onComplete) {
  const modal = document.createElement('div');
  modal.className = 'student-info-modal';
  modal.innerHTML = `
    <div class="student-info-overlay"></div>
    <div class="student-info-content">
      <h2>Student Information</h2>
      <p class="info-description">Please provide your name and photo to continue</p>

      <div class="info-form">
        <div class="form-group">
          <label for="student-name">Full Name:</label>
          <input
            type="text"
            id="student-name"
            placeholder="Enter your full name"
            autocomplete="name"
            required
          />
        </div>

        <div class="form-group">
          <label>Your Photo:</label>
          <div class="photo-capture-area">
            <video id="photo-preview-video" autoplay playsinline style="display: none;"></video>
            <canvas id="photo-preview-canvas" style="display: none;"></canvas>
            <img id="photo-preview-img" style="display: none;" alt="Preview" />
            <div id="photo-placeholder" class="photo-placeholder">
              <svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <p>No photo selected</p>
            </div>
          </div>

          <div class="photo-buttons">
            <button type="button" id="capture-photo-btn" class="btn btn-secondary">
              📷 Capture Photo
            </button>
            <button type="button" id="upload-photo-btn" class="btn btn-secondary">
              📁 Upload Photo
            </button>
            <input type="file" id="photo-upload-input" accept="image/*" style="display: none;" />
          </div>
        </div>

        <button type="submit" id="submit-info-btn" class="btn btn-primary" disabled>
          Continue to Quiz
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let capturedPhoto = null;
  let stream = null;

  const nameInput = modal.querySelector('#student-name');
  const submitBtn = modal.querySelector('#submit-info-btn');
  const captureBtn = modal.querySelector('#capture-photo-btn');
  const uploadBtn = modal.querySelector('#upload-photo-btn');
  const uploadInput = modal.querySelector('#photo-upload-input');
  const video = modal.querySelector('#photo-preview-video');
  const canvas = modal.querySelector('#photo-preview-canvas');
  const previewImg = modal.querySelector('#photo-preview-img');
  const placeholder = modal.querySelector('#photo-placeholder');

  // Validate form
  function validateForm() {
    const hasName = nameInput.value.trim().length > 0;
    const hasPhoto = capturedPhoto !== null;
    submitBtn.disabled = !(hasName && hasPhoto);
  }

  nameInput.addEventListener('input', validateForm);

  // Capture photo from camera
  let isCapturing = false;
  captureBtn.addEventListener('click', async () => {
    if (isCapturing) {
      // Take the photo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);

      // Show preview
      previewImg.src = capturedPhoto;
      previewImg.style.display = 'block';
      video.style.display = 'none';

      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }

      // Reset button
      captureBtn.textContent = '📷 Capture Photo';
      isCapturing = false;

      validateForm();
    } else {
      // Start camera
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });

        video.srcObject = stream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
        previewImg.style.display = 'none';

        captureBtn.textContent = '📸 Take Photo';
        isCapturing = true;
      } catch (error) {
        console.error('Camera access failed:', error);
        alert('Could not access camera. Please use the upload option instead.');
      }
    }
  });

  // Upload photo from file
  uploadBtn.addEventListener('click', () => {
    uploadInput.click();
  });

  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      capturedPhoto = event.target.result;
      previewImg.src = capturedPhoto;
      previewImg.style.display = 'block';
      video.style.display = 'none';
      placeholder.style.display = 'none';

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }

      if (isCapturing) {
        captureBtn.textContent = '📷 Capture Photo';
        isCapturing = false;
      }

      validateForm();
    };
    reader.readAsDataURL(file);
  });

  // Submit form
  submitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();

    if (name && capturedPhoto) {
      saveStudentInfo(name, capturedPhoto);

      // Clean up
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      modal.remove();

      onComplete({ name, photo: capturedPhoto });
    }
  });

  // Allow Enter key on name input
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !submitBtn.disabled) {
      submitBtn.click();
    }
  });

  // Focus name input
  setTimeout(() => nameInput.focus(), 100);
}

/**
 * Shows UI to change/update student info
 * @returns {Promise<Object>} Updated student info
 */
export async function changeStudentInfo() {
  clearStudentInfo();
  return ensureStudentInfo();
}
