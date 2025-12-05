--- Main+Admin-context.md ---

### Aries Mall Project Documentation (Main Site & Admin Panel)

This document provides a comprehensive overview of the Aries Mall project, integrating details for both the E-commerce Front-end (Vanilla JS) and the Admin Panel.

---

## E-commerce Front-end (Main Site)

### Project Overview

**Mission**: Convert the "Aries Mall" Next.js application into a high-performance vanilla HTML, CSS, and JavaScript project, preserving all visual fidelity and responsiveness.

**Current Status**: **Phase 9: Production Readiness & Hardening.** Core state (Cart, Wishlist, Auth) is fully integrated with Supabase. The **entire product catalog and Hero Slider have been migrated to Supabase**. The main site successfully reads from the database. All module imports have been synchronized. Focus is now on **Phase 10: Checkout Flow** and **SEO/Performance Optimization**.

### Main Site File Structure (ariesmall.domain.ext)

```aries-mall-vanilla/
├── index.html                  # Main entry point, application shell
│
├── CSS/                        # All Css files resides here
│   ├── main.css                # Main CSS file. Fixed global image constraints.
│   └── responsive.css          # Main Responsive CSS file.
│
├── JS/
│   ├── api.js                  # UPDATED: Supports `brand` filtering.
│   ├── app.js                  # REFACTORED: Handles header state updates.
│   ├── auth.js                 # Logic for login/signup pages.
│   ├── cart.js                 # UPDATED: Integrated `formatCurrency` (INR).
│   ├── category.js             # UPDATED: Dynamic Brand filtering logic.
│   ├── components.js           # REFACTORED: Reusable UI components (Cards, Badges).
│   ├── config.js               # Supabase credentials (Public).
│   ├── home.js                 # UPDATED: Home page logic, async slider loading.
│   ├── product.js              # UPDATED: Product details with `brand` and INR pricing.
│   ├── profile.js              # Logic for the profile page.
│   ├── router.js               # Handles all page routing logic (Hash-based).
│   ├── search.js               # UPDATED: Search includes `brand` filtering.
│   ├── state.js                # UPDATED: Direct import of `supabase` client.
│   ├── supabase-client.js      # REFACTORED: ES Module exporting `supabase` instance.
│   ├── ui.js                   # UPDATED: Dynamic Category Navigation.
│   └── utils.js                # UPDATED: `formatCurrency` for INR localization.
│
├── lib/
│   └── mockApi.js              # DELETED: Data migrated to Supabase.
│
├── pages/
│   ├── cart.html               # HTML content for cart page
│   ├── category.html           # HTML template for category pages
│   ├── home.html               # HTML content for home page
│   ├── login.html              # HTML content for login page
│   ├── product-detail.html     # UPDATED: Added `product-brand` placeholder.
│   ├── profile.html            # HTML content for profile page
│   ├── search-results.html     # HTML content for search results
│   └── signup.html             # HTML content for sign-up page
│
└── templates/
    ├── footer.html
    └── header.html             # REFACTORED: Mobile Menu vs Utility links structure.
```

---

### Successfully Converted Features (In-Depth)

**1. Modular JavaScript Architecture:** Clean ES6 `import/export` structure.
**2. Centralized UI Component Library:** Abstracted reusable elements in `JS/components.js`.
**3. Robust Toast Notification System:** CSS-animation-driven feedback system.
**4. Core Application Shell:** Pre-loader and seamless Light/Dark theme toggle.
**5. Fully Responsive Header & Mobile Menu:** Independent scrolling categories and fixed utility links.
**6. User Authentication & Profile:** Secure login/signup via Supabase Auth.
**7. Data-Driven Hero Slider:** Fetches slides from Supabase `slides` table.
**8. Curated Home Page:** Responsive grid layouts for categories.
**9. Shopping Cart:** Real-time quantity updates and total calculations.
**10. Enhanced Product Detail Page:** Gallery, carousel, and "You Might Also Like".
**11. Client-Side Search:** Search results with query parsing and filtering.
**12. Dynamic Category Pages:** Routing via `/#/category/:slug`.
**13. Persistent Wishlist:** Saves to Supabase (Auth) or localStorage (Guest).
**14. Consolidated 'My Account' Page:** Multi-view profile management.
**15. Persistent State:** Hybrid state management system.
**16. Hardened Authentication:** Secure Supabase flow.
**17. Product Catalog (Supabase):** Single source of truth for products.
**18. Dynamic Navigation:** Menus fetch categories from DB.
**19. Brand Integration:** `brand` field in filtering, display, and search.
**20. Currency Localization:** Full INR (₹) formatting via `formatCurrency`.

---

## Admin Panel (/admin)

### 1. File Structure

The Admin Panel is fully modular and now features **secure, dynamic configuration** fetching to prevent API key exposure.

