// JS/components.js
import { isInWishlist, toggleWishlist } from "./state.js";
import { sanitizeText, formatCurrency } from "./utils.js";
import { showToast } from "./ui.js";

/**
 * Helper to inject Cloudinary transformations for performance and layout stability.
 * It strictly enforces dimensions to prevent layout shifts.
 * @param {string} url - The original image URL (potentially high-res from Admin).
 * @param {number} width - The desired width (500 for cards, 150 for cart).
 * @returns {string} - The optimized URL.
 */
const getOptimizedImageUrl = (url, width = 500) => {
  if (!url)
    return `https://placehold.co/${width}x${width}/f5f3ed/1a1a1a?text=No+Image`;

  // Only optimize Cloudinary URLs
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    // REGEX EXPLANATION:
    // Matches "/upload/" followed optionally by any existing transformations (chars not containing /), followed by a slash.
    // This allows us to REPLACE the Admin's "w_1080" with our "w_500" for the card view.
    const regex = /\/upload\/(?:[^\/]+\/)?/;

    // We force: w_{width}, Aspect Ratio 1:1, Crop Fill, Format Auto (WebP), Quality Auto
    return url.replace(
      regex,
      `/upload/w_${width},ar_1:1,c_fill,f_auto,q_auto/`
    );
  }
  return url;
};

/**
 * Generates the HTML string for a single, consistent product card.
 * @param {object} product - The product object.
 * @returns {string} HTML string for the product card.
 */
