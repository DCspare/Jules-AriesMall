// JS/state.js
// Manages all application state, syncing with Supabase for authenticated users.

import { supabase } from "./supabase-client.js";
import { updateHeaderState } from "./ui.js";

// --- STATE VARIABLES ---
export let authState = { user: null, session: null };
export let cartState = { items: [] };
export let wishlistState = { items: [] };

// --- NEW SUPABASE PRODUCT FETCHING FOR CART ---
/**
 * Fetches detailed product information from the Supabase 'products' table.
 * This is crucial for correctly rendering items in the persistent cart/wishlist.
 * @param {string} productId - The ID of the product.
 * @returns {object|null} The product object or null if not found.
 */
const supabaseProductById = async (productId) => {
    if (!supabase) return null;

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (error) {
        // This is expected if the product ID is old or invalid. Log as a warning.
        console.warn(`Product ID ${productId} not found in Supabase:`, error.message);
        return null;
    }
    return product;
}


// --- DATABASE SYNC FUNCTIONS ---
const fetchUserCart = async (user) => {
  if (!supabase || !user) return [];

  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching user cart:", error);
    return [];
  }

  const detailedItems = await Promise.all(
    cartItems.map(async (item) => {
      // UPDATED to use Supabase Product Fetcher
      const product = await supabaseProductById(item.product_id); 
      return product ? { ...product, quantity: item.quantity } : null;
    })
  );
  return detailedItems.filter(Boolean);
};

const fetchUserWishlist = async (user) => {
  if (!supabase || !user) return [];

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching user wishlist:", error);
    return [];
  }
  return data.map((item) => item.product_id);
};

// --- GUEST (LOCALSTORAGE) FUNCTIONS ---
const persistGuestCart = () =>
  localStorage.setItem("aries-mall-cart", JSON.stringify({ state: cartState }));
const persistGuestWishlist = () =>
  localStorage.setItem(
    "aries-mall-wishlist",
    JSON.stringify({ state: wishlistState })
  );

const rehydrateFromLocalStorage = () => {
  const storedCart = localStorage.getItem("aries-mall-cart");
  cartState = storedCart ? JSON.parse(storedCart).state : { items: [] };

  const storedWishlist = localStorage.getItem("aries-mall-wishlist");
  wishlistState = storedWishlist
    ? JSON.parse(storedWishlist).state
    : { items: [] };
};

const clearGuestData = () => {
  localStorage.removeItem("aries-mall-cart");
  localStorage.removeItem("aries-mall-wishlist");
};

// --- AUTH STATE MANAGEMENT (REFACTORED) ---

/**
 * FIX: Initializes authentication by actively fetching the first session,
 * then sets up a listener for future changes. This resolves the "stuck pre-loader" bug.
 */
export const initializeAuth = () => {
  return new Promise(async (resolve) => {
    if (!supabase) {
      rehydrateFromLocalStorage();
      resolve();
      return;
    }

    // 1. Actively fetch the initial session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    authState.session = session;
    authState.user = session?.user ?? null;

    if (session) {
      // User is logged in on initial load
      clearGuestData();
      const [cart, wishlist] = await Promise.all([
        fetchUserCart(session.user),
        fetchUserWishlist(session.user),
      ]);
      cartState.items = cart;
      wishlistState.items = wishlist;
    } else {
      // User is logged out on initial load
      rehydrateFromLocalStorage();
    }

    resolve(); // The app can now load

    // 2. Set up a listener for any FUTURE auth changes
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      // This logic will run when the user logs in, logs out, etc., *after* the app has loaded.
      if (newSession?.user?.id !== authState.user?.id) {
        authState.session = newSession;
        authState.user = newSession?.user ?? null;
        console.log("Auth state changed via listener:", authState);

        if (newSession) {
          clearGuestData();
          const [cart, wishlist] = await Promise.all([
            fetchUserCart(newSession.user),
            fetchUserWishlist(newSession.user),
          ]);
          cartState.items = cart;
          wishlistState.items = wishlist;
        } else {
          rehydrateFromLocalStorage();
        }
        updateHeaderState();
      }
    });
  });
};

export const logoutUser = async () => {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error logging out:", error);
  }
  // The onAuthStateChange listener will fire and handle state cleanup.
};

export const getAuthState = () => ({
  isAuthenticated: authState.user !== null,
  user: authState.user,
});

// --- CART & WISHLIST LOGIC (Unchanged from previous version) ---

export const addItemToCart = async (item, quantity) => {
  const { isAuthenticated, user } = getAuthState();
  const existingItem = cartState.items.find((i) => i.id === item.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cartState.items.push({ ...item, quantity });
  }

  if (isAuthenticated) {
    const { error } = await supabase.from("cart_items").upsert(
      {
        user_id: user.id,
        product_id: item.id,
        quantity: existingItem ? existingItem.quantity : quantity,
      },
      { onConflict: "user_id, product_id" }
    );
    if (error) console.error("Error upserting cart item:", error);
  } else {
    persistGuestCart();
  }
  updateHeaderState();
};

export const updateItemQuantity = async (itemId, newQuantity) => {
  const { isAuthenticated, user } = getAuthState();
  const itemIndex = cartState.items.findIndex((i) => i.id == itemId);
  if (itemIndex === -1) return;

  if (newQuantity > 0) {
    cartState.items[itemIndex].quantity = parseInt(newQuantity, 10);
    if (isAuthenticated) {
      const { error } = await supabase()
        .from("cart_items")
        .update({ quantity: newQuantity })
        .match({ user_id: user.id, product_id: itemId });
      if (error) console.error("Error updating cart quantity:", error);
    }
  } else {
    cartState.items.splice(itemIndex, 1);
    if (isAuthenticated) {
      const { error } = await supabase()
        .from("cart_items")
        .delete()
        .match({ user_id: user.id, product_id: itemId });
      if (error) console.error("Error deleting cart item:", error);
    }
  }

  if (!isAuthenticated) persistGuestCart();
  updateHeaderState();
};

export const removeItemFromCart = (itemId) => updateItemQuantity(itemId, 0);
export const getTotalCartItems = () =>
  cartState.items.reduce((total, item) => total + item.quantity, 0);

export const toggleWishlist = async (productId) => {
  const { isAuthenticated, user } = getAuthState();
  const itemIndex = wishlistState.items.indexOf(productId);

  if (itemIndex > -1) {
    wishlistState.items.splice(itemIndex, 1);
    if (isAuthenticated) {
      await supabase()
        .from("wishlist_items")
        .delete()
        .match({ user_id: user.id, product_id: productId });
    }
  } else {
    wishlistState.items.push(productId);
    if (isAuthenticated) {
      await supabase()
        .from("wishlist_items")
        .insert({ user_id: user.id, product_id: productId });
    }
  }

  if (!isAuthenticated) persistGuestWishlist();
  updateHeaderState();
};

export const isInWishlist = (productId) =>
  wishlistState.items.includes(productId);
export const getTotalWishlistItems = () => wishlistState.items.length;

