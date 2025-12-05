// JS/search.js
import { getProducts } from "./api.js";
import {
  addItemToCart as addToCart,
  toggleWishlist,
  isInWishlist,
} from "./state.js";
import { showToast, updateHeaderState } from "./ui.js";
import {
  generateProductCardHTML,
  generateProductCardSkeletonHTML,
  generateEmptyStateHTML,
  attachProductCardListeners, // Import the listener helper
} from "./components.js";

let searchPageState = {
  products: [],
};

const addSearchPageEventListeners = () => {
  const app = document.getElementById("app");
  const grid = document.getElementById("search-results-grid");
  if (app._searchPageListenersAttached) return;

  // 1. Attach Wishlist/Link listeners centrally (New method)
  if (grid) {
    attachProductCardListeners(grid);
  }

  app.addEventListener("click", (e) => {
    // Only listen for clicks within the search results page context
    const searchContainer = e.target.closest(".search-results-container");
    if (!searchContainer) return;

    const productCard = e.target.closest(".product-card");
    if (!productCard) return;

    const productId = productCard.dataset.productId;
    const product = searchPageState.products.find((p) => p.id === productId);

    // NOTE: Fav button logic is now handled by attachProductCardListeners
    // We only need Add to Cart here

    const addButton = e.target.closest(".product-card-add-btn");
    if (addButton) {
      if (!addButton.classList.contains("added") && product) {
        addToCart(product, 1);
        updateHeaderState();
        showToast({
          title: "Added to Cart",
          description: `${product.name} is now in your cart.`,
        });

        addButton.classList.add("added");
        addButton.innerHTML = "<span>Added!</span>";

        setTimeout(() => {
          if (addButton.classList.contains("added")) {
            addButton.classList.remove("added");
            addButton.innerHTML = `<i data-lucide="plus" style="width:14px;"></i><span>Add</span>`;
            lucide.createIcons({ nodes: [addButton] });
          }
        }, 2000);
      }
      return;
    }
  });

  app._searchPageListenersAttached = true;
};

export const initializeSearchPage = async () => {
  const grid = document.getElementById("search-results-grid");
  const titleEl = document.getElementById("search-query-title");
  const countEl = document.getElementById("results-count");
  const noResultsEl = document.getElementById("no-results-message");

  const params = new URLSearchParams(window.location.hash.split("?")[1]);
  const query = params.get("q");

  if (!query) {
    titleEl.textContent = "Search";
    countEl.textContent = "Please enter a search term in the header.";
    grid.innerHTML = "";
    return;
  }

  titleEl.innerHTML = `Search results for: <span class="search-query-highlight">"${query}"</span>`;
  grid.innerHTML = generateProductCardSkeletonHTML(8); // Use component

  try {
    const allProducts = await getProducts();
    const searchTerm = query.toLowerCase();

    const filteredProducts = allProducts.filter(
      (product) =>
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.category &&
          product.category.toLowerCase().includes(searchTerm)) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm)) // NEW: Include Brand in search
    );

    searchPageState.products = filteredProducts;
    countEl.textContent = `${filteredProducts.length} result(s) found.`;

    if (filteredProducts.length > 0) {
      grid.innerHTML = filteredProducts.map(generateProductCardHTML).join("");
      noResultsEl.style.display = "none";

      // Sync wishlist state on initial render (Note: This is partially redundant
      // if generateProductCardHTML uses isInWishlist, but kept for robustness
      // in case of missing state.)
      const productCards = grid.querySelectorAll(".product-card");
      productCards.forEach((card) => {
        const productId = card.dataset.productId;
        const favButton = card.querySelector(".product-card-fav-btn");
        if (isInWishlist(productId) && favButton) {
          favButton.dataset.isFavorite = "true";
          favButton.querySelector("i")?.setAttribute("data-fill", "true");
        }
      });
    } else {
      grid.innerHTML = "";
      // Use component for "No Results" message
      noResultsEl.innerHTML = generateEmptyStateHTML({
        icon: "search-x",
        title: "No Results Found",
        text: `Sorry, we couldn't find any products matching "${query}". Try searching for something else.`,
        buttonLink: "#/",
        buttonText: "Continue Shopping",
      });
      noResultsEl.style.display = "block";
    }

    addSearchPageEventListeners();
    lucide.createIcons();
  } catch (error) {
    console.error("Failed to fetch search results:", error);
    countEl.textContent = "Could not load results.";
    grid.innerHTML = `<p>There was an error loading the products. Please try again later.</p>`;
  }
};
