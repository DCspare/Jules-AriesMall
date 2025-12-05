// JS/category.js
import { getProductsByCategory } from "./api.js";
import { addItemToCart as addToCart, toggleWishlist, isInWishlist } from "./state.js"; // Added isInWishlist import
import { showToast, updateHeaderState } from "./ui.js";
import {
  generateProductCardHTML,
  generateProductCardSkeletonHTML,
  attachProductCardListeners, // Added: To fix wishlist toggle issue from previous step
} from "./components.js";

// --- STATE MANAGEMENT ---
let categoryPageState = {
  masterProductList: [], // Full list of products for the category
  displayedProducts: [], // Products after filtering/sorting
  currentCategorySlug: null,
  currentBrandSlug: null, // NEW: Active brand filter slug
  availableBrands: [], // NEW: List of unique brands in the category
  currentSort: "default",
  priceFilter: {
    min: null,
    max: null,
  },
};

let priceFilterTimeout;

// --- UTILITY ---
// Helper to normalize text for URL/filtering (e.g., "Bajaj Chetak" -> "bajaj-chetak")
const normalizeSlug = (text) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// --- RENDER FUNCTIONS ---

// NEW: Renders the brand filter section
const renderBrandFilters = () => {
    const container = document.getElementById('brand-filter-container');
    if (!container) return;

    if (categoryPageState.availableBrands.length === 0) {
        container.innerHTML = `<p class="text-muted-foreground text-sm">No brands available.</p>`;
        return;
    }

    const brandButtonsHTML = categoryPageState.availableBrands.map(brand => {
        const slug = normalizeSlug(brand);
        const isActive = slug === categoryPageState.currentBrandSlug;
        return `
            <button class="brand-filter-btn ${isActive ? 'active' : ''}" data-brand-slug="${slug}">
                ${brand}
            </button>
        `;
    }).join('');

    container.innerHTML = `
        <h3 class="filter-title">Filter by Brand</h3>
        <div class="brand-buttons-group">
            <button class="brand-filter-btn ${!categoryPageState.currentBrandSlug ? 'active' : ''}" data-brand-slug="">All Brands</button>
            ${brandButtonsHTML}
        </div>
    `;
};


const renderProductGrid = () => {
  const grid = document.getElementById("category-grid");
  const noProductsMessage = document.getElementById("no-products-message");
  const countEl = document.getElementById("category-product-count");
  const container = document.getElementById('category-page-container'); // Need this to attach listeners

  if (categoryPageState.displayedProducts.length > 0) {
    grid.innerHTML = categoryPageState.displayedProducts
      .map(generateProductCardHTML)
      .join("");
    grid.style.display = "grid";
    noProductsMessage.style.display = "none";
  } else {
    grid.innerHTML = "";
    grid.style.display = "none";
    noProductsMessage.style.display = "block";
  }

  const count = categoryPageState.displayedProducts.length;
  const total = categoryPageState.masterProductList.length;
  countEl.textContent = `Showing ${count} product${
    total !== 1 ? "s" : ""
  }.`;

  lucide.createIcons();
  
  // Attach the global card listeners from components.js here
  attachProductCardListeners(container); 
};

// --- LOGIC FUNCTIONS ---

// NOTE: This now only handles client-side filtering (price/sort), not brand filtering.
const applyFiltersAndSort = () => {
  let filteredProducts = [...categoryPageState.masterProductList];
  
  // 1. Price Filter
  const { min, max } = categoryPageState.priceFilter;
  if (min !== null && min >= 0) {
    filteredProducts = filteredProducts.filter((p) => p.price >= min);
  }
  if (max !== null && max >= 0) {
    filteredProducts = filteredProducts.filter((p) => p.price <= max);
  }

  // 2. Sorting
  switch (categoryPageState.currentSort) {
    case "price-asc":
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case "rating-desc":
      filteredProducts.sort((a, b) => b.rating - a.rating);
      break;
    case "name-asc":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
  }

  categoryPageState.displayedProducts = filteredProducts;
  renderProductGrid();
};

// --- FETCH & INITIALIZATION ---

const fetchAndRenderCategory = async () => {
    const { currentCategorySlug, currentBrandSlug } = categoryPageState;
    
    // Clear the grid and show skeletons
    const grid = document.getElementById("category-grid");
    grid.innerHTML = generateProductCardSkeletonHTML(12);

    try {
        const products = await getProductsByCategory(currentCategorySlug, currentBrandSlug);
        categoryPageState.masterProductList = products;
        
        // 1. Update available brands based on the full category fetch (only run if no brand filter is active)
        if (!currentBrandSlug) {
            const uniqueBrands = new Set(products.map(p => p.brand).filter(b => b && b.length > 0));
            categoryPageState.availableBrands = Array.from(uniqueBrands).sort();
            renderBrandFilters();
        }
        
        // 2. Apply current client-side filters (price/sort) and render
        applyFiltersAndSort();
        
    } catch (error) {
        console.error("Failed to fetch category products:", error);
        document.getElementById("category-product-count").textContent = "Could not load products.";
        grid.innerHTML = `<p>There was an error loading the products. Please try again later.</p>`;
    }
};


