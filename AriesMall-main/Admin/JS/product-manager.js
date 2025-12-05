// Admin/JS/product-manager.js

import { supabase } from "../../JS/supabase-client.js";
import { showToast } from "./ui.js";
import { initSlideManager } from "./slides-manager.js";
// IMPORT: We need the currency formatter from the main site's utils.js
import { formatCurrency } from "../../JS/utils.js";

let products = [];
let productModal,
  productForm,
  productTableBody,
  productMobileGrid,
  modalTitle,
  searchInput;

// New helper function to create mobile product card HTML
const createProductCard = (product) => {
  // Fallback image logic for Admin Table display
  const imageSrc =
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : "https://placehold.co/100x100?text=No+Img";

  return `
    <div class="pm-card product-card">
        <div class="product-card__top">
            <img src="${imageSrc}" alt="${
    product.name
  }" class="product-card__image">
            <div class="product-card__details">
                <p class="product-card__name">${product.brand} - ${
    product.name
  }</p> <!-- Display Brand & Name -->
                <p class="product-card__category">Category: ${
                  product.category
                }</p>
            </div>
        </div>
        <div class="product-card__meta">
            <p>Price:</p>
            <p class="product-card__price">${formatCurrency(
              product.price
            )}</p> <!-- FIXED: Use formatCurrency -->
        </div>
        <div class="product-card__actions">
            <button class="action-btn action-btn--edit" data-id="${
              product.id
            }"><i data-feather="edit-2"></i><span> Edit</span></button>
            <button class="action-btn action-btn--delete" data-id="${
              product.id
            }"><i data-feather="trash-2"></i><span> Delete</span></button>
        </div>
    </div>`;
};

const renderProducts = (productsToRender = products) => {
  if (!productTableBody || !productMobileGrid) return; // Check for both containers

  // Note: Colspan is now 6
  if (productsToRender.length === 0) {
    const emptyMessage = `<p style="text-align:center; padding: 2rem;">No products found.</p>`;
    productTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No products found.</td></tr>`;
    productMobileGrid.innerHTML = emptyMessage;
    return;
  }

  // 1. Render Table (Desktop View)
  productTableBody.innerHTML = productsToRender
    .map((product) => {
      // Fallback image logic for Admin Table display
      const imageSrc =
        product.images && product.images.length > 0 && product.images[0]
          ? product.images[0]
          : "https://placehold.co/100?text=No+Img";

      return `
    <tr>
      <td><img src="${imageSrc}" alt="${
        product.name
      }" class="product-table__image"></td>
      <td>${product.name}</td>
      <td>${product.brand}</td> <!-- NEW COLUMN DATA -->
      <td>${product.category}</td>
      <td>${formatCurrency(
        product.price
      )}</td> <!-- FIXED: Use formatCurrency -->
      <td>
        <div class="product-table__actions">
          <button class="action-btn action-btn--edit" data-id="${
            product.id
          }"><i data-feather="edit-2"></i></button>
          <button class="action-btn action-btn--delete" data-id="${
            product.id
          }"><i data-feather="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
    })
    .join("");

  // 2. Render Mobile Grid
  productMobileGrid.innerHTML = productsToRender
    .map(createProductCard)
    .join("");

  feather.replace();
};

const fetchProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching products:", error);
    showToast({
      title: "Error",
      description: "Could not fetch products.",
      type: "error",
    });
    return;
  }
  products = data;
  renderProducts();
};

const handleSearch = (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();
  if (!searchTerm) {
    renderProducts(products);
    return;
  }
  const filtered = products.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(searchTerm)) ||
      (p.category && p.category.toLowerCase().includes(searchTerm)) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm)) // NEW: Include Brand in search
  );
  renderProducts(filtered);
};

const openModal = (product = null) => {
  productForm.reset();
  if (product) {
    modalTitle.textContent = "Edit Product";
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-brand").value = product.brand || ""; // NEW: Load Brand
    document.getElementById("product-price").value = product.price; // NOTE: Input fields always get raw number
    document.getElementById("product-category").value = product.category;
    document.getElementById("product-description").value =
      product.description || "";

    // --- IMAGE LOGIC (Split Array) ---
    const allImages = product.images || [];

    // Main Image is always index 0. If it's an empty string "", the field will be empty.
    document.getElementById("product-image-main").value = allImages[0] || "";

    // Gallery is everything from index 1 onwards
    document.getElementById("product-images-gallery").value =
      allImages.slice(1).join(", ") || "";
    // -----------------------------------------

    document.getElementById("product-features").value =
      product.features?.join(", ") || "";
    document.getElementById("product-warranty").value = product.warranty || "";
  } else {
    modalTitle.textContent = "Add New Product";
    document.getElementById("product-id").value = "";
    // Ensure brand input is clear for new products
    document.getElementById("product-brand").value = "";
  }
  productModal.classList.remove("hidden");
  // Removed body.modal-open to prevent scroll lock (as fixed in previous steps)
};

