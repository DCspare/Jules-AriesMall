// JS/cart.js
import { cartState, updateItemQuantity, removeItemFromCart } from "./state.js";
import { updateHeaderState, showToast } from "./ui.js";
import { generateCartItemHTML } from "./components.js"; 
import { formatCurrency } from "./utils.js";

const setupCartEventListeners = () => {
  const cartContentEl = document.getElementById("cart-content");
  if (!cartContentEl || cartContentEl.dataset.listenerAttached) {
    return;
  }

  cartContentEl.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const action = target.dataset.action;
    const itemCard = target.closest(".cart-item-card");
    if (!action || !itemCard) return;

    const itemId = itemCard.dataset.itemId;
    const item = cartState.items.find((i) => i.id == itemId);
    if (!item) return;

    const currentQuantity = Number(item.quantity);

    if (action === "increase") {
      updateItemQuantity(itemId, currentQuantity + 1);
    } else if (action === "decrease") {
      if (currentQuantity > 1) {
        updateItemQuantity(itemId, currentQuantity - 1);
      }
    } else if (action === "remove") {
      removeItemFromCart(itemId);
      showToast({
        title: "Item Removed",
        description: `${item.name} was removed from your cart.`,
      });
    }

    initializeCartPage();
    updateHeaderState();
  });

  cartContentEl.dataset.listenerAttached = "true";
};

export const initializeCartPage = () => {
  const cartContentEl = document.getElementById("cart-content");
  const emptyCartEl = document.getElementById("empty-cart-message");
  const itemsListEl = document.getElementById("cart-items-list");
  const checkoutButton = document.querySelector(".checkout-button");

  if (!cartContentEl || !emptyCartEl || !itemsListEl) return;

  setupCartEventListeners();

  if (cartState.items.length === 0) {
    cartContentEl.style.display = "none";
    emptyCartEl.style.display = "block";
  } else {
    cartContentEl.style.display = "block";
    emptyCartEl.style.display = "none";

    // Use the component to render items
    itemsListEl.innerHTML = cartState.items.map(generateCartItemHTML).join("");

    const subtotal = cartState.items.reduce(
      (sum, item) => sum + item.price * Number(item.quantity),
      0
    );
    
    // Assuming 10% tax rate
    const taxes = subtotal * 0.1;
    const total = subtotal + taxes;

    document.getElementById(
      "summary-subtotal"
    ).textContent = formatCurrency(subtotal);
    document.getElementById("summary-taxes").textContent = formatCurrency(
      taxes
    );
    document.getElementById("summary-total").textContent = formatCurrency(
      total
    );

    checkoutButton.disabled = cartState.items.length === 0;
  }
  lucide.createIcons();
};
