# Aries Mall - Admin Panel Guide

Welcome to the Aries Mall Admin Panel! This is the central control hub for your e-commerce website. From here, you can manage products, hero slides, and media files without touching a single line of code.

---

## 1. One-Time Setup

To enable all features of the Admin Panel, you must connect it to three third-party services: **Supabase** (Database), **Cloudinary** (Image Hosting), and **Replicate** (AI Upscaling).

### Part A: Supabase Configuration (Database)
Your database credentials are stored in `JS/config.js` in the main project folder.
1.  Open `JS/config.js`.
2.  Ensure your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are pasted there.
3.  The Admin Panel automatically reads these credentials to manage Products and Slides.

### Part B: Cloudinary Presets Setup (Media)
To keep your media library organized, we need to create two separate upload presets in Cloudinary.

#### Step 1: Create the Main Uploader Preset
1.  Log in to your **Cloudinary Dashboard**.
2.  Go to **Settings** (gear icon ⚙️) > **"Upload"** tab.
3.  Scroll to **"Upload presets"** and click **"Add upload preset"**.
4.  Configure:
    *   **Preset name:** `aries_unsigned`
    *   **Signing Mode:** **`Unsigned`**
    *   **Folder:** `aries-mall-uploads`
5.  Click **"Save"**.

#### Step 2: Create the Temporary Upscaler Preset
1.  Click **"Add upload preset"** again.
2.  Configure:
    *   **Preset name:** `aries_temp_upscaler`
    *   **Signing Mode:** **`Unsigned`**
    *   **Folder:** `temp_upscaler_uploads`
3.  Click **"Save"**.

### Part C: Code Configuration
Open the specific admin files to add your keys.

**1. Configure the Main Uploader:**
*   Open `Admin/JS/uploader.js`.
*   Update:
    ```javascript
    const CLOUD_NAME = "your-cloud-name";
    const UPLOAD_PRESET = "aries_unsigned";
    ```

**2. Configure the AI Upscaler:**
*   Open `Admin/JS/upscaler.js`.
*   Update:
    ```javascript
    const REPLICATE_API_TOKEN = "your-replicate-token";
    const CLOUD_NAME = "your-cloud-name";
    const UPLOAD_PRESET = "aries_temp_upscaler";
    ```

---

## 2. Managing Products (Product Manager)

Navigate to the **Product Manager** page from the sidebar. This page has two tabs: "Products" and "Main Site Slides".

### How to Add a New Product
1.  Click the **"Products"** tab.
2.  Click the **"Add New Product"** button.
3.  Fill in the details:
    *   **Name, Price, Category:** Standard details.
    *   **Main Image URL:** This is the image shown on the home page card.
    *   **Gallery Images:** Comma-separated URLs for the product detail page.
    *   **Features:** Comma-separated list (e.g., "Wireless, 10hr Battery").
4.  Click **"Save Product"**. The website updates instantly.

### How to Edit or Delete
*   **Edit:** Click the **Pencil Icon** next to a product to open the form with existing data.
*   **Delete:** Click the **Trash Icon** to permanently remove a product.

### Search
Use the search bar at the top to filter products by name or category.

---

## 3. Managing Hero Slides (Slide Manager)

The Hero Slider on the home page is fully dynamic. You can control exactly what banners appear.

1.  Click the **"Main Site Slides"** tab inside the Product Manager page.
2.  Click **"Add New Slide"**.

### Slide Fields Explained
*   **Text Content:**
    *   *Title & Description:* Optional. If your image is a "Flyer" (has text baked in), leave these blank.
*   **Button Content:**
    *   *Button Text:* e.g., "Shop Now".
    *   *Button Link:* Where the button goes (e.g., `#/category/electronics`).
*   **Images (Crucial):**
    *   *Desktop Image:* Wide format (1920x1080).
    *   *Mobile Image:* Tall format (800x1080).
    *   *Thumbnail:* Small preview (200x120).
*   **Display Options:**
    *   *Show Dark Overlay?* Select **"No"** if your image already has text on it. Select **"Yes"** if you are using a plain photo and want the Title/Description text to be readable.
    *   *Status:* Set to **"Active"** to show it on the site.

---

## 4. The Media Hub (Upload & Upscale)

The Media Hub helps you prepare images before you add them to a product or slide.

