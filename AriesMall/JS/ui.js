// ui.js
import {
  getAuthState,
  getTotalCartItems,
  getTotalWishlistItems,
} from "./state.js";
import { generateToastHTML } from "./components.js";
import { sanitizeText } from "./utils.js";
// NEW: Import the Supabase-backed category fetcher
import { getCategories } from "./api.js"; 

// Your theme and UI state logic is untouched.
let isDark = false;
let isMobileMenuOpen = false;
let isAuthMenuOpen = false;
let isMobileSearchOpen = false;

export const applyTheme = () =>
  document.documentElement.classList.toggle("dark", isDark);

export const toggleTheme = () => {
  isDark = !isDark;
  localStorage.setItem("theme", isDark ? "dark" : "light");
  applyTheme();
  updateHeaderState();
};

export const initializeTheme = () => {
  const storedTheme = localStorage.getItem("theme");
  isDark = storedTheme !== "light";
  applyTheme();
};

export const getUiState = () => ({
  isMobileMenuOpen,
  isAuthMenuOpen,
  isMobileSearchOpen,
});

export const setUiState = (newState) => {
  isMobileMenuOpen = newState.isMobileMenuOpen ?? isMobileMenuOpen;
  isAuthMenuOpen = newState.isAuthMenuOpen ?? isAuthMenuOpen;
  isMobileSearchOpen = newState.isMobileSearchOpen ?? isMobileSearchOpen;
};

export const loadTemplate = async (elementId, url) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    element.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
    element.innerHTML = `<p style="color:red;">Error loading component.</p>`;
  }
};

// --- NEW FUNCTION: RENDER CATEGORIES DYNAMICALLY ---
export const renderCategoryNavigation = async () => {
    const categories = await getCategories();
    
    // Convert categories into HTML links
    const linksHTML = categories.map(cat => {
        // Sanitize category slug (optional but good practice)
        const slug = cat.toLowerCase().replace(/\s+/g, '-'); 
        return `<a href="#/category/${slug}">${cat}</a>`;
    }).join('');

    const desktopContainer = document.getElementById('desktop-category-links');
    const mobileContainer = document.getElementById('mobile-category-links');

    if (desktopContainer) {
        desktopContainer.innerHTML = linksHTML;
    }
    if (mobileContainer) {
        mobileContainer.innerHTML = linksHTML;
    }
}

export const updateHeaderState = () => {
  // All your original header logic is preserved here.
  const themeToggleDesktop = document.getElementById("theme-toggle-desktop");
  if (themeToggleDesktop)
    themeToggleDesktop.innerHTML = `<i data-lucide="${
      isDark ? "sun" : "moon"
    }" style="width: 20px; height: 20px;"></i>`;
  const themeToggleMobileIcon = document.querySelector(
    "#theme-toggle-mobile i"
  );
  if (themeToggleMobileIcon)
    themeToggleMobileIcon.outerHTML = `<i data-lucide="${
      isDark ? "sun" : "moon"
    }"></i>`;
  const mobileThemeText = document.getElementById("mobile-theme-text");
  if (mobileThemeText)
    mobileThemeText.textContent = isDark ? "Light Mode" : "Dark Mode";
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  if (mobileMenuToggle)
    mobileMenuToggle.innerHTML = `<i data-lucide="${
      isMobileMenuOpen ? "x" : "menu"
    }"></i>`;
  const mobileNav = document.getElementById("mobile-nav");
  if (mobileNav) mobileNav.classList.toggle("open", isMobileMenuOpen);
  const mobileSearchBar = document.getElementById("mobile-search-bar");
  if (mobileSearchBar)
    mobileSearchBar.classList.toggle("open", isMobileSearchOpen);
  const totalCartItems = getTotalCartItems();
  const cartLinkDesktop = document.getElementById("desktop-cart-link");
  if (cartLinkDesktop) {
    let badge = cartLinkDesktop.querySelector(".cart-badge");
    if (totalCartItems > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "cart-badge";
        cartLinkDesktop.appendChild(badge);
      }
      badge.textContent = totalCartItems;
    } else if (badge) badge.remove();
  }
  const mobileCartLink = document.querySelector("#mobile-cart-link span");
  if (mobileCartLink)
    mobileCartLink.textContent = `Cart ${
      totalCartItems > 0 ? `(${totalCartItems})` : ""
    }`;
  const totalWishlistItems = getTotalWishlistItems();
  const wishlistLinkDesktop = document.getElementById("desktop-wishlist-link");
  if (wishlistLinkDesktop) {
    let badge = wishlistLinkDesktop.querySelector(".cart-badge");
    if (totalWishlistItems > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "cart-badge";
        wishlistLinkDesktop.appendChild(badge);
      }
      badge.textContent = totalWishlistItems;
    } else if (badge) badge.remove();
  }
  const { isAuthenticated, user } = getAuthState();
  const authDropdownContainer = document.getElementById(
    "auth-dropdown-container"
  );
  if (authDropdownContainer) {
    if (isAuthMenuOpen) {
      let dropdownHTML = "";
      if (isAuthenticated) {
        const fullName = sanitizeText(user.user_metadata?.full_name || "");
        const email = sanitizeText(user.email || "");
        dropdownHTML = `<div class="auth-user-info"><p>${fullName}</p><p class="text-xs text-muted-foreground">${email}</p></div><a href="#/profile">My Profile</a><a href="#/profile/orders">My Orders</a><button id="logout-button" class="logout-button">Sign Out</button>`;
      } else {
        dropdownHTML = `<a href="#/login">Sign In</a><a href="#/signup">Create Account</a>`;
      }
      authDropdownContainer.innerHTML = `<div class="auth-dropdown animate-fade-in">${dropdownHTML}</div>`;
    } else {
      authDropdownContainer.innerHTML = "";
    }
  }
  const mobileAuthLink = document.getElementById("mobile-auth-link");
  if (mobileAuthLink) {
    mobileAuthLink.href = isAuthenticated ? "#/profile" : "#/login";
    mobileAuthLink.querySelector("span").textContent = isAuthenticated
      ? "My Profile"
      : "Sign In";
  }
  lucide.createIcons();
};

// --- THE DEFINITIVE, SELF-CONTAINED TOAST FIX ---
export const showToast = ({
  title,
  description,
  type = "info",
  duration = 5000,
}) => {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const iconName = {
    success: "check-circle",
    error: "alert-circle",
    info: "info",
  }[type];

  // The complete, correct HTML structure for a toast
  toast.innerHTML = `
    <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
    <div class="toast-content">
      ${generateToastHTML({ title, description })}
    </div>
    <button class="toast-close-btn" aria-label="Close notification">
      <i data-lucide="x"></i>
    </button>
  `;

  const closeButton = toast.querySelector(".toast-close-btn");
  let isClosing = false;

  const close = () => {
    if (isClosing) return;
    isClosing = true;
    clearTimeout(timeoutId);
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => toast.remove(), {
      once: true,
    });
  };

  // The self-contained listener. It only affects THIS toast.
  if (closeButton) {
    closeButton.addEventListener("click", close);
  }

  // Auto-close timer
  const timeoutId = setTimeout(close, duration);

  container.appendChild(toast);

  // Render lucide icons now that the toast is ready
  if (window.lucide) {
    lucide.createIcons({ nodes: [toast] });
  }
};

