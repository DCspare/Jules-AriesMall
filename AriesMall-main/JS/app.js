// JS/app.js
// Main application entry point.
import { initializeAuth, logoutUser as logout, getAuthState } from "./state.js";
import { supabase } from "./supabase-client.js";
import {
  initializeTheme,
  loadTemplate,
  updateHeaderState,
  toggleTheme,
  getUiState,
  setUiState,
  showToast,
} from "./ui.js";
import { handleRouteChange } from "./router.js";
import { renderCategoryNavigation } from "./ui.js";

const addGlobalEventListeners = () => {
  const header = document.getElementById("main-header");

  header.addEventListener("input", (e) => {
    if (e.target.matches("#desktop-search-input")) {
      const desktopSearchInput = e.target;
      const desktopSearchClearBtn = document.getElementById(
        "desktop-search-clear"
      );
      if (desktopSearchClearBtn) {
        const hasValue = desktopSearchInput.value.length > 0;
        desktopSearchClearBtn.classList.toggle("visible", hasValue);
      }
    }
  });

  header.addEventListener("click", async (e) => {
    let { isMobileMenuOpen, isAuthMenuOpen } = getUiState();
    const target = e.target.closest("button, a");
    if (!target) return;
    const id = target.id;

    if (id === "mobile-menu-toggle" || id === "mobile-menu-close") {
      setUiState({ isMobileMenuOpen: !isMobileMenuOpen });
      document.body.classList.toggle("menu-open", !isMobileMenuOpen);
    } else if (id === "auth-menu-toggle") {
      e.stopPropagation();
      setUiState({ isAuthMenuOpen: !isAuthMenuOpen });
    } else if (id === "theme-toggle-desktop" || id === "theme-toggle-mobile") {
      toggleTheme();
    } else if (id === "logout-button") {
      setUiState({ isAuthMenuOpen: false });
      await logout();
      showToast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
        type: "success",
      });
      window.location.hash = "#/login";
      return;
    } else if (id === "desktop-search-clear") {
      const desktopSearchInput = document.getElementById(
        "desktop-search-input"
      );
      if (desktopSearchInput) {
        desktopSearchInput.value = "";
        target.classList.remove("visible");
        desktopSearchInput.focus();
      }
    } else if (id === "mobile-search-toggle") {
      setUiState({ isMobileSearchOpen: true });
    } else if (id === "mobile-search-close") {
      setUiState({ isMobileSearchOpen: false });
    }

    updateHeaderState();
  });

  document.body.addEventListener(
    "click",
    (e) => {
      const favBtn = e.target.closest(".product-card-fav-btn");
      const addBtn = e.target.closest(".product-card-add-btn");

      if (!favBtn && !addBtn) return;

      const { isAuthenticated } = getAuthState();

      if (!isAuthenticated) {
        e.preventDefault();
        e.stopPropagation();
        showToast({
          title: "Authentication Required",
          description: "Please log in to add items to your cart or wishlist.",
          type: "info",
        });
        setTimeout(() => {
          window.location.hash = "#/login";
        }, 100);
      }
    },
    { capture: true }
  );

  document.addEventListener("submit", (e) => {
    if (e.target.matches("#desktop-search-form, #mobile-search-form")) {
      e.preventDefault();
      const form = e.target;
      const input = form.querySelector('input[type="text"]');
      const query = input.value.trim();

      if (query) {
        window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
        if (form.id === "mobile-search-form") {
          setUiState({ isMobileSearchOpen: false });
          updateHeaderState();
          input.value = "";
        }
      }
    }
  });

  document.getElementById("mobile-nav")?.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      setUiState({ isMobileMenuOpen: false });
      document.body.classList.remove("menu-open");
      updateHeaderState();
    }
  });

  window.addEventListener("click", (e) => {
    let { isAuthMenuOpen } = getUiState();
    if (
      isAuthMenuOpen &&
      !e.target.closest("#auth-menu-toggle") &&
      !e.target.closest(".auth-dropdown")
    ) {
      setUiState({ isAuthMenuOpen: false });
      updateHeaderState();
    }
  });
};

const init = async () => {
  try {
    initializeTheme();

     // 1. Load Templates (Header and Footer)
    await Promise.all([
      loadTemplate("main-header", "./templates/header.html"),
      loadTemplate("main-footer", "./templates/footer.html"),
    ]);

    // 2. Wait for Auth and State Initialization
    // initializeAuth() now ensures state variables (cartState, wishlistState) are populated.
    await initializeAuth();

    if (!supabase) {
      showToast({
        title: "Connection Issue",
        description:
          "Authentication services are unavailable. Using guest mode.",
        type: "error",
        duration: 8000,
      });
    }

    updateHeaderState(); 


    // 4. Render Dynamic Categories
    await renderCategoryNavigation();

    const yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    addGlobalEventListeners();
    await handleRouteChange();
    window.addEventListener("hashchange", handleRouteChange);
  } catch (error) {
    console.error("Failed during application initialization:", error);
  } finally {
    document.getElementById("pre-loader")?.classList.add("hidden");
    const appShell = document.getElementById("app-shell");
    if (appShell) {
      appShell.style.visibility = "visible";
      appShell.style.opacity = "1";
    }
  }
};

document.addEventListener("DOMContentLoaded", init);