// --- EVENT HANDLERS ---

const handleBrandClick = (e) => {
    const button = e.target.closest('.brand-filter-btn');
    if (button) {
        const newBrandSlug = button.dataset.brandSlug;
        
        // Update URL to reflect the new brand filter
        const currentPath = window.location.hash.split('?')[0];
        if (newBrandSlug && newBrandSlug.length > 0) {
            window.location.hash = `${currentPath}?brand=${newBrandSlug}`;
        } else {
            // Remove brand query parameter
            window.location.hash = currentPath;
        }
    }
}

const handleSortChange = (e) => {
  categoryPageState.currentSort = e.target.value;
  applyFiltersAndSort();
};

const handlePriceFilterChange = () => {
  clearTimeout(priceFilterTimeout);

  priceFilterTimeout = setTimeout(() => {
    const minPrice = document.getElementById("min-price")?.value;
    const maxPrice = document.getElementById("max-price")?.value;

    categoryPageState.priceFilter.min = minPrice ? parseFloat(minPrice) : null;
    categoryPageState.priceFilter.max = maxPrice ? parseFloat(maxPrice) : null;

    applyFiltersAndSort();
  }, 500);
};

const addCategoryPageEventListeners = () => {
  const app = document.getElementById("app");
  
  // 1. Price/Sort Listeners (Must be re-attached as HTML replaces them)
  document.getElementById("sort-select")?.addEventListener("change", handleSortChange);
  document.getElementById("min-price")?.addEventListener("input", handlePriceFilterChange);
  document.getElementById("max-price")?.addEventListener("input", handlePriceFilterChange);

  // 2. Brand Listener
  document.getElementById("brand-filter-container")?.addEventListener("click", handleBrandClick);
  
  // 3. Delegation for Add to Cart (The Wishlist fix is now handled by attachProductCardListeners)
  // We keep the cart logic here since it involves state manipulation unique to this page.
  if (!app._categoryPageCartListenerAttached) {
    app.addEventListener("click", (e) => {
      // Check if it's the ADD button within the grid
      const addButton = e.target.closest("#category-grid .product-card-add-btn");
      if (!addButton) return;
      
      e.preventDefault();

      const productCard = e.target.closest(".product-card");
      const productId = productCard?.dataset.productId;
      if (!productId) return;

      const product = categoryPageState.masterProductList.find(
        (p) => p.id === productId
      );

      if (product) {
          // Simple add-to-cart logic
          addToCart(product, 1);
          updateHeaderState();
          showToast({
            title: "Added to Cart",
            description: `${product.name} is now in your cart.`,
            type: 'success'
          });

          // Visual feedback
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
    });

    // Mark the Cart Listener as attached globally
    app._categoryPageCartListenerAttached = true;
  }
};

const resetState = () => {
  categoryPageState = {
    masterProductList: [],
    displayedProducts: [],
    currentCategorySlug: null,
    currentBrandSlug: null, // Reset brand filter
    availableBrands: [], // Reset available brands
    currentSort: "default",
    priceFilter: { min: null, max: null },
  };
};

export const initializeCategoryPage = async (categorySlug) => {
  resetState();

  const titleEl = document.getElementById("category-title");
  
  // Get query parameters from URL for brand filtering
  const params = new URLSearchParams(window.location.hash.split('?')[1]);
  const brandSlug = params.get('brand');
  
  categoryPageState.currentCategorySlug = categorySlug;
  categoryPageState.currentBrandSlug = brandSlug ? normalizeSlug(brandSlug) : null;


  if (!categorySlug) {
    titleEl.textContent = "Category Not Found";
    return;
  }

  // Set the title element
  const categoryName =
    categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
  titleEl.textContent = categoryName.replace(/-/g, ' '); // Clean up the title slug

  // Must call event listeners first to ensure brand filter renders when we fetch
  addCategoryPageEventListeners();

  // If a brand is set, reflect it in the title temporarily
  if (categoryPageState.currentBrandSlug) {
      titleEl.textContent += ` (${categoryPageState.currentBrandSlug.replace(/-/g, ' ').toUpperCase()})`;
  }
  
  await fetchAndRenderCategory();
  lucide.createIcons();
};