### 4.1. The AI Upscaler Tab
Use this to fix low-quality or blurry images.
1.  **Add Images:** Drag & drop or paste a URL.
2.  **Select Scale:** Choose 2x or 4x.
3.  **Start:** Click "Start Batch Upscaling".
4.  **Result:** Copy the link of the new, high-quality image.

### 4.2. The Image Uploader Tab
Use this to host your images and get the final URL for the Product/Slide forms.
1.  **Add:** Paste the high-quality link (from the Upscaler or elsewhere).
2.  **Rename:** Give it a clean name (e.g., `nike-air-max-red`).
3.  **Upload:** Click the cloud icon.
4.  **Copy Link:** The result card gives you optimized links. Use the **"Product Image"** link for products and **"Desktop/Mobile Slider"** links for slides.

---

## 5. Maintenance

### Checking AI Usage
1.  Log in to [Replicate.com](https://replicate.com).
2.  Go to your Dashboard to see your credit usage.

### Troubleshooting Images
If an image isn't showing:
1.  Check the URL in the Product/Slide manager. It must start with `https://`.
2.  Ensure the "Status" of the slide is set to **Active**.

---

# Aries Mall Website Management Guide

## Introduction

Welcome to the Aries Mall management guide. This document provides instructions on how to manage the content and structure of the public-facing website.

Unlike the previous version, this site is now **database-driven**. You do **not** need to edit code files (`mockApi.js`) to change content. All content is managed via the **Admin Panel**.

---

## 1. Managing Website Content

### Products & Categories
*   **Do not edit code.**
*   Go to the **Admin Panel > Product Manager**.
*   Add, Edit, or Delete products there. The "Category" field you type in the Admin Panel automatically creates new categories on the main site navigation.

### Hero Slider
*   **Do not edit code.**
*   Go to the **Admin Panel > Product Manager > Main Site Slides**.
*   You can create "Flyer" style slides (images with text) or "Standard" slides (background photo with overlay text) using the form options.

---

## 2. Managing Visuals & Branding

**File to Edit:** `CSS/main.css`

The website's core visual identity (colors, fonts) is controlled by CSS variables at the top of this file.

### How to Change Website Colors
Colors are defined in the `:root` (light theme) and `.dark` (dark theme) sections.

**Example:**
```css
:root {
  /* Main Brand Color (HSL format) */
  --primary: 34.9 91.6% 52.9%; 

  /* Backgrounds & Text */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
}
```

To change the brand color:
1.  Open `CSS/main.css`.
2.  Find `--primary`.
3.  Replace the numbers with your new HSL color value.
4.  Update it in the `.dark` section as well if you want a different shade for night mode.

---

## 3. Managing Static Content

Some parts of the site are "static" (not in the database) and must be edited in the HTML files.

### Header Links (Contact, About)
**File:** `templates/header.html`
*   To change the "Contact" link or add new menu items that are *not* product categories, edit this file.
*   *Note:* Product categories (Furniture, Electronics) are loaded dynamically by JavaScript. You cannot edit them here.

### Footer Content
**File:** `templates/footer.html`
*   Edit this file to change the copyright year, social media links, or footer address.

---

## 4. Advanced: Adding a New Page

If you need to add a completely new page (e.g., "About Us" or "Terms of Service"):

1.  **Create the HTML:**
    *   Create a file named `about.html` in the `pages/` folder.
    *   Add your content.

2.  **Update the Router:**
    *   Open `JS/router.js`.
    *   Inside the `routes` object, add your new path:
    ```javascript
    const routes = {
        '/': home,
        '/cart': cart,
        // ... existing routes
        '/about': { template: 'pages/about.html', init: () => {} } // Add this
    };
    ```

3.  **Add the Link:**
    *   Open `templates/header.html` or `templates/footer.html` and add `<a href="#/about">About Us</a>`.

---

## 5. Image Guidelines

To ensure the site looks professional, follow these size recommendations when uploading images via the Admin Panel.

**1. Hero Slides:**
*   **Desktop:** `1920x1080` pixels (Landscape).
*   **Mobile:** `800x1080` pixels (Portrait).
*   **Thumbnail:** `200x120` pixels.

**2. Product Images:**
*   **AspectRatio:** 1:1 (Square).
*   **Size:** `1080x1080` pixels.
*   **Format:** JPG or WEBP (optimized via the Admin Panel's Uploader).
```
