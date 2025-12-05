// Admin/JS/uploader.js

import { showToast } from './ui.js';
import { saveToHistory } from './media-history.js';
import { getAdminConfig } from './settings.js'; // IMPORT SETTINGS

export async function initUploader() { // ASYNC INIT
  
  // --- 1. FETCH CONFIGURATION FROM SUPABASE ---
  let CONFIG = {};
  try {
    CONFIG = await getAdminConfig();
  } catch (e) {
    console.error(e);
    return; // Stop if config fails
  }

  const CLOUD_NAME = CONFIG.CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = CONFIG.CLOUDINARY_UPLOAD_PRESET;
  const TINYPNG_API_KEY = CONFIG.TINYPNG_API_KEY;
  const CORS_PROXY = CONFIG.CORS_PROXY_URL; 

  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const TINYPNG_API_URL = `${CORS_PROXY}https://api.tinify.com/shrink`;

  // --- IMAGE TRANSFORMATIONS ---
  const IMAGE_TRANSFORMS = {
    desktopSlider: { label: "Desktop Slider", params: "w_1920,ar_16:9,c_pad,b_black,e_upscale,q_auto,f_auto" },
    mobileSlider: { label: "Mobile Slider", params: "w_800,h_1080,e_upscale,q_auto,f_auto" },
    sliderThumbnail: { label: "Slider Thumbnail", params: "w_200,h_200,c_fill,e_upscale,q_auto,f_auto" },
    productImage: { label: "Product Image", params: "w_1080,h_1080,c_fill,e_upscale,q_auto,f_auto" },
    cloudinaryDefault: { label: "Cloudinary Default", params: "" },
  };

  // --- ELEMENT SELECTORS (Assigned inside init) ---
  const uploadArea = document.getElementById("upload-area");
  if (!uploadArea) return; // Exit if not on the Media Hub page

  const browseBtn = document.getElementById("browse-btn");
  const fileInput = document.getElementById("file-input");
  const urlInput = document.getElementById("url-input");
  const addUrlBtn = document.getElementById("add-url-btn");
  const stagingArea = document.getElementById("staging-area");
  const progressContainer = document.getElementById("upload-progress-container");
  const resultContainer = document.getElementById("result-container");
  
  // Assuming GLightbox is available globally
  const lightbox = window.GLightbox ? GLightbox({ selector: ".glightbox" }) : { on: () => {}, reload: () => {} };
  lightbox.on("open", () => {
    if (document.activeElement) document.activeElement.blur();
  });

  const stagedFiles = new Map();

  // --- EVENT LISTENERS ---
  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => handleFileSelect(fileInput.files));
  addUrlBtn.addEventListener("click", handleUrlAdd);

  ["dragenter", "dragover", "dragleave", "drop"].forEach(e => uploadArea.addEventListener(e, preventDefaults));
  ["dragenter", "dragover"].forEach(e => uploadArea.addEventListener(e, () => uploadArea.classList.add("drag-over")));
  ["dragleave", "drop"].forEach(e => uploadArea.addEventListener(e, () => uploadArea.classList.remove("drag-over")));
  uploadArea.addEventListener("drop", handleDrop);

  function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
  function handleDrop(e) { handleFileSelect(e.dataTransfer.files); }

  function handleFileSelect(files) {
    [...files].forEach((file) => {
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
    const uniqueId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    stagedFiles.set(uniqueId, source);
    addPendingItemToUI(uniqueId, source);
  }

  function addPendingItemToUI(id, source) {
    const isFile = source instanceof File;
    const originalName = isFile ? source.name : source.split('/').pop();
    const sanitizedName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    // Both file and URL can technically be optimized, but CORS will likely block it in browser
    const isOptimizable = isFile || (typeof source === 'string'); 

    const div = document.createElement("div");
    div.className = "pending-item";
    div.id = id;
    const thumbSrc = isFile ? URL.createObjectURL(source) : source;

    div.innerHTML = `
      <img class="pending-item__thumbnail" src="${thumbSrc}" alt="preview">
      <div class="pending-item__details">
        <span class="pending-item__name">${originalName}</span>
        <input type="text" class="pending-item__input" value="${sanitizedName}" placeholder="Custom filename (optional)">
        <p class="pending-item__optimization-note">${isOptimizable ? 'Attempting TinyPNG + Cloudinary' : 'Direct Cloudinary Upload'}</p>
      </div>
      <div class="pending-item__actions">
        <button class="pending-item__button pending-item__button--upload" title="Upload"><i data-feather="upload"></i></button>
        <button class="pending-item__button pending-item__button--remove" title="Remove"><i data-feather="x"></i></button>
      </div>`;
    stagingArea.appendChild(div);
    feather.replace();

    div.querySelector(".pending-item__button--upload").addEventListener("click", () => {
      const customName = div.querySelector(".pending-item__input").value.trim();
      uploadFile(id, customName);
    });
    div.querySelector(".pending-item__button--remove").addEventListener("click", () => {
      stagedFiles.delete(id);
      if (isFile) URL.revokeObjectURL(thumbSrc); // Clean up memory if it was a file
      div.remove();
    });
  }

  // Helper to update progress status text
  const updateProgressStatus = (id, message) => {
    const item = document.getElementById(`progress-${id}`);
    if (item) {
      const statusElement = item.querySelector(".progress-item__details > .progress-item__status");
      if(statusElement) statusElement.textContent = message;
    }
  };

  async function uploadFile(id, customFileName) {
    const source = stagedFiles.get(id);
    if (!source) return;
    
    // Don't remove the DOM element yet, wait until successful upload or error
    // document.getElementById(id)?.remove(); // Moved to success block
    
    // NOTE: We don't delete from stagedFiles map yet in case of retry, but for this flow we will assume one-shot
    
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      showToast({ title: 'Configuration Error', description: 'Cloudinary details are not set in uploader.js', type: 'error' });
      return;
    }
    
    // Remove from staging area UI to move to progress area
    document.getElementById(id)?.remove();

    const isFile = source instanceof File;
    const isUrl = typeof source === 'string';
    const originalFileName = isFile ? source.name : (isUrl ? source.split('/').pop() : "Unknown");
    const displayFileName = customFileName || originalFileName.substring(0, originalFileName.lastIndexOf(".")) || originalFileName;

    const progressItem = createProgressItem(id, displayFileName, "Initializing...");
    progressContainer.appendChild(progressItem);
    const progressBarFill = progressItem.querySelector(".progress-bar__fill");

    let finalUploadSource = source;

    try {
      // --- STEP 1: Optimize with Tinypng (Optional / May Fail due to CORS) ---
      if (TINYPNG_API_KEY) {
        try {
          updateProgressStatus(id, `1/2: Optimizing with TinyPNG...`);
          // We attempt optimization. If it fails (CORS/API limit), we catch it and proceed with original.
          finalUploadSource = await optimizeWithTinypng(source, id); 
        } catch (tinyError) {
          console.warn("TinyPNG Optimization failed (likely CORS), skipping...", tinyError);
          updateProgressStatus(id, `Optimization skipped (CORS). Uploading original...`);
          // Show a non-blocking toast
          showToast({ 
            title: "Optimization Skipped", 
            description: "Browser blocked TinyPNG (CORS). Uploading original to Cloudinary.", 
            type: 'info' // Changed from error to info so user knows it's proceeding
          });
          finalUploadSource = source; // Revert to original source
        }
      } else {
        updateProgressStatus(id, "Skipping optimization: API key missing.");
      }
      
      // --- STEP 2: Upload to Cloudinary ---
      updateProgressStatus(id, `2/2: Uploading to Cloudinary...`);
      
      const formData = new FormData();
      formData.append("file", finalUploadSource); 
      formData.append("upload_preset", UPLOAD_PRESET);
      if (customFileName) formData.append("public_id", customFileName);
      
      // Use XHR for upload so we can track progress
      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUDINARY_URL, true);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            progressBarFill.style.width = (e.loaded / e.total) * 100 + "%";
        }
      };

      const cloudinaryResult = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(JSON.parse(xhr.responseText)?.error?.message || "Cloudinary upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error during Cloudinary upload."));
        xhr.send(formData);
      });
      
      // Success
      progressItem.remove();
      stagedFiles.delete(id); // Now we can remove it from memory
      
      const finalName = customFileName || cloudinaryResult.public_id;
      
      showToast({ title: "Upload Successful", description: finalName, type: 'success' });
      
      saveToHistory({ name: finalName, url: cloudinaryResult.secure_url, type: 'upload' });
      displayResult(cloudinaryResult.secure_url, finalName);
      
    } catch (error) {
      progressItem.remove();
      // If it failed, we might want to let the user try again, so maybe don't delete from stagedFiles? 
      // For now, we assume they will add it again.
      showToast({ title: `Upload Failed`, description: error.message, type: 'error' });
      console.error(error);
    }
  }

  // MODIFIED: Unified function for File and URL optimization
  async function optimizeWithTinypng(source, id) {
    const isFile = source instanceof File;
    const updateProgress = (message) => updateProgressStatus(id, `1/2: Optimizing with TinyPNG: ${message}`);
    updateProgress(`Sending ${isFile ? 'file' : 'URL'} to Tinify...`);

    const authHeader = `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`;

    // Note: This fetch will fail in browsers without a proxy due to CORS
    let body;
    let headers = { "Authorization": authHeader };
    
    if (isFile) {
      headers["Content-Type"] = source.type;
      body = source;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({ source: { url: source } });
    }
    
    const response = await fetch(TINYPNG_API_URL, {
      method: "POST",
      headers: headers,
      body: body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`TinyPNG API Error: ${errorData.error || response.statusText}`);
    }
    
    const { output, input } = await response.json();
    
    if (input && output) {
      const compressionRatio = ((1 - (output.size / input.size)) * 100).toFixed(1);
      updateProgress(`Optimized! ${compressionRatio}% smaller.`);
    }

    const optimizedUrl = response.headers.get('Location'); // OR output.url if provided in body
    // Tinypng API usually provides the url in output.url as well
    const finalUrl = optimizedUrl || output?.url;

    if (!finalUrl) throw new Error("TinyPNG did not return an optimized image URL.");
    
    return finalUrl;
  }

  function createProgressItem(id, name, status) {
    const div = document.createElement("div");
    div.className = "progress-item";
    div.id = `progress-${id}`;
    div.innerHTML = `
      <div class="progress-item__preview"><i data-feather="image"></i></div>
      <div class="progress-item__details">
          <div class="progress-item__name">${name}</div>
          <div class="progress-item__status">${status}</div>
          <div class="progress-bar"><div class="progress-bar__fill"></div></div>
      </div>`;
    feather.replace();
    return div;
  }

  function displayResult(baseUrl, fileName) {
    const resultGroup = document.createElement("div");
    resultGroup.className = "result-group";
    const thumbUrl = baseUrl.replace("/upload/", "/upload/w_200,h_200,c_fill/");
    
    let resultItemsHtml = "";
    for (const key in IMAGE_TRANSFORMS) {
        const transform = IMAGE_TRANSFORMS[key];
        const finalUrl = transform.params ? baseUrl.replace("/upload/", `/upload/${transform.params}/`) : baseUrl;
        resultItemsHtml += `
            <div class="result-item">
              <label>${transform.label}</label>
              <div class="result-item__input-group">
                <input type="text" readonly value="${finalUrl}">
                <a href="${finalUrl}" class="result-item__action glightbox" data-description="${transform.label} - ${fileName}"><i data-feather="eye"></i></a>
                <button class="result-item__action result-item__action--copy"><i data-feather="copy"></i></button>
              </div>
            </div>`;
    }
    
    resultGroup.innerHTML = `
      <div class="result-group__header">
        <div class="result-group__header-main">
            <img src="${thumbUrl}" alt="thumbnail" class="result-group__thumbnail">
            <span class="result-group__filename">${fileName}</span>
        </div>
        <i data-feather="chevron-down" class="result-group__chevron"></i>
      </div>
      <div class="result-group__links"><div class="result-group__links-inner">${resultItemsHtml}</div></div>`;
    resultContainer.prepend(resultGroup);

    resultGroup.querySelector(".result-group__header").addEventListener("click", () => resultGroup.classList.toggle("is-open"));
    resultGroup.querySelectorAll(".result-item__action--copy").forEach(button => {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            const url = button.closest(".result-item__input-group").querySelector("input").value;
            navigator.clipboard.writeText(url);
            showToast({ title: "Copied!", description: "URL copied to clipboard.", type: 'success' });
        });
    });

    feather.replace();
    lightbox.reload();
  }
}