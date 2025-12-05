--- Main+Admin-context.md ---

### Aries Mall Project Documentation (Main Site & Admin Panel)

This document provides a comprehensive overview of the Aries Mall project, integrating details for both the E-commerce Front-end (Vanilla JS) and the Admin Panel.

---

## E-commerce Front-end (Main Site)

### Project Overview

**Mission**: A high-performance, single-page E-commerce application built with **Vanilla HTML, CSS, and JavaScript**. The project focuses on speed, responsiveness, and a clean code architecture without heavy frontend frameworks.

**Current Status**: **Phase 9: Production Readiness & Hardening.**
*   **Core State**: Cart, Wishlist, and Authentication are fully integrated with Supabase.
*   **Data Source**: The entire product catalog and Hero Slider are fetched dynamically from Supabase.
*   **Focus**: Now entering **Phase 10: Checkout Flow** and **SEO/Performance Optimization**.

### Technologies & Stack

*   **Frontend**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3 (Variables, Flexbox/Grid).
*   **Database & Auth**: Supabase (PostgreSQL, GoTrue).
*   **Media**: Cloudinary (Image Hosting), Replicate (AI Upscaling).
*   **Icons**: Lucide Icons.
*   **Proxy**: Cloudflare Workers ("Nexus Gateway") for CORS handling.

### Main Site File Structure (`AriesMall/`)

```aries-mall/
├── index.html                  # Main entry point, application shell
│
├── CSS/                        # All CSS files
│   ├── main.css                # Global styles, variables, and image constraints.
│   └── responsive.css          # Responsive design overrides.
│
├── JS/
│   ├── api.js                  # Supabase Data Fetching (Products, Brands, Orders).
│   ├── app.js                  # Main entry point: Initialization, Event Listeners.
│   ├── auth.js                 # Authentication Logic (Login/Signup).
│   ├── cart.js                 # Shopping Cart Logic & UI.
│   ├── category.js             # Dynamic Category Pages & Filtering.
│   ├── components.js           # Reusable UI Components (Product Cards, Badges).
│   ├── config.js               # Configuration & Public Credentials.
│   ├── home.js                 # Home Page Logic (Hero Slider, Featured Products).
│   ├── product.js              # Product Detail Page Logic.
│   ├── profile.js              # Profile Logic (Orders, Wishlist Management).
│   ├── router.js               # Client-Side Routing (Hash-based).
│   ├── search.js               # Search Logic (Debouncing, Filtering).
│   ├── state.js                # Global State Management (Cart, Auth, Wishlist).
│   ├── supabase-client.js      # Supabase Client Instance.
│   ├── ui.js                   # UI Utilities (Toast, Theme, Loader, Navigation).
│   ├── utils.js                # Helpers (Currency Formatting).
│   └── wishlist.js             # [OBSOLETE] Legacy wishlist logic (Now in profile.js).
│
├── lib-bak/                    # Backup/Legacy library files.
│
├── pages/
│   ├── cart.html               # Cart Page Template.
│   ├── category.html           # Category Page Template.
│   ├── home.html               # Home Page Template.
│   ├── login.html              # Login Page Template.
│   ├── product-detail.html     # Product Detail Page Template.
│   ├── profile.html            # Profile Page Template (Dashboard, Orders, Wishlist).
│   ├── search-results.html     # Search Results Template.
│   ├── signup.html             # Sign-up Page Template.
│   └── wishlist.html           # [OBSOLETE] Legacy wishlist template (Now in profile.html).
│
└── templates/
    ├── footer.html             # Global Footer.
    └── header.html             # Global Header (Navigation, Search).
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
**13. Integrated Wishlist:** Now a tab within the "My Account" / Profile section.
**14. Consolidated 'My Account' Page:** Multi-view profile management (Profile, Orders, Wishlist).
**15. Persistent State:** Hybrid state management system.
**16. Hardened Authentication:** Secure Supabase flow.
**17. Product Catalog (Supabase):** Single source of truth for products.
**18. Dynamic Navigation:** Menus fetch categories from DB.
**19. Brand Integration:** `brand` field in filtering, display, and search.
**20. Currency Localization:** Full INR (₹) formatting via `formatCurrency`.

---

## Admin Panel (`AriesMall/Admin/`)

### 1. File Structure

The Admin Panel is fully modular and features **secure, dynamic configuration** fetching.

```Admin/
├── index.html                  # Main entry point (Admin Dashboard)
├── admin-guide.md              # Live setup and user guide
│
├── CSS/
│   ├── admin-responsive.css    # Responsive styles.
│   ├── admin.css               # Core styles (Toast, Forms, Dropdowns).
│
├── JS/
│   ├── admin.js                # Initialization & Tab Management.
│   ├── admin-auth.js           # Admin Login Logic.
│   ├── dashboard.js            # Dashboard Stats Logic.
│   ├── settings.js             # Securely fetches API keys/Config.
│   ├── product-manager.js      # CRUD for Products.
│   ├── profile.js              # Admin Profile Logic.
│   ├── slides-manager.js       # CRUD for Hero Slides.
│   ├── ui.js                   # UI Utilities.
│   ├── uploader.js             # Image Uploader (Cloudinary + Proxy).
│   ├── upscaler.js             # Image Upscaler (Replicate + Proxy).
│   ├── enhancer.js             # Image Enhancer (CodeFormer + Proxy).
│   └── media-history.js        # LocalStorage history for media tools.
│
└── Pages/
    ├── admin-login.html        # Admin Login Page.
    ├── dashboard.html          # Dashboard Statistics View.
    ├── media-hub.html          # Media Tools (Upload, Enhance, Upscale).
    ├── product-manager.html    # Product & Slide Management Interface.
    └── profile.html            # Admin Profile Settings.