export const generateProductCardHTML = (product) => {
  if (!product) return "";

  const isFavorite = isInWishlist(product.id);

  // 1. Get the Raw URL (likely 1080x1080 from Admin)
  const rawUrl =
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : null;

  // 2. FORCE RESIZE to 500px Square for the Grid View
  const imageUrl = getOptimizedImageUrl(rawUrl, 500);

  const modelName = sanitizeText(product.name);

  // Brand Badge HTML
  const brandBadgeHTML = product.brand
    ? `<span class="product-card-brand">${sanitizeText(product.brand)}</span>`
    : "";

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card-inner">
        <div class="product-card-image-container">
          <a href="#/product/${product.id}">
            <img src="${imageUrl}" alt="${modelName}" class="product-card-image" loading="lazy" />
          </a>
          <button class="product-card-fav-btn"
                  aria-label="Toggle Wishlist"
                  data-product-id="${product.id}"
                  data-is-favorite="${isFavorite}">
            <i data-lucide="heart" ${
              isFavorite ? 'data-fill="true"' : ""
            } style="width:18px;"></i>
          </button>
          <div class="product-card-badge">${sanitizeText(
            product.category
          )}</div>
        </div>
        <div class="product-card-info">
           <div class="product-card-rating">
                <div class="product-rating-score">
                    <i data-lucide="star" class="star" style="width:14px; height:14px; fill: #f59e0b; color: #f59e0b;"></i>
                    <span class="text">${product.rating}</span>
                </div>
              ${brandBadgeHTML}
              </div>
          <a href="#/product/${product.id}"><h3>${modelName}</h3></a>
          <div class="product-card-buy-actions">
            <p class="product-card-price">${formatCurrency(product.price)}</p>
            <button class="product-card-add-btn" data-product-id="${
              product.id
            }">
                <i data-lucide="plus" style="width:14px;"></i>
                <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>`;
};

/**
 * Generates the HTML for a specified number of product card skeletons.
 * @param {number} count - The number of skeletons to generate.
 * @returns {string} HTML string of skeleton elements.
 */
export const generateProductCardSkeletonHTML = (count = 1) => {
  const skeleton = `
    <div class="product-card-skeleton">
        <div class="image animate-shimmer"></div>
        <div class="info">
            <div class="line1 animate-shimmer"></div>
            <div class="line2 animate-shimmer"></div>
        </div>
    </div>`;
  return Array(count).fill(skeleton).join("");
};

/**
 * Attaches delegated event listeners to a container for all product cards within it.
 * @param {HTMLElement} container - The DOM element containing the product cards.
 */
export const attachProductCardListeners = (container) => {
  if (!container) return;

  const handleWishlistClick = async (e) => {
    // Prevent default anchor click if inside one (though button is usually above)
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const productId = button.dataset.productId;
    const isCurrentlyFavorite = button.dataset.isFavorite === "true";

    if (!productId) return;

    button.disabled = true;

    // Optimistic UI update
    const icon = button.querySelector("i");
    if (!isCurrentlyFavorite) {
      icon.setAttribute("data-fill", "true");
      icon.style.fill = "currentColor"; // Visual feedback immediately
    } else {
      icon.removeAttribute("data-fill");
      icon.style.fill = "none";
    }

    await toggleWishlist(productId);

    // Confirm state from store
    const isNowFavorite = isInWishlist(productId);
    button.dataset.isFavorite = isNowFavorite.toString();

    // Re-apply correct visual state based on truth
    if (isNowFavorite) {
      icon.setAttribute("data-fill", "true");
      icon.style.fill = "currentColor";
      showToast({
        title: "Wishlist Updated",
        description: "Item added to your favorites.",
      });
    } else {
      icon.removeAttribute("data-fill");
      icon.style.fill = "none";
      showToast({
        title: "Wishlist Updated",
        description: "Item removed from your favorites.",
      });
    }

    button.disabled = false;
  };

  // We attach to the specific buttons, but we can do it via delegation if preferred.
  // Here we assume this is called AFTER render.
  container.querySelectorAll(".product-card-fav-btn").forEach((button) => {
    // Remove old listeners if any to avoid duplicates
    const newBtn = button.cloneNode(true);
    button.parentNode.replaceChild(newBtn, button);

    newBtn.addEventListener("click", handleWishlistClick);
  });
};

/**
 * Generates the HTML for a cart item card.
 * @param {object} item - The cart item object.
 * @returns {string} HTML string for the cart item.
 */
export const generateCartItemHTML = (item) => {
  const rawUrl =
    item.images && item.images.length > 0 && item.images[0]
      ? item.images[0]
      : item.image || null;

  // Use even smaller image for cart (150px)
  const imageUrl = getOptimizedImageUrl(rawUrl, 150);

  return `
    <div class="cart-item-card" data-item-id="${item.id}">
      <img src="${imageUrl}" alt="${sanitizeText(
    item.name
  )}" class="cart-item-image" loading="lazy">
      <div class="cart-item-details">
        <p class="cart-item-name">${sanitizeText(item.name)}</p>
        <p class="cart-item-category">${sanitizeText(item.category)}</p>
        <p class="cart-item-price">${formatCurrency(item.price)}</p>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-control">
          <button class="quantity-btn" data-action="decrease" aria-label="Decrease quantity">
            <i data-lucide="minus" style="width:16px; height:16px; pointer-events:none;"></i>
          </button>
          <span class="quantity-value">${item.quantity}</span>
          <button class="quantity-btn" data-action="increase" aria-label="Increase quantity">
            <i data-lucide="plus" style="width:16px; height:16px; pointer-events:none;"></i>
          </button>
        </div>
        <button class="remove-item-btn" data-action="remove">Remove</button>
      </div>
    </div>`;
};

export const generateEmptyStateHTML = ({
  icon,
  title,
  text,
  buttonLink,
  buttonText,
}) => {
  const buttonHTML =
    buttonLink && buttonText
      ? `<a href="${buttonLink}" class="empty-cart-button">${sanitizeText(
          buttonText
        )}</a>`
      : "";

  return `
    <div class="empty-cart-content">
         <i data-lucide="${icon}" class="empty-cart-icon"></i>
         <h2 class="empty-cart-title">${sanitizeText(title)}</h2>
         <p class="empty-cart-text">${sanitizeText(text)}</p>
         ${buttonHTML}
    </div>`;
};

export const generateToastHTML = ({ title, description }) => {
  return `
    <p class="toast-title">${sanitizeText(title)}</p>
    ${
      description
        ? `<p class="toast-description">${sanitizeText(description)}</p>`
        : ""
    }
  `;
};
