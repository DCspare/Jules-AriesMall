// JS/product.js
import { getProductById, getProductsByCategory } from "./api.js";
import {
  addItemToCart,
  toggleWishlist,
  isInWishlist,
  getAuthState,
} from "./state.js";
import { showToast, updateHeaderState } from "./ui.js";
import {
  generateProductCardHTML,
  attachProductCardListeners,
} from "./components.js"; // Added attachProductCardListeners
import { sanitizeText, formatCurrency } from "./utils.js";

// Module-level store for related products to avoid re-fetching
let relatedProductsStore = [];

/**
 * Fetches and renders products related to the current product.
 * @param {object} currentProduct - The main product being displayed.
 */
const renderRelatedProducts = async (currentProduct) => {
  const section = document.getElementById("related-products-section");
  const grid = document.getElementById("related-products-grid");
  if (!section || !grid) return;

  try {
    // Only fetch related products from the same category. Brand filtering is optional here.
    const relatedProducts = await getProductsByCategory(
      currentProduct.category
    );
    relatedProductsStore = relatedProducts
      .filter((p) => p.id !== currentProduct.id)
      .slice(0, 4); // Show up to 4 related products

    if (relatedProductsStore.length > 0) {
      grid.innerHTML = relatedProductsStore
        .map(generateProductCardHTML)
        .join("");
      section.style.display = "block"; // Show the section

      // Attach listeners using the central helper (Fix for wishlist toggle on related cards)
      attachProductCardListeners(grid);

      lucide.createIcons(); // Re-render icons for the new cards
    }
  } catch (error) {
    console.error("Failed to load related products:", error);
    section.style.display = "none";
  }
};

/**
 * Handles clicks within the related products grid using event delegation.
 * NOTE: The Wishlist click logic is now centrally managed by attachProductCardListeners.
 * We only need the Add to Cart logic here.
 * @param {Event} event - The click event.
 */
const handleRelatedProductsClicks = (event) => {
  const addBtn = event.target.closest(".product-card-add-btn");

  if (!addBtn) return;

  // Prevent navigation if a button inside a link is clicked
  event.preventDefault();
  event.stopPropagation();

  const card = event.target.closest(".product-card");
  const productId = card?.dataset.productId;
  if (!productId) return;

  if (addBtn && !addBtn.classList.contains("added")) {
    const productToAdd = relatedProductsStore.find((p) => p.id === productId);
    if (productToAdd) {
      addItemToCart(productToAdd, 1);
      updateHeaderState();

      showToast({
        title: "Added to Cart",
        description: `${productToAdd.name} is now in your cart.`,
      });
      addBtn.classList.add("added");
      addBtn.innerHTML = "<span>Added!</span>";

      setTimeout(() => {
        if (addBtn.classList.contains("added")) {
          addBtn.classList.remove("added");
          addBtn.innerHTML = `<i data-lucide="plus" style="width:14px;"></i><span>Add</span>`;
          lucide.createIcons({ nodes: [addBtn] });
        }
      }, 2000);
    }
  }
};

