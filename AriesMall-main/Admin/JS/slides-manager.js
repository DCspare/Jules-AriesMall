// Admin/JS/slides-manager.js

import { supabase } from "../../JS/supabase-client.js";
import { showToast } from "./ui.js";

let slides = [];
let slideModal, slideForm, slideTableBody, slideMobileGrid, modalTitle;

// New helper function to create mobile slide card HTML
const createSlideCard = (slide) => {
    const statusClass = slide.is_active ? "slide-table__status--active" : "slide-table__status--inactive";
    const statusText = slide.is_active ? "Active" : "Inactive";
    const imageSrc = slide.thumbnail_url || slide.image_url_mobile || 'https://placehold.co/200x120?text=No+Img';
    
    return `
    <div class="pm-card slide-card">
        <div class="slide-card__image">
            <img src="${imageSrc}" alt="${slide.title || 'Slide'}">
        </div>
        <p class="slide-card__title">${slide.title || '(No Title)'}</p>
        <p class="slide-card__button_text">${slide.button_text || '(No Button)'}</p>
        <div class="slide-card__status-container">
            <span class="slide-table__status ${statusClass}">
                <span class="dot"></span>
                ${statusText}
            </span>
        </div>
        <div class="slide-card__actions">
            <button class="action-btn action-btn--edit" data-id="${slide.id}"><i data-feather="edit-2"></i><span> Edit</span></button>
            <button class="action-btn action-btn--delete" data-id="${slide.id}"><i data-feather="trash-2"></i><span> Delete</span></button>
        </div>
    </div>`;
};

const renderSlides = () => {
  if (!slideTableBody || !slideMobileGrid) return;

  if (slides.length === 0) {
    const emptyMessage = `<p style="text-align:center; padding: 2rem;">No slides found. Add one to get started!</p>`;
    slideTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No slides found. Add one to get started!</td></tr>`;
    slideMobileGrid.innerHTML = emptyMessage;
    return;
  }

  // 1. Render Table (Desktop View)
  slideTableBody.innerHTML = slides.map((slide) => {
    const statusClass = slide.is_active ? "slide-table__status--active" : "slide-table__status--inactive";
    const statusText = slide.is_active ? "Active" : "Inactive";

    return `
      <tr>
        <td>
          <img src="${slide.thumbnail_url || slide.image_url_mobile}" alt="${slide.title || 'Slide'}" class="slide-table__image">
        </td>
        <td>${slide.title || '(No Title)'}</td>
        <td>${slide.button_text || '(No Button)'}</td>
        <td>
          <span class="slide-table__status ${statusClass}">
            <span class="dot"></span>
            ${statusText}
          </span>
        </td>
        <td>
          <div class="product-table__actions">
            <button class="action-btn action-btn--edit" data-id="${slide.id}"><i data-feather="edit-2"></i></button>
            <button class="action-btn action-btn--delete" data-id="${slide.id}"><i data-feather="trash-2"></i></button>
          </div>
        </td>
      </tr>`;
  }).join("");

  // 2. Render Mobile Grid
  slideMobileGrid.innerHTML = slides.map(createSlideCard).join("");
  
  feather.replace();
};

const fetchSlides = async () => {
  const { data, error } = await supabase.from("slides").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching slides:", error);
    showToast({ title: "Error", description: "Could not fetch slides.", type: "error" });
    return;
  }
  slides = data;
  renderSlides();
};

const openModal = (slide = null) => {
  slideForm.reset();
  if (slide) {
    modalTitle.textContent = "Edit Slide";
    document.getElementById("slide-id").value = slide.id;
    document.getElementById("slide-title").value = slide.title || '';
    document.getElementById("slide-description").value = slide.description || '';
    document.getElementById("slide-button_text").value = slide.button_text || '';
    document.getElementById("slide-button_link").value = slide.button_link || '';
    document.getElementById("slide-image_url_desktop").value = slide.image_url_desktop || '';
    document.getElementById("slide-image_url_mobile").value = slide.image_url_mobile || '';
    document.getElementById("slide-thumbnail_url").value = slide.thumbnail_url || '';
    document.getElementById("slide-show_overlay").value = slide.show_overlay;
    document.getElementById("slide-is_active").value = slide.is_active;
  } else {
    modalTitle.textContent = "Add New Slide";
    document.getElementById("slide-id").value = "";
  }
  slideModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
};

const closeModal = () => {
  slideModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
};

const handleFormSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(slideForm);
  const slideData = Object.fromEntries(formData.entries());
  const id = slideData.id;

  // CRITICAL: Convert string 'true'/'false' values back to booleans for the database
  slideData.is_active = slideData.is_active === 'true';
  slideData.show_overlay = slideData.show_overlay === 'true';

  let error;
  if (id) {
    const { error: updateError } = await supabase.from("slides").update(slideData).eq("id", id);
    error = updateError;
  } else {
    delete slideData.id;
    const { error: insertError } = await supabase.from("slides").insert([slideData]);
    error = insertError;
  }

  if (error) {
    showToast({ title: "Error", description: `Could not save slide: ${error.message}`, type: "error" });
  } else {
    showToast({ title: "Success", description: `Slide successfully ${id ? 'updated' : 'created'}.`, type: "success" });
    closeModal();
    fetchSlides();
  }
};

const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    const { error } = await supabase.from("slides").delete().eq("id", id);
    if (error) {
        showToast({ title: "Error", description: "Could not delete slide.", type: "error" });
    } else {
        showToast({ title: "Success", description: "Slide deleted successfully.", type: "success" });
        fetchSlides();
    }
}

export const initSlideManager = () => {
  slideModal = document.getElementById("slide-modal");
  slideForm = document.getElementById("slide-form");
  slideTableBody = document.getElementById("slide-table-body");
  slideMobileGrid = document.getElementById("slide-mobile-grid"); // Initialized mobile grid
  modalTitle = document.getElementById("slide-modal-title");

  fetchSlides();

  document.getElementById("add-slide-btn").addEventListener("click", () => openModal());
  document.getElementById("close-slide-modal-btn").addEventListener("click", closeModal);
  document.getElementById("cancel-slide-btn").addEventListener("click", closeModal);
  slideForm.addEventListener("submit", handleFormSubmit);
  
  const addSlideEventListeners = (container) => {
      container.addEventListener("click", (e) => {
        const editButton = e.target.closest(".action-btn--edit");
        const deleteButton = e.target.closest(".action-btn--delete");
        if (editButton) {
          const slide = slides.find(s => s.id == editButton.dataset.id);
          openModal(slide);
        }
        if (deleteButton) {
          handleDelete(deleteButton.dataset.id);
        }
      });
  };

  addSlideEventListeners(slideTableBody);
  if(slideMobileGrid) addSlideEventListeners(slideMobileGrid);
  
  slideModal.addEventListener('click', (e) => {
    if (e.target === slideModal) closeModal();
  });
};
