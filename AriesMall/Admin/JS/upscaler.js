// Admin/JS/upscaler.js

import { showToast } from './ui.js';
import { saveToHistory } from './media-history.js';
import { getAdminConfig } from './settings.js';

export async function initUpscaler() {
  
  // --- FETCH CONFIG ---
  let CONFIG = {};
  try {
    CONFIG = await getAdminConfig();
  } catch (e) { console.error(e); return; }

  const REPLICATE_API_TOKEN = CONFIG.REPLICATE_API_TOKEN;
  const CLOUD_NAME = CONFIG.CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = CONFIG.CLOUDINARY_UPSCALER_PRESET;
  const CORS_PROXY = CONFIG.CORS_PROXY_URL;

  // Uses a different model for upscaling (e.g., gfpgan) 
  const UPSCALER_MODEL_VERSION = CONFIG.UPSCALER_MODEL; 

  const CLOUDINARY_URL = `${CORS_PROXY}https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const REPLICATE_API_URL = `${CORS_PROXY}https://api.replicate.com/v1/predictions`;
  // --------------------------------------------------------------------------------------------------

  // --- ELEMENT SELECTORS (Assigned inside init) ---
  const upscalerContainer = document.getElementById("upscaler-container");
  if (!upscalerContainer) return; // Exit if not on the Media Hub page

  const uploadArea = document.getElementById("upscaler-upload-area");
  const browseBtn = document.getElementById("upscaler-browse-btn");
  const fileInput = document.getElementById("upscaler-file-input");
  const urlInput = document.getElementById("upscaler-url-input");
  const addUrlBtn = document.getElementById("upscaler-add-url-btn");
  const stagingArea = document.getElementById("upscaler-staging-area");
  const controlsContainer = document.getElementById("upscaler-controls-container");
  const startBtn = document.getElementById("upscaler-start-btn");
  const scaleSelect = document.getElementById("upscaler-scale-select");
  const progressContainer = document.getElementById("upscaler-progress-container");
  const resultContainer = document.getElementById("upscaler-result-container");
  
  const stagedFiles = new Map();

  // --- EVENT LISTENERS ---
  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => handleFileSelect(fileInput.files));
  addUrlBtn.addEventListener("click", handleUrlAdd);
  startBtn.addEventListener("click", startBatchUpscaling);

  ["dragenter", "dragover", "dragleave", "drop"].forEach(e => {
    uploadArea.addEventListener(e, preventDefaults);
    document.body.addEventListener(e, preventDefaults);
  });
  ["dragenter", "dragover"].forEach(e => uploadArea.addEventListener(e, () => uploadArea.classList.add("drag-over")));
  ["dragleave", "drop"].forEach(e => uploadArea.addEventListener(e, () => uploadArea.classList.remove("drag-over")));
  uploadArea.addEventListener("drop", handleDrop);

  function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
  function handleDrop(e) { handleFileSelect(e.dataTransfer.files); }

  function updateControlsVisibility() {
    controlsContainer.style.display = stagedFiles.size > 0 ? "flex" : "none";
  }

  function handleFileSelect(files) {
    [...files].forEach(file => {
      if (file.type.startsWith("image/")) {
        stageFile(file);
      } else {
        showToast({ title: "Invalid File Type", description: `File "${file.name}" is not an image.`, type: 'error' });
      }
    });
    fileInput.value = "";
  }

  function handleUrlAdd() {
    const url = urlInput.value.trim();
    if (url) {
      stageFile(url);
      urlInput.value = "";
    } else {
      showToast({ title: "Invalid URL", description: "Please enter a valid image URL.", type: 'error' });
    }
  }

  function stageFile(source) {
    const uniqueId = `upscale-pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    stagedFiles.set(uniqueId, source);
    addPendingItemToUI(uniqueId, source);
    updateControlsVisibility();
  }

  function addPendingItemToUI(id, source) {
    const isFile = source instanceof File;
    const name = isFile ? source.name : source.split('/').pop();
    const objectURL = isFile ? URL.createObjectURL(source) : source;

    const div = document.createElement("div");
    div.className = "pending-item";
    div.id = id;
    div.innerHTML = `
      <img class="pending-item__thumbnail" src="${objectURL}" alt="preview">
      <div class="pending-item__details">
        <span class="pending-item__name">${name}</span>
      </div>
      <div class="pending-item__actions">
        <button class="pending-item__button pending-item__button--remove" title="Remove"><i data-feather="x"></i></button>
      </div>`;
    stagingArea.appendChild(div);
    feather.replace();

    div.querySelector(".pending-item__button--remove").addEventListener("click", () => {
      stagedFiles.delete(id);
      div.remove();
      updateControlsVisibility();
    });
  }

  function startBatchUpscaling() {
    if (stagedFiles.size === 0) {
      showToast({ title: "No Images Added", description: "Please add images to the staging area first.", type: 'error' });
      return;
    }
     if (!REPLICATE_API_TOKEN || !CLOUD_NAME || !UPLOAD_PRESET) {
      showToast({ title: 'Configuration Error', description: 'API tokens or Cloudinary details are not set in upscaler.js', type: 'error' });
      return;
    }

    startBtn.disabled = true;
    const filesToProcess = new Map(stagedFiles);
    stagedFiles.clear();
    stagingArea.innerHTML = "";
    updateControlsVisibility();

    filesToProcess.forEach((source, id) => processSingleFile(id, source));
  }

  async function processSingleFile(id, source) {
    const isFile = source instanceof File;
    const name = isFile ? source.name : "URL_Upload.jpg";
    const progressItem = createProgressItem(id, name, "Preparing...");
    progressContainer.appendChild(progressItem);
    try {
      const publicUrl = isFile ? await uploadToCloudinary(source, id) : source;
      const prediction = await startReplicateJob(publicUrl, id);
      pollForResults(prediction.urls.get, id, name, publicUrl);
    } catch (error) {
      updateProgress(id, `Error: ${error.message}`, true);
    }
  }

  const updateProgress = (id, message, isError = false) => {
    const item = document.getElementById(`progress-${id}`);
    if (item) {
      item.querySelector('.progress-item__status').textContent = message;
      if (isError) item.classList.add('progress-item--error');
    }
  };
  
  function createProgressItem(id, name, status) {
    const div = document.createElement("div");
    div.className = "progress-item";
    div.id = `progress-${id}`;
    div.innerHTML = `
      <div class="progress-item__preview"><i data-feather="image"></i></div>
      <div class="progress-item__details">
          <div class="progress-item__name">${name}</div>
          <div class="progress-item__status">${status}</div>
      </div>`;
    feather.replace();
    return div;
  }

  function uploadToCloudinary(file, id) {
    updateProgress(id, "1/3: Uploading to Cloudinary...");
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUDINARY_URL, true);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).secure_url);
        else {
             // Cloudinary error (usually JSON)
             const errorText = xhr.responseText;
             try {
                const errorData = JSON.parse(errorText);
                reject(new Error(`Cloudinary error: ${errorData?.error?.message || 'Upload failed'}`));
             } catch {
                // Proxy error (usually HTML)
                reject(new Error(`Proxy/Upload Failed. Check console for details. Response: ${errorText.substring(0, 50)}...`));
             }
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload."));
      xhr.send(formData);
    });
  }

  async function startReplicateJob(imageUrl, id) {
    updateProgress(id, "2/3: Starting AI job...");
    const response = await fetch(REPLICATE_API_URL, {
      method: "POST",
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ version: UPSCALER_MODEL_VERSION, input: { img: imageUrl, scale: parseInt(scaleSelect.value) } }),
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');

    if (response.status !== 201) {
      let errorMessage = `API Error (${response.status}): `;
      if (isJson) {
        const errorData = await response.json();
        errorMessage += errorData.detail || "Unknown Replicate Error";
      } else {
         errorMessage += `Proxy/Replicate failed. Response Status: ${response.status}. Check console for details.`;
      }
      throw new Error(errorMessage);
    }
    
    if (!isJson) throw new Error("Replicate response was not JSON (Possible Proxy/CORS issue).");

    const prediction = await response.json();
    return prediction;
  }

  function pollForResults(statusUrl, id, name, originalUrl) {
    updateProgress(id, "3/3: AI is processing...");
    // Prepend CORS_PROXY because the URL is returned by Replicate without it
    const proxyStatusUrl = `${CORS_PROXY}${statusUrl}`;

    const poll = setInterval(async () => {
      try {
        const response = await fetch(proxyStatusUrl, { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } });

        const isJson = response.headers.get('content-type')?.includes('application/json');

        if (!isJson) {
             clearInterval(poll);
             throw new Error("Proxy/Replicate status check failed (non-JSON response).");
        }
        
        const result = await response.json();
        
        if (result.status === "succeeded") {
          clearInterval(poll);
          document.getElementById(`progress-${id}`)?.remove();
          saveToHistory({ name: `${name} (${scaleSelect.value}x)`, url: result.output, type: 'upscale' });
          displayResult(name, originalUrl, result.output);
          showToast({ title: "Upscale Successful", description: name, type: 'success' });
        } else if (result.status === "failed" || result.status === "canceled") {
          clearInterval(poll);
          throw new Error(`AI failed: ${result.error || 'Unknown'}`);
        }
      } catch (error) {
        clearInterval(poll);
        updateProgress(id, `Error: ${error.message}`, true);
      }
    }, 3000);
  }

  function displayResult(name, originalUrl, upscaledUrl) {
    const resultCard = document.createElement("div");
    resultCard.className = "upscaler-result-card";
    resultCard.innerHTML = `
        <div class="upscaler-result-card__header"><span class="upscaler-result-card__filename">${name}</span></div>
        <div class="upscaler-result-card__body">
            <div class="upscaler-result-card__image-container">
                <span class="upscaler-result-card__label">Original</span>
                <img src="${originalUrl.replace('/upload/', '/upload/w_400,h_400,c_limit/')}" alt="Original">
            </div>
            <div class="upscaler-result-card__image-container">
                <span class="upscaler-result-card__label">Upscaled (${scaleSelect.value}x)</span>
                <img src="${upscaledUrl}" alt="Upscaled">
            </div>
        </div>
        <div class="upscaler-result-card__actions">
             <a href="#" class="upload-area__button upload-area__button--secondary copy-link-btn"><i data-feather="link"></i>Copy Link</a>
            <a href="${upscaledUrl}" download="${name.split('.')[0]}_upscaled.png" class="upload-area__button"><i data-feather="download"></i> Download</a>
        </div>`;
    resultContainer.prepend(resultCard);
    
    resultCard.querySelector('.copy-link-btn').addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(upscaledUrl);
        showToast({ title: "Copied!", description: "Upscaled URL copied to clipboard.", type: 'success' });
    });
    
    feather.replace();
  }
}