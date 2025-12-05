// JS/profile.js
import {
  authState,
  logoutUser as logout,
  wishlistState,
  toggleWishlist,
  addItemToCart,
  getTotalWishlistItems,
} from "./state.js";
import { showToast, updateHeaderState } from "./ui.js";
import { getOrderHistory, getProductById } from "./api.js";
import {
  generateProductCardHTML,
  generateEmptyStateHTML,
} from "./components.js";

// --- RENDER FUNCTIONS (FIXED) ---
const renderProfileInfo = (user) => {
  // FIX: Access user_metadata for full name and use created_at for the date.
  const fullName = user.user_metadata?.full_name || user.email; // Fallback to email
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<div class="profile-card animate-fade-in"><h2>Profile Information</h2><div class="profile-detail"><span class="detail-label">Full Name</span><span class="detail-value">${fullName}</span></div><div class="profile-detail"><span class="detail-label">Email Address</span><span class="detail-value">${user.email}</span></div><div class="profile-detail"><span class="detail-label">Member Since</span><span class="detail-value">${memberSince}</span></div><button id="profile-logout-button" class="logout-button-profile"><i data-lucide="log-out"></i><span>Sign Out</span></button></div>`;
};

const renderOrderHistory = (orders) => {
  if (orders.length === 0)
    return `<div class="profile-card animate-fade-in"><h2>Order History</h2><p>You haven't placed any orders yet.</p></div>`;
  return `<div class="profile-card animate-fade-in"><h2>Order History</h2><div class="order-history-list">${orders
    .map(
      (order) =>
        `<div class="order-card"><div class="order-card-header"><div><span class="order-id">Order #${
          order.id
        }</span><span class="order-date">Placed on ${new Date(
          order.date
        ).toLocaleDateString()}</span></div><span class="order-status status-${order.status.toLowerCase()}">${
          order.status
        }</span></div><div class="order-card-body">${order.items
          .map(
            (item) =>
              `<div class="order-item"><img src="${item.image}" alt="${
                item.name
              }" class="order-item-image"/><div class="order-item-details"><p class="order-item-name">${
                item.name
              }</p><p class="order-item-meta">Qty: ${
                item.quantity
              } &middot; $${item.price.toFixed(2)}</p></div></div>`
          )
          .join(
            ""
          )}</div><div class="order-card-footer"><strong>Order Total: $${order.total.toFixed(
          2
        )}</strong></div></div>`
    )
    .join("")}</div></div>`;
};
const renderWishlist = (products) => {
  if (products.length === 0)
    return generateEmptyStateHTML({
      icon: "heart",
      title: "Your Wishlist is Empty",
      text: "Explore our products and save your favorites!",
      buttonLink: "#/",
      buttonText: "Explore Products",
    });
  return `<div class="profile-card animate-fade-in"><h2>My Wishlist</h2><div class="product-grid">${products
    .map(generateProductCardHTML)
    .join("")}</div></div>`;
};
const renderLoadingState = () => {
  return `<div class="profile-card"><div class="skeleton-loader" style="height: 200px;"></div></div>`;
};