```

---

### 2. Infrastructure & Security

**1. Secure System Configuration (`JS/settings.js`)**
*   **Mechanism:** API keys (Cloudinary, Replicate, TinyPNG) are fetched from Supabase `system_config`.
*   **Security:** RLS policies ensure only authenticated Admins can access these keys.

**2. Nexus Gateway (Secure CORS Proxy)**
*   **Implementation:** Cloudflare Worker acting as a proxy for external APIs (Replicate, Tinify) to resolve CORS issues and hide secrets if necessary.

---

### 3. Status & Architectural Updates

| Feature                            | Status       | Notes                                                                                                                                                                             |
| :--------------------------------- | :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Secure Config Management**       | **COMPLETE** | Keys fetched from Supabase `system_config`.                                                                                                                                       |
| **Nexus Gateway (Proxy)**          | **COMPLETE** | Cloudflare Worker proxy handles AI/Compression API calls.                                                                                                                         |
| **Full Product Management (CRUD)** | **COMPLETE** | Supports Brand field, INR pricing, and search.                                                                                                                                    |
| **Media Hub**                      | **COMPLETE** | Unified interface for Uploading, Enhancing, and Upscaling images.                                                                                                                 |
| **Image Enhancer**                 | **COMPLETE** | Uses `sczhou/codeformer` for sharpening without resizing.                                                                                                                         |
| **Image Upscaler**                 | **COMPLETE** | Uses `Real-ESRGAN` for 2x/4x upscaling.                                                                                                                                           |
| **Slides Management**              | **COMPLETE** | Full control over Hero Slides.                                                                                                                                                    |
| **Admin Authentication**           | **COMPLETE** | Secure Admin role verification.                                                                                                                                                   |

---

### 5. Pending Work & Next Steps (Main Site)

#### 1. The "Vanilla JS" Architecture (Optimization)
*   **Vite Integration:** Integrate Vite as a build tool to bundle JS modules, minify assets, and handle cache busting.

#### 2. SEO & Routing
*   **History API:** Migrate from Hash Routing (`/#/product/123`) to History API (`/product/123`).
*   **Meta Tags:** Dynamic `document.title` and meta descriptions for SEO.
*   **404 Handling:** dedicated 404 page for invalid routes.

#### 3. User Experience
*   **Empty States:** Polish empty states for Orders/Wishlist (currently basic).

#### 4. Checkout Flow (Phase 10)
*   **Checkout Page:** Create `checkout.html` (Address Entry, Payment Selection).
*   **Order Placement:** Logic to create order in Supabase `orders` table.
*   **Order Confirmation:** Success page.

### 6. Pending Work & Next Steps (Admin Panel)

- **User Management:** Interface to view, search, and manage registered users (Ban/Unban).
- **Order Management:** Interface to view orders, update status (Shipped/Delivered), and view details.
- **Dashboard Stats:** Visualize sales data and user growth.
- **Build Process:** Integrate into Vite build pipeline.

---