export const initializeProductDetailPage = async (productId) => {
  relatedProductsStore = [];

  const skeleton = document.getElementById("product-detail-skeleton");
  const content = document.getElementById("product-detail-content");
  const relatedGrid = document.getElementById("related-products-grid");

  if (relatedGrid) {
    if (relatedGrid._clickListener) {
      relatedGrid.removeEventListener("click", relatedGrid._clickListener);
    }
    // We only need the Add to Cart logic delegation here.
    relatedGrid._clickListener = handleRelatedProductsClicks;
    relatedGrid.addEventListener("click", relatedGrid._clickListener);
  }

  try {
    const product = await getProductById(productId);
    if (!product) throw new Error("Product not found.");

    // --- IMAGE HANDLING LOGIC (Retained) ---
    const fallbackImage =
      "https://placehold.co/600x600/f5f3ed/1a1a1a?text=No+Image";

    let sourceImageArray = [];
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      sourceImageArray = product.images;
    } else if (product.image) {
      sourceImageArray = [product.image];
    }

    let images;
    if (sourceImageArray.length > 0) {
      images = sourceImageArray.map((img) => img || fallbackImage);
    } else {
      images = [fallbackImage];
    }
    // --- END: IMAGE HANDLING LOGIC ---

    const features = product.features || [];
    const warranty =
      product.warranty || "Standard manufacturer warranty applies.";

    // --- NEW: BRAND RENDERING ---
    document.getElementById("product-brand").textContent = product.brand
      ? sanitizeText(product.brand)
      : "Generic";
    // --- END NEW ---

    document.getElementById("product-category").textContent = product.category;
    document.getElementById("product-rating-value").textContent =
      product.rating;
    document.getElementById("product-name").textContent = product.name;
    // Apply currency formatter here
    document.getElementById("product-price").textContent = formatCurrency(
      product.price
    );
    document.getElementById("product-description").textContent =
      product.description;

    // SEO: Update Title with Product Name
    document.title = `${product.name} | Aries Mall`;

    const mainImage = document.getElementById("product-main-image");
    const mobileCarousel = document.getElementById("mobile-image-carousel");
    const desktopThumbnails = document.getElementById("desktop-thumbnails");
    const indicatorsContainer = document.getElementById("carousel-indicators");

    mainImage.src = images[0];
    mobileCarousel.innerHTML = images
      .map(
        (img) =>
          `<div class="carousel-image-item"><img src="${img}" alt="${sanitizeText(
            product.name
          )}" loading="lazy"></div>`
      )
      .join("");
    desktopThumbnails.innerHTML = images
      .map(
        (img, index) =>
          `<div class="thumbnail-item ${
            index === 0 ? "active" : ""
          }" data-index="${index}"><img src="${img}" alt="Thumbnail ${
            index + 1
          }" loading="lazy"></div>`
      )
      .join("");
    indicatorsContainer.innerHTML = images
      .map(
        (_, index) =>
          `<div class="indicator-dot ${
            index === 0 ? "active" : ""
          }" data-index="${index}"></div>`
      )
      .join("");

    const detailsContainer = document.getElementById(
      "product-additional-details"
    );
    let detailsHtml = "";
    if (features.length > 0) {
      detailsHtml += `
          <div class="details-section">
            <h2 class="details-section-title">Key Features</h2>
            <ul class="features-list">
              ${features
                .map(
                  (feature) => `
                <li class="feature-item">
                  <i data-lucide="check-circle" class="icon" style="width:20px; height:20px;"></i>
                  <span>${sanitizeText(feature)}</span>
                </li>`
                )
                .join("")}
            </ul>
          </div>`;
    }
    detailsHtml += `
        <div class="details-section">
          <h2 class="details-section-title">Warranty & Service</h2>
          <p class="warranty-text">${sanitizeText(warranty)}</p>
        </div>`;
    detailsContainer.innerHTML = detailsHtml;

    // --- REFACTORED WISHLIST LOGIC (KEEPING IT LOCAL FOR DETAIL PAGE) ---
    const wishlistBtns = [
      document.getElementById("add-to-wishlist-btn"),
      document.getElementById("sticky-wishlist-btn"),
    ].filter((btn) => btn);

    const updateWishlistButtonsUI = () => {
      const isFavorite = isInWishlist(product.id);
      wishlistBtns.forEach((btn) => {
        btn.classList.toggle("active", isFavorite);
        const icon = btn.querySelector("i");
        if (icon) {
          if (isFavorite) {
            icon.setAttribute("fill", "currentColor");
          } else {
            icon.removeAttribute("fill");
          }
        }
      });
    };

    const handleWishlistClick = () => {
      const { isAuthenticated } = getAuthState();
      if (!isAuthenticated) {
        showToast({
          title: "Authentication Required",
          description: "Please log in to add items to your wishlist.",
          type: "info",
        });
        setTimeout(() => {
          window.location.hash = "#/login";
        }, 100);
        return;
      }

      const wasInWishlist = isInWishlist(product.id);
      toggleWishlist(product.id);
      updateHeaderState();
      updateWishlistButtonsUI();
      showToast({
        title: !wasInWishlist ? "Added to Wishlist" : "Removed from Wishlist",
        description: `${product.name} was ${
          !wasInWishlist ? "added" : "removed"
        }.`,
      });
    };

    if (wishlistBtns.length > 0) {
      wishlistBtns.forEach((btn) => {
        btn.onclick = handleWishlistClick;
      });
      updateWishlistButtonsUI();
    }
    // --- END OF REFACTORED WISHLIST LOGIC ---

    let quantity = 1;
    const quantityElements = {
      main: document.getElementById("quantity-value"),
      sticky: document.getElementById("sticky-quantity-value"),
    };
    const updateQuantityDisplay = () => {
      quantityElements.main.textContent = quantity;
      quantityElements.sticky.textContent = quantity;
    };
    const changeQuantity = (amount) => {
      if (quantity + amount >= 1) {
        quantity += amount;
        updateQuantityDisplay();
      }
    };

    document.getElementById("quantity-decrease").onclick = () =>
      changeQuantity(-1);
    document.getElementById("quantity-increase").onclick = () =>
      changeQuantity(1);
    document.getElementById("sticky-quantity-decrease").onclick = () =>
      changeQuantity(-1);
    document.getElementById("sticky-quantity-increase").onclick = () =>
      changeQuantity(1);

    const handleAddToCart = () => {
      const { isAuthenticated } = getAuthState();
      if (!isAuthenticated) {
        showToast({
          title: "Authentication Required",
          description: "Please log in to add items to your cart.",
          type: "info",
        });
        // FIX: Delay redirect to allow toast to render before page changes.
        setTimeout(() => {
          window.location.hash = "#/login";
        }, 100);
        return;
      }

      addItemToCart(product, quantity);
      updateHeaderState();
      showToast({
        title: "Added to Cart",
        description: `${quantity} x ${product.name}`,
      });
    };
    document.getElementById("add-to-cart-btn").onclick = handleAddToCart;
    document.getElementById("sticky-add-to-cart-btn").onclick = handleAddToCart;

    desktopThumbnails.addEventListener("click", (e) => {
      const thumb = e.target.closest(".thumbnail-item");
      if (thumb) {
        mainImage.src = images[thumb.dataset.index];
        desktopThumbnails.querySelector(".active")?.classList.remove("active");
        thumb.classList.add("active");
      }
    });
    mobileCarousel.addEventListener("scroll", () => {
      const scrollLeft = mobileCarousel.scrollLeft;
      const itemWidth = mobileCarousel.offsetWidth;
      const activeIndex = Math.round(scrollLeft / itemWidth);
      indicatorsContainer.querySelector(".active")?.classList.remove("active");
      indicatorsContainer
        .querySelector(`[data-index='${activeIndex}']`)
        ?.classList.add("active");
    });
    const magnifier = document.querySelector(".zoom-magnifier");
    const mainImageWrapper = document.querySelector(
      ".product-main-image-wrapper"
    );
    mainImageWrapper.addEventListener("mousemove", (e) => {
      magnifier.style.display = "block";
      const img = mainImage;
      const { left, top, width, height } = img.getBoundingClientRect();
      let x = e.clientX - left;
      let y = e.clientY - top;
      magnifier.style.backgroundImage = `url(${img.src})`;
      magnifier.style.backgroundSize = `${width * 2}px ${height * 2}px`;
      let bgX = -(x * 2 - magnifier.offsetWidth / 2);
      let bgY = -(y * 2 - magnifier.offsetHeight / 2);
      magnifier.style.backgroundPosition = `${bgX}px ${bgY}px`;
      let magX = x - magnifier.offsetWidth / 2;
      let magY = y - magnifier.offsetHeight / 2;
      magnifier.style.left = `${magX}px`;
      magnifier.style.top = `${magY}px`;
    });
    mainImageWrapper.addEventListener(
      "mouseleave",
      () => (magnifier.style.display = "none")
    );
    const stickyBar = document.getElementById("mobile-sticky-bar");
    const footer = document.getElementById("main-footer");
    const observer = new IntersectionObserver(
      (entries) => {
        stickyBar.classList.toggle("visible", !entries[0].isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (footer) observer.observe(footer);

    await renderRelatedProducts(product);

    skeleton.style.display = "none";
    content.style.display = null;
    lucide.createIcons();
  } catch (error) {
    console.error(error);
    const container = document.querySelector(".product-detail-container");
    container.innerHTML =
      "<h2>Product Not Found</h2><p>The product you are looking for does not exist.</p>";
  }
};