// --- MAIN INITIALIZER ---
export const initializeProfilePage = async (initialView) => {
  const { user } = authState;
  if (!user) return;
  const contentArea = document.getElementById("profile-main-content"),
    navDesktop = document.getElementById("profile-nav"),
    dropdownToggle = document.getElementById("profile-dropdown-toggle"),
    dropdownMenu = document.getElementById("profile-dropdown-menu"),
    dropdownLabel = document.getElementById("profile-dropdown-label"),
    wishlistBadge = document.getElementById("profile-wishlist-badge");

  // FIX: Access user_metadata for the welcome message name.
  document.getElementById("profile-user-name").textContent =
    user.user_metadata?.full_name || "there";

  let orders = null,
    wishlistItems = null;

  const handleLogout = async () => {
    // This now correctly calls the central logout function.
    await logout();
    window.location.hash = "#/login";
    showToast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  const setView = async (view) => {
    [navDesktop, dropdownMenu].forEach((nav) => {
      nav &&
        nav.querySelectorAll(".profile-nav-link").forEach((link) => {
          link.classList.toggle("active", link.dataset.view === view);
        });
    });
    const activeLink = dropdownMenu
      ? dropdownMenu.querySelector(`[data-view="${view}"]`)
      : null;
    if (dropdownLabel && activeLink) {
      const tempNode = activeLink.cloneNode(!0),
        badgeInClone = tempNode.querySelector(".badge");
      badgeInClone && badgeInClone.remove(),
        (dropdownLabel.textContent = tempNode.textContent.trim());
    }
    dropdownMenu && dropdownMenu.classList.remove("open"),
      dropdownToggle && dropdownToggle.classList.remove("open"),
      (contentArea.innerHTML = renderLoadingState());
    switch (view) {
      case "orders":
        orders || (orders = await getOrderHistory(user.id)),
          (contentArea.innerHTML = renderOrderHistory(orders));
        break;
      case "wishlist":
        wishlistItems ||
          (wishlistItems = await Promise.all(
            wishlistState.items.map((id) => getProductById(id))
          )),
          (contentArea.innerHTML = renderWishlist(wishlistItems));
        break;
      case "settings":
        contentArea.innerHTML =
          '<div class="profile-card animate-fade-in"><h2>Settings</h2><p>This feature is not yet implemented.</p></div>';
        break;
      case "profile":
      default:
        contentArea.innerHTML = renderProfileInfo(user);
        document
          .getElementById("profile-logout-button")
          .addEventListener("click", handleLogout);
    }
    lucide.createIcons();
  };
  dropdownToggle &&
    dropdownToggle.addEventListener("click", () => {
      dropdownToggle.classList.toggle("open"),
        dropdownMenu.classList.toggle("open");
    }),
    document.addEventListener("click", (e) => {
      dropdownToggle &&
        !dropdownToggle.contains(e.target) &&
        dropdownMenu &&
        !dropdownMenu.contains(e.target) &&
        (dropdownMenu.classList.remove("open"),
        dropdownToggle.classList.remove("open"));
    }),
    [navDesktop, dropdownMenu].forEach((nav) => {
      nav &&
        nav.addEventListener("click", (e) => {
          const link = e.target.closest(".profile-nav-link");
          link &&
            link.dataset.view &&
            (e.preventDefault(),
            history.replaceState(null, "", `#/profile/${link.dataset.view}`),
            setView(link.dataset.view));
        });
    }),
    contentArea.addEventListener("click", (e) => {
      const favButton = e.target.closest(".product-card-fav-btn"),
        addButton = e.target.closest(".product-card-add-btn");
      if (!favButton && !addButton) return;
      const productCard = e.target.closest(".product-card");
      if (!productCard) return;
      const productId = productCard.dataset.productId;
      if (favButton) {
        e.preventDefault(), e.stopPropagation();
        toggleWishlist(productId),
          wishlistItems &&
            (wishlistItems = wishlistItems.filter((p) => p.id !== productId)),
          (productCard.style.transition = "opacity 0.3s ease"),
          (productCard.style.opacity = "0");
        const newCount = getTotalWishlistItems();
        setTimeout(() => {
          productCard.remove(),
            0 === contentArea.querySelectorAll(".product-card").length &&
              ((contentArea.innerHTML = renderWishlist([])),
              lucide.createIcons()),
            updateHeaderState(),
            wishlistBadge &&
              (newCount > 0
                ? (wishlistBadge.textContent = newCount)
                : (wishlistBadge.style.display = "none"));
        }, 300),
          showToast({ title: "Removed from Wishlist" });
      }
      if (addButton && !addButton.classList.contains("added")) {
        e.preventDefault();
        const product = wishlistItems.find((p) => p.id === productId);
        product &&
          (addItemToCart(product, 1),
          updateHeaderState(),
          showToast({
            title: "Added to Cart",
            description: `${product.name} is now in your cart.`,
          }),
          addButton.classList.add("added"),
          (addButton.innerHTML = "<span>Added!</span>"),
          setTimeout(() => {
            addButton.classList.contains("added") &&
              (addButton.classList.remove("added"),
              (addButton.innerHTML =
                '<i data-lucide="plus" style="width:14px;"></i><span>Add</span>'),
              lucide.createIcons({ nodes: [addButton] }));
          }, 2e3));
      }
    });
  const wishlistCount = getTotalWishlistItems();
  wishlistBadge &&
    (wishlistCount > 0
      ? (wishlistBadge.textContent = wishlistCount)
      : (wishlistBadge.style.display = "none"));
  const validViews = ["profile", "orders", "wishlist", "settings"],
    viewToLoad = validViews.includes(initialView) ? initialView : "profile";
  setView(viewToLoad);
};