const closeModal = () => {
  productModal.classList.add("hidden");
  // Removed body.modal-open cleanup
};

const handleFormSubmit = async (e) => {
  e.preventDefault();

  // Disable save button and show spinner (standard UX improvement)
  const saveButton = e.submitter;
  saveButton.disabled = true;
  saveButton.innerHTML = `<div class="preloader-spinner" style="width:20px; height:20px;"></div>`;

  const formData = new FormData(productForm);
  const productData = Object.fromEntries(formData.entries());
  const id = productData.id;

  // --- Image Logic ---
  const mainImage = productData.image_main.trim();
  const galleryStr = productData.images_gallery.trim();
  const galleryArray = galleryStr
    ? galleryStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  let finalImages = [];

  if (mainImage) {
    finalImages = [mainImage, ...galleryArray];
  } else if (galleryArray.length > 0) {
    finalImages = ["", ...galleryArray];
  } else {
    finalImages = [];
  }

  productData.images = finalImages;

  // Clean up temporary fields
  delete productData.image_main;
  delete productData.images_gallery;

  // --- Data Cleaning ---
  productData.brand = productData.brand.trim(); // NEW: Ensure brand is cleaned
  productData.features = productData.features.trim()
    ? productData.features.split(",").map((s) => s.trim())
    : [];

  productData.price = parseFloat(productData.price); // Keep price as raw number

  let error;
  if (id) {
    const { error: updateError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id);
    error = updateError;
  } else {
    delete productData.id;
    const { error: insertError } = await supabase
      .from("products")
      .insert([productData]);
    error = insertError;
  }

  // Re-enable button
  saveButton.disabled = false;
  saveButton.innerHTML = `Save Product`;

  if (error) {
    showToast({
      title: "Error",
      description: `Could not save product: ${error.message}`,
      type: "error",
    });
  } else {
    showToast({
      title: "Success",
      description: `Product successfully ${id ? "updated" : "created"}.`,
      type: "success",
    });
    closeModal();
    fetchProducts();
  }
};

const handleDelete = async (id) => {
  if (!confirm("Are you sure you want to delete this product?")) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    showToast({
      title: "Error",
      description: "Could not delete product.",
      type: "error",
    });
  } else {
    showToast({
      title: "Success",
      description: "Product deleted.",
      type: "success",
    });
    fetchProducts();
  }
};

const setupTabNavigation = () => {
  const tabButtons = document.querySelectorAll(".media-tab-button");
  const tabPanels = document.querySelectorAll(".media-tab-panel");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanels.forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      document
        .getElementById(`${button.dataset.tab}-panel`)
        .classList.add("active");
    });
  });
};

export const initProductManager = () => {
  productModal = document.getElementById("product-modal");
  productForm = document.getElementById("product-form");
  productTableBody = document.getElementById("product-table-body");
  productMobileGrid = document.getElementById("product-mobile-grid"); // Initialized mobile grid
  modalTitle = document.getElementById("modal-title");
  searchInput = document.getElementById("product-search-input");

  fetchProducts();

  document
    .getElementById("add-product-btn")
    .addEventListener("click", () => openModal());
  document
    .getElementById("close-modal-btn")
    .addEventListener("click", closeModal);
  document.getElementById("cancel-btn").addEventListener("click", closeModal);
  productForm.addEventListener("submit", handleFormSubmit);

  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  const addProductEventListeners = (container) => {
    container.addEventListener("click", (e) => {
      const editButton = e.target.closest(".action-btn--edit");
      const deleteButton = e.target.closest(".action-btn--delete");
      if (editButton) {
        const product = products.find((p) => p.id == editButton.dataset.id);
        openModal(product);
      }
      if (deleteButton) {
        handleDelete(deleteButton.dataset.id);
      }
    });
  };

  addProductEventListeners(productTableBody);
  if (productMobileGrid) addProductEventListeners(productMobileGrid);

  productModal.addEventListener("click", (e) => {
    if (e.target === productModal) closeModal();
  });

  setupTabNavigation();
  initSlideManager();
};
