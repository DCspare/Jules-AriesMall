# Aries Mall Audit Report & Fix Plan

## 1. Audit Findings

### A. Unnecessary & Duplicate Code
*   **Obsolete Wishlist Files:** `JS/wishlist.js` and `pages/wishlist.html` are still present but logic has moved to `profile.js`.
*   **Legacy Library:** `lib-bak/` folder contains backup files (`mockApi.js.bak`) that should be removed to clean up the repo.
*   **Redundant Console Logs:** `console.log` statements found in `JS/state.js`, `JS/supabase-client.js`, and `JS/home.js`.

### B. Security & Stability
*   **XSS Risks:** Extensive use of `innerHTML` in `JS/home.js` and `JS/category.js` without sanitization when rendering user-generated content (like product names/brands). While product data comes from the DB, it's best practice to escape output or use `textContent` where possible.
*   **Checkout Logic Missing:** The "Proceed to Checkout" button in `pages/cart.html` exists but has **no event listener** attached in `JS/cart.js`. It does nothing.

### C. SEO & Metadata
*   **Static Titles:** No logic found in `JS/router.js` to update `document.title` or meta descriptions when navigating between pages (e.g., from Home to Product Detail).
*   **Missing Meta Tags:** `JS` files show no evidence of dynamic meta tag manipulation.

### D. Performance & UX (CLS/Images)
*   **Image Attributes:** `pages/product-detail.html` contains an `<img>` tag without `width` or `height` attributes, leading to Cumulative Layout Shift (CLS).
*   **Script Loading:** `index.html` loads scripts correctly with `type="module"` and `defer`.

## 2. Fix Plan

This plan outlines the steps to address the issues identified above.

### Step 1: Cleanup & Maintenance
*   **Action:** Delete `JS/wishlist.js` and `pages/wishlist.html`.
*   **Action:** Delete `lib-bak/` directory.
*   **Action:** Remove `console.log` statements from production JS files.

### Step 2: Critical Functionality (Checkout)
*   **Action:** Update `JS/cart.js` to add an event listener to the "Proceed to Checkout" button.
*   **Action:** For now, link it to a placeholder or alert (since the Checkout page implementation is a separate larger task, we at least need the button to give feedback). *Correction:* The user asked to "point out... not working features... and create plan to fix them". The plan is to **implement the Checkout Page** as identified in the `suggestions.md`.

### Step 3: SEO & Metadata
*   **Action:** Update `JS/router.js` to set `document.title` based on the current route.
    *   Home: "Aries Mall - Premium Luxury Shopping"
    *   Cart: "Your Cart - Aries Mall"
    *   Login: "Login - Aries Mall"
    *   Product: "Product Name - Aries Mall" (Requires fetching product name if not available, or setting it in `product.js`).

### Step 4: Performance & CLS
*   **Action:** Add explicit `width` and `height` attributes (or aspect-ratio CSS) to the main image in `pages/product-detail.html` to reserve space before the image loads.

### Step 5: Security (XSS Prevention)
*   **Action:** Review `JS/home.js` and replace `innerHTML` with safe DOM creation methods or sanitation where feasible for product titles/descriptions. (This might be too large for this single iteration, so we will prioritize the cleanup and SEO first).

## 3. Execution Strategy (Immediate Actions)

I will proceed with the following immediate fixes:
1.  **Delete obsolete files** (`lib-bak`, `wishlist.js`, `wishlist.html`).
2.  **Fix Checkout Button:** Make it redirect to a new (placeholder) checkout route or alert the user.
3.  **Implement Basic SEO:** Update `router.js` to handle page titles.
4.  **Fix CLS:** Add dimensions to the product detail image placeholder.