```Admin/
├── index.html                  # Main entry point
├── admin-guide.md              # Live setup and user guide
│
├── CSS/
│   ├── admin-responsive.css    # Responsive styles.
│   └── admin.css               # Core styles (Toast, Forms, Dropdowns).
│
├── JS/
│   ├── admin.js                # REFACTORED: Async initialization. Waits for Supabase Config before loading tools.
│   ├── admin-auth.js           # Admin login logic.
│   ├── dashboard.js            # Dashboard stats logic.
│   ├── settings.js             # (NEW) Securely fetches API keys/Config from Supabase `system_config` table.
│   ├── product-manager.js      # CRUD for Products (includes Brand).
│   ├── profile.js              # Admin profile logic.
│   ├── slides-manager.js       # CRUD for Hero Slides.
│   ├── ui.js                   # UI utilities (Toast).
│   ├── uploader.js             # UPDATED: Uses `Nexus Gateway` proxy. Falls back to Cloudinary if TinyPNG fails.
│   ├── upscaler.js             # UPDATED: Uses `Nexus Gateway`. AI Image Upscaling (Real-ESRGAN).
│   └── enhancer.js             # UPDATED: Uses `Nexus Gateway`. AI Image Enhancement (CodeFormer, Sharpness focus).
│
└── Pages/
    ├── admin-login.html        # Admin login page
    ├── dashboard.html
    ├── media-hub.html          # Tabbed media tools with Custom Dropdown for mobile.
    ├── product-manager.html    # Product CRUD interface.
    └── profile.html            # Profile interface.
```

---

### 2. Infrastructure & Security Updates

**1. Secure System Configuration (`JS/settings.js`)**
*   **Mechanism:** API keys (Cloudinary, Replicate, TinyPNG) and Proxy URLs are no longer hardcoded.
*   **Storage:** Stored in Supabase `system_config` table, protected by Row Level Security (RLS). Only authenticated Admins can read them.
*   **Initialization:** Admin tools asynchronously fetch these keys upon loading the Media Hub.

**2. Nexus Gateway (Secure CORS Proxy)**
*   **Implementation:** A Cloudflare Worker (`Nexus Gateway`) deployed to handle API requests that block browser origins (CORS).
*   **Usage:** Used by `uploader.js` (Tinify), `enhancer.js` (Replicate), and `upscaler.js` (Replicate).
*   **Security:** Whitelisted origins (Production & Localhost) only.

---

### 3. Status & Architectural Updates

| Feature                            | Status       | Notes                                                                                                                                                                             |
| :--------------------------------- | :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Secure Config Management**       | **COMPLETE** | **NEW: Keys fetched from Supabase `system_config`. No hardcoded secrets.**                                                                                                        |
| **Nexus Gateway (Proxy)**          | **COMPLETE** | **NEW: Cloudflare Worker proxy handles all AI/Compression API calls, solving CORS issues.**                                                                                       |
| **Full Product Management (CRUD)** | **COMPLETE** | Supports Brand field, INR pricing, and search.                                                                                                                                    |
| **TinyPNG Integration**            | **COMPLETE** | Integrated via Proxy. Includes robust try/catch fallback to raw Cloudinary upload if optimization fails.                                                                          |
| **Image Enhancer (Sharpening)**    | **COMPLETE** | **UPDATED: Uses `sczhou/codeformer` (Upscale: 1, Fidelity: 0.7) to remove blur and sharpen images without resizing.**                                                             |
| **Image Upscaler (Resizing)**      | **COMPLETE** | Uses `Real-ESRGAN` via Proxy for increasing resolution.                                                                                                                           |
| **Mobile Media Hub UI**            | **COMPLETE** | Custom, fully stylable CSS/JS dropdown for mobile tab navigation.                                                                                                                 |
| **Slides Management (CRUD)**       | **COMPLETE** | Full control over Hero Slides (Title, CTA, Overlay, Active Status).                                                                                                               |
| **Admin Authentication**           | **COMPLETE** | Secure Admin role verification.                                                                                                                                                   |
---

### 4. Completed Fixes (Recent)

- **Admin Router Fix:** Resolved `loadHTML` reference error and unreachable code in `admin.js`, ensuring Media Hub tabs and Guide load correctly.
- **Enhancer Model:** Switched to `CodeFormer` with specific parameters for "Sharpen Only" (no unnecessary upscaling).
- **Proxy Integration:** All tools now route traffic through the `Nexus Gateway` to bypass browser CORS restrictions.
- **Async Initialization:** `admin.js` now properly awaits the HTML fetch before initializing tool scripts to prevent race conditions.

---

### 5. Pending Work & Next Steps (Main Site)

#### 1. The "Vanilla JS" Architecture (Optimization)
*   **Vite Integration:** Integrate Vite as a build tool to bundle 50+ JS files into optimized chunks (`index.js`, `vendor.js`), minify assets, and handle cache busting.

#### 2. SEO & Routing (The "Hash" Problem)
*   **Switch to History API:** Migrate from Hash Routing (`/#/product/123`) to History API (`/product/123`) to improve SEO ranking.
*   **Netlify Redirects:** Configure `_redirects` to handle Single Page App (SPA) rewrites.

#### 3. User Experience
*   **404 Handling:** Create a dedicated "Product Not Found" component/page for invalid IDs.
*   **Empty States:** Ensure all lists (Orders, Wishlist) have polished empty states.

#### 4. SEO (Meta Tags)
*   **Dynamic Metadata:** Update `router.js` to dynamically set `document.title` and `<meta name="description">` based on the active product or category.

#### 5. Checkout Flow (Phase 10)
*   **Checkout Page:** Create `checkout.html` and logic for address entry and order summary.
*   **Order Confirmation:** Success page after order placement.

### 6. Pending Work & Next Steps (Admin Panel)

- **User Management:** A page to view and manage registered users.
- **Admin Data Visualization:** Charts and statistics on the Dashboard.
- **Order Management:** Interface to view and update order statuses.
- **Build Process:** Integrate into the Vite build pipeline.

---
```