// JS/router.js
import { authState } from "./state.js";
import { showToast } from "./ui.js";
import { initializeHomePage, cleanupHomePage } from "./home.js";
import { initializeProductDetailPage } from "./product.js";
import { initializeAuthPage } from "./auth.js";
import { initializeCartPage } from "./cart.js";
import { initializeProfilePage } from "./profile.js";
import { initializeSearchPage } from "./search.js";
import { initializeCategoryPage } from "./category.js";

const routes = {
  "/": {
    path: "../pages/home.html",
    initializer: initializeHomePage,
    cleanup: cleanupHomePage,
  },
  "/cart": { path: "../pages/cart.html", initializer: initializeCartPage },
  "/login": { path: "../pages/login.html", initializer: initializeAuthPage },
  "/signup": { path: "../pages/signup.html", initializer: initializeAuthPage },
  "/search": {
    path: "../pages/search-results.html",
    initializer: initializeSearchPage,
  },
};
const protectedRoutes = ["/profile"]; // This will now match any route starting with /profile

// Variable to hold the cleanup function of the current page
let currentPageCleanup = null;

export const handleRouteChange = async () => {
  window.scrollTo(0, 0);

  if (currentPageCleanup) {
    currentPageCleanup();
    currentPageCleanup = null;
  }

  const hash = window.location.hash.substring(1);
  const path = hash.split("?")[0] || "/";
  const appContainer = document.getElementById("app");
  const { user } = authState;

  // Handle protected routes
  if (protectedRoutes.some((p) => path.startsWith(p)) && !user) {
    window.location.hash = "#/login";
    showToast({
      title: "Access Denied",
      description: "Please sign in to view this page.",
    });
    return;
  }
  if (user && (path === "/login" || path === "/signup")) {
    window.location.hash = "#/profile";
    return;
  }

  // --- START: ROUTING LOGIC REFACTORED FOR CORRECTNESS ---

  // NEW: Legacy route redirect for old wishlist URL
  if (path === "/wishlist") {
    window.location.hash = "#/profile/wishlist";
    return;
  }

  // 1. Check for static routes first (exact match)
  const route = routes[path];
  if (route) {
    try {
      const response = await fetch(route.path);
      if (!response.ok) throw new Error(`Failed to load page: ${route.path}`);
      appContainer.innerHTML = await response.text();
      lucide.createIcons();

      if (route.cleanup) {
        currentPageCleanup = route.cleanup;
      }

      if (route.initializer) {
        setTimeout(() => route.initializer(path), 0);
      }
    } catch (error) {
      console.error(error);
      appContainer.innerHTML = "<h1>Error - Could not load page</h1>";
    }
    return; // Exit after handling static route
  }

  // 2. Check for dynamic routes if no static match was found

  // Dynamic route for product detail pages
  if (path.startsWith("/product/")) {
    const productId = path.split("/")[2];
    try {
      const response = await fetch("../pages/product-detail.html");
      if (!response.ok) throw new Error("Page not found");
      appContainer.innerHTML = await response.text();
      lucide.createIcons();
      setTimeout(() => initializeProductDetailPage(productId), 0);
    } catch (error) {
      appContainer.innerHTML = "<h1>404 - Page Not Found</h1>";
    }
    return;
  }

  // Dynamic route for category pages
  if (path.startsWith("/category/")) {
    const categorySlug = path.split("/")[2];
    try {
      const response = await fetch("../pages/category.html");
      if (!response.ok) throw new Error("Page not found");
      appContainer.innerHTML = await response.text();
      lucide.createIcons();
      setTimeout(() => initializeCategoryPage(categorySlug), 0);
    } catch (error) {
      appContainer.innerHTML = "<h1>404 - Page Not Found</h1>";
    }
    return;
  }

  // Dynamic route for profile pages
  if (path.startsWith("/profile")) {
    const subpath = path.split("/")[2]; // e.g., "orders" or "wishlist"
    try {
      const response = await fetch("../pages/profile.html");
      if (!response.ok) throw new Error("Page not found");
      appContainer.innerHTML = await response.text();
      lucide.createIcons();
      // Pass the subpath to the initializer
      setTimeout(() => initializeProfilePage(subpath), 0);
    } catch (error) {
      appContainer.innerHTML = "<h1>404 - Page Not Found</h1>";
    }
    return;
  }

  // 3. If no static or dynamic route matches, show 404
  appContainer.innerHTML = "<h1>404 - Page Not Found</h1>";
};
