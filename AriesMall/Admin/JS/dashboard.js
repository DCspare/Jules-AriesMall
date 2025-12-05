// Admin/JS/dashboard.js

// Import the Supabase client
import { supabase } from "../../JS/supabase-client.js";

// Standalone function to fetch all products for the dashboard
async function fetchAllProducts() {
    if (!supabase) return [];

    // Fetching all products, ordered by creation date descending
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false }); 
      
    if (error) {
      console.error("Dashboard data fetch error:", error);
      return [];
    }
    return data;
}

// --- RENDER FUNCTIONS ---

function renderStats(products) {
// ... (content remains the same) ...
  const totalProducts = products.length;
  const uniqueCategories = new Set(products.map(p => p.category)).size;
  
  const totalProductsEl = document.getElementById('stat-total-products');
  const totalCategoriesEl = document.getElementById('stat-total-categories');

  if (totalProductsEl) totalProductsEl.textContent = totalProducts;
  if (totalCategoriesEl) totalCategoriesEl.textContent = uniqueCategories;
}

function renderCategoryDistribution(products) {
  const container = document.getElementById('category-distribution-list');
  if (!container) return; // Prevent error if container is not loaded yet
  
  const categoryCounts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  
  let html = '';
  sortedCategories.forEach(([category, count]) => {
    html += `
      <div class="category-item">
        <span class="category-item__name">${category}</span>
        <span class="category-item__count">${count} Products</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderLatestProducts(products) {
  const container = document.getElementById('latest-products-list');
  if (!container) return; // Prevent error if container is not loaded yet
  
  const latestProducts = products.slice(0, 5); 
  
  if (latestProducts.length === 0) {
    container.innerHTML = '<p class="empty-state">No products found in the database.</p>';
    return;
  }
  
  let html = '';
  latestProducts.forEach(product => {
    const placeholderImage = 'https://placehold.co/60x60/eee/aaa?text=N/A';
    const image = product.images && product.images[0] ? product.images[0] : placeholderImage;
    
    html += `
      <div class="product-item">
        <img src="${image}" alt="${product.name}" class="product-item__image">
        <div class="product-item__details">
          <p class="product-item__name">${product.name}</p>
          <p class="product-item__category">${product.category}</p>
        </div>
        <p class="product-item__price">$${product.price ? product.price.toFixed(2) : 'N/A'}</p>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// --- INITIALIZATION (Exported for Router use) ---

export async function initDashboard() {
  try {
    // Fetch product data from Supabase
    const products = await fetchAllProducts();
    
    // Use the fetched data to render all dashboard components
    renderStats(products);
    renderCategoryDistribution(products);
    renderLatestProducts(products);
    
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) {
        dashboardGrid.innerHTML =
            `<div class="content-wrapper"><p class="error-message">A critical error occurred while loading dashboard data.</p></div>`;
    }
  }
}
