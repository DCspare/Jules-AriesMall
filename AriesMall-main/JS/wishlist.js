// JS/wishlist.js
import { getProducts } from "./api.js";
import { wishlistState, toggleWishlist, addItemToCart } from "./state.js";
import { showToast, updateHeaderState } from "./ui.js";
import { generateProductCardHTML } from "./components.js"; // Import component

let wishlistPageProducts = [];

const renderWishlistGrid = () => {
  const grid = document.getElementById("wishlist-grid");
  if (grid) {
    // Use the imported component
    grid.innerHTML = wishlistPageProducts.map(generateProductCardHTML).join("");
    lucide.createIcons();
  }
};

const addWishlistPageEventListeners = () => {
  const grid = document.getElementById("wishlist-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const productCard = e.target.closest(".product-card");
    if (!productCard) return;

    const productId = productCard.dataset.productId;
    const product = wishlistPageProducts.find((p) => p.id === productId);

    const favButton = e.target.closest(".product-card-fav-btn");
    if (favButton) {
      toggleWishlist(productId);
      updateHeaderState();
      showToast({ title: "Removed from Wishlist" });
      productCard.remove();
      wishlistPageProducts = wishlistPageProducts.filter(
        (p) => p.id !== productId
      );
      if (wishlistPageProducts.length === 0) {
        document.getElementById("wishlist-grid").style.display = "none";
        document.getElementById("empty-wishlist-message").style.display =
          "block";
      }
      return;
    }

    const addButton = e.target.closest(".product-card-add-btn");
    if (addButton) {
      if (!addButton.classList.contains("added") && product) {
        addItemToCart(product, 1);
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
            lucide.createIcons({ nodes: [addButton.querySelector("i")] });
          }
        }, 2000);
      }
      return;
    }
  });
};

export const initializeWishlistPage = async () => {
  const grid = document.getElementById("wishlist-grid");
  const emptyMessage = document.getElementById("empty-wishlist-message");

  const wishlistedIds = wishlistState.items;

  if (wishlistedIds.length === 0) {
    grid.style.display = "none";
    emptyMessage.style.display = "block";
    return;
  }

  try {
    const allProducts = await getProducts();
    wishlistPageProducts = allProducts.filter((p) =>
      wishlistedIds.includes(p.id)
    );

    grid.style.display = "grid";
    emptyMessage.style.display = "none";

    renderWishlistGrid();
    addWishlistPageEventListeners();
  } catch (error) {
    console.error("Failed to load wishlist products:", error);
    grid.innerHTML =
      "<p>Error loading your wishlist. Please try again later.</p>";
  }
};
