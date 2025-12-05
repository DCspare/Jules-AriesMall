# Suggestions and Fixes Report

Based on a thorough analysis of the codebase and the `Main+Admin-context.md` file, the following actions are recommended to clean up the project and prepare for the next phases.

## 1. Code Cleanup (Obsolete Files)

The following files were identified as obsolete/unused based on the current implementation (Wishlist is now integrated into the Profile page):

*   **`AriesMall/JS/wishlist.js`**: Logic moved to `profile.js`.
*   **`AriesMall/pages/wishlist.html`**: Template moved to `profile.html` (or rendered dynamically).

**Action:** Delete these files to prevent confusion and reduce codebase size.

## 2. Router Cleanup

*   **`AriesMall/JS/router.js`**: Contains a redirect for the old `/wishlist` route:
    ```javascript
    if (path === "/wishlist") {
      window.location.hash = "#/profile/wishlist";
      return;
    }
    ```
    *Suggestion:* Keep this for now if there are any external links pointing to `/wishlist`, but consider removing it once the cleanup is complete and history API is implemented.

## 3. Missing Features & Enhancements

### Frontend (Main Site)
*   **Checkout Flow (Priority):**
    *   Create `pages/checkout.html`.
    *   Create `JS/checkout.js` to handle form validation, address management, and order submission.
    *   Implement "Place Order" logic in `JS/api.js` to insert into Supabase `orders` and `order_items` tables.
*   **404 Page:**
    *   Create a dedicated `pages/404.html` instead of just setting `innerHTML` in the router.
*   **SEO:**
    *   Implement `helmet`-like functionality in `router.js` to update `<title>` and `<meta name="description">` on route change.

### Admin Panel
*   **User Management:**
    *   Add a "Users" tab to the sidebar.
    *   Create `JS/user-manager.js` to fetch users from Supabase. *Note: Managing Supabase Auth users usually requires Service Role keys or specific RPC functions if using the client SDK. This needs careful security planning.*
*   **Order Management:**
    *   Add "Orders" tab.
    *   Create `JS/order-manager.js` to view all orders, filter by status, and update status (e.g., Pending -> Shipped).

## 4. Documentation
*   The `Main+Admin-context.md` has been updated to reflect the new file structure and status.
*   Ensure `Main+Admin-guide.md` is updated if any workflow changes (e.g., how to manage orders).
