// JS/home.js
import { getHeroSlides, getProducts, getCategories } from "./api.js";
import { addItemToCart, toggleWishlist } from "./state.js";
import { showToast, updateHeaderState } from "./ui.js";
import {
  generateProductCardHTML,
  generateProductCardSkeletonHTML,
} from "./components.js";
import { sanitizeText } from "./utils.js";

let homePageState = {
  products: [],
  categories: [],
  selectedCategory: "All",
  sortBy: "featured",
};

let slideInterval = null;

export const cleanupHomePage = () => {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
  const app = document.getElementById("app");
  if (app && app._homePageListenersAttached) {
    app._homePageListenersAttached = false;
  }
};

export const initializeHomePage = async (path) => {
   // --- HERO SLIDER LOGIC (Fixed) ---
  const setupHeroSlider = (slides) => {
    // 1. Select the main container to handle visibility
    const heroSection = document.getElementById("hero-slider");

    // 2. LOGIC FIX: Hide section if no slides, then stop.
    if (!slides || slides.length === 0) {
      if (heroSection) heroSection.style.display = "none";
      return;
    }

    // 3. Ensure it's visible if we DO have slides
    if (heroSection) heroSection.style.display = "block";

    // 4. Select internal elements
    const backgroundsContainer = document.getElementById("hero-backgrounds");
    const titleEl = document.getElementById("hero-title");
    const descEl = document.getElementById("hero-description");
    const ctaEl = document.getElementById("hero-cta-button");
    const thumbnailsContainer = document.getElementById("hero-thumbnails");

    // Safety Check: If internal structure is missing, we can't render
    if (
      !backgroundsContainer ||
      !titleEl ||
      !descEl ||
      !ctaEl ||
      !thumbnailsContainer
    ) {
      console.error("Hero Slider: One or more internal HTML elements are missing.");
      return;
    }

    let currentSlideIndex = 0;

    const desktopFallback =
      "https://placehold.co/1920x800/f5f3ed/1a1a1a?text=NO+Image";
    const mobileFallback =
      "https://placehold.co/800x800/f5f3ed/1a1a1a?text=NO+Image";

    // Render Backgrounds
    backgroundsContainer.innerHTML = slides
      .map(
        (slide, index) =>
          `
  <img src="${
    slide.backgroundImageDesktop || desktopFallback
  }" alt="${sanitizeText(
            slide.title || ""
          )}" class="hero-background-image hero-bg-desktop ${
            index === 0 ? "active" : ""
          }" data-index="${index}" style="object-fit: ${
            slide.fitDesktop || "cover"
          };" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} />
  <img src="${
    slide.backgroundImageMobile || mobileFallback
  }" alt="${sanitizeText(
            slide.title || ""
          )}" class="hero-background-image hero-bg-mobile ${
            index === 0 ? "active" : ""
          }" data-index="${index}" style="object-fit: ${
            slide.fitMobile || "cover"
          };" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} />
  `
      )
      .join("");

    const thumbnailFallback =
      "https://placehold.co/150/f5f3ed/1a1a1a?text=Thumb";

    // Render Thumbnails
    thumbnailsContainer.innerHTML = slides
      .map(
        (slide, index) =>
          `<div class="hero-thumbnail-item ${
            index === 0 ? "active" : ""
          }" data-index="${index}">
               <img src="${
                 slide.thumbnailImage || thumbnailFallback
               }" alt="Thumbnail ${index + 1}" loading="lazy" />
             </div>`
      )
      .join("");

    const updateSlide = (index) => {
      document
        .querySelectorAll(".hero-background-image.active")
        .forEach((el) => el.classList.remove("active"));
      document
        .querySelector(".hero-thumbnail-item.active")
        ?.classList.remove("active");

      if (titleEl) titleEl.classList.remove("text-active");
      if (descEl) descEl.classList.remove("text-active");
      if (ctaEl) ctaEl.classList.remove("text-active");

      currentSlideIndex = index;
      const slide = slides[currentSlideIndex];

      // Handle Overlay Visibility
      if (backgroundsContainer)
        backgroundsContainer.classList.toggle(
          "overlay-hidden",
          slide.overlay === false
        );

      document
        .querySelectorAll(`.hero-background-image[data-index="${index}"]`)
        .forEach((el) => el.classList.add("active"));
      document
        .querySelector(`.hero-thumbnail-item[data-index="${index}"]`)
        ?.classList.add("active");

      setTimeout(() => {
        // Use textContent for security, it does not parse HTML
        if (titleEl) titleEl.textContent = slide.title || "";
        if (descEl) descEl.textContent = slide.description || "";
        if (ctaEl) {
            if(slide.buttonText) {
                ctaEl.textContent = slide.buttonText;
                ctaEl.href = slide.buttonLink || "#";
                ctaEl.style.display = "inline-flex"; // Show button
            } else {
                ctaEl.style.display = "none"; // Hide button if no text
            }
        }
        if (titleEl) titleEl.classList.add("text-active");
        if (descEl) descEl.classList.add("text-active");
        if (ctaEl && slide.buttonText) ctaEl.classList.add("text-active");
      }, 100);
    };

    const startAutoPlay = () => {
      if (slideInterval) clearInterval(slideInterval);
      slideInterval = setInterval(() => {
        const nextIndex = (currentSlideIndex + 1) % slides.length;
        updateSlide(nextIndex);
      }, 7000);
    };

    thumbnailsContainer.addEventListener("click", (e) => {
      const thumbnail = e.target.closest(".hero-thumbnail-item");
      if (thumbnail) {
        const index = parseInt(thumbnail.dataset.index, 10);
        updateSlide(index);
        clearInterval(slideInterval);
        startAutoPlay();
      }
    });

    updateSlide(0);
    startAutoPlay();
  };

  if (path === "/electronics") homePageState.selectedCategory = "Electronics";
  else if (path === "/furniture") homePageState.selectedCategory = "Furniture";
  else homePageState.selectedCategory = "All";

  const renderSkeletons = () => {
    const grid = document.getElementById("product-grid");
    const categoryDesktop = document.getElementById("category-list-desktop");
    const categoryMobileDrop = document.getElementById(
      "category-dropdown-menu"
    );
    if (grid && categoryDesktop && categoryMobileDrop) {
      grid.innerHTML = generateProductCardSkeletonHTML(8); // USE COMPONENT
      const categorySkeletons = Array(4)
        .fill('<div class="category-skeleton animate-shimmer"></div>')
        .join("");
      categoryDesktop.innerHTML = categorySkeletons;
      categoryMobileDrop.innerHTML = categorySkeletons;
    }
    const electronicsCarousel = document.getElementById("electronics-carousel");
    const furnitureCarousel = document.getElementById("furniture-carousel");
    if (electronicsCarousel && furnitureCarousel) {
      const mobileSkeleton = generateProductCardSkeletonHTML(1); // USE COMPONENT
      const skeletonRow = `<div class="carousel-row">${Array(6)
        .fill(mobileSkeleton)
        .join("")}</div>`;
      electronicsCarousel.innerHTML = skeletonRow + skeletonRow;
      furnitureCarousel.innerHTML = skeletonRow + skeletonRow;
    }
  };

  const renderProducts = () => {
    const allProducts = homePageState.products;
    const grid = document.getElementById("product-grid");
    if (grid) {
      let desktopResult = [...allProducts];
      if (homePageState.selectedCategory !== "All") {
        desktopResult = desktopResult.filter(
          (p) => p.category === homePageState.selectedCategory
        );
      }
      const sortBy = homePageState.sortBy;
      if (sortBy === "price-low")
        desktopResult.sort((a, b) => a.price - b.price);
      else if (sortBy === "price-high")
        desktopResult.sort((a, b) => b.price - a.price);
      else if (sortBy === "rating")
        desktopResult.sort((a, b) => b.rating - a.rating);
      grid.innerHTML = desktopResult.length
        ? desktopResult.map(generateProductCardHTML).join("")
        : `<p>No products found.</p>`;
    }
    const electronicsCarousel = document.getElementById("electronics-carousel");
    const furnitureCarousel = document.getElementById("furniture-carousel");
    if (electronicsCarousel && furnitureCarousel) {
      const electronicsProducts = allProducts.filter(
        (p) => p.category === "Electronics"
      );
      const furnitureProducts = allProducts.filter(
        (p) => p.category === "Furniture"
      );
      const row1Elec = electronicsProducts
        .slice(0, 6)
        .map(generateProductCardHTML)
        .join("");
      const row2Elec = electronicsProducts
        .slice(6, 12)
        .map(generateProductCardHTML)
        .join("");
      electronicsCarousel.innerHTML = `<div class="carousel-row">${row1Elec}</div><div class="carousel-row">${row2Elec}</div>`;
      const row1Furn = furnitureProducts
        .slice(0, 6)
        .map(generateProductCardHTML)
        .join("");
      const row2Furn = furnitureProducts
        .slice(6, 12)
        .map(generateProductCardHTML)
        .join("");
      furnitureCarousel.innerHTML = `<div class="carousel-row">${row1Furn}</div><div class="carousel-row">${row2Furn}</div>`;
    }
    lucide.createIcons();
  };

  const renderCategories = () => {
    const { categories, selectedCategory } = homePageState;
    const desktopContainer = document.getElementById("category-list-desktop");
    const mobileContainer = document.getElementById("category-dropdown-menu");
    if (!desktopContainer || !mobileContainer) return;
    const listHtml = categories
      .map(
        (cat) =>
          `<button class="category-button ${
            selectedCategory === cat ? "active" : ""
          }" data-category="${sanitizeText(cat)}">${sanitizeText(cat)}</button>`
      )
      .join("");
    desktopContainer.innerHTML = listHtml;
    mobileContainer.innerHTML = listHtml;
  };

  const addHomePageEventListeners = () => {
    const app = document.getElementById("app");
    if (!app || app._homePageListenersAttached) return;

    app.addEventListener("click", (e) => {
      const categoryButton = e.target.closest(".category-button");
      if (categoryButton) {
        homePageState.selectedCategory = categoryButton.dataset.category;
        renderCategories();
        renderProducts();
        document.getElementById("selected-category-label").textContent =
          homePageState.selectedCategory;
        document
          .getElementById("category-dropdown-menu")
          .classList.remove("open");
        document.querySelector(".dropdown-chevron")?.classList.remove("rotate");
        return;
      }

      const productCard = e.target.closest(".product-card");
      if (!productCard) return;

      const productId = productCard.dataset.productId;
      const favButton = e.target.closest(".product-card-fav-btn");
      if (favButton) {
        e.preventDefault();
        toggleWishlist(productId);
        const isFavorite = favButton.classList.toggle("favorite");
        const icon = favButton.querySelector("i");
        if (icon) icon.style.fill = isFavorite ? "currentColor" : "none";
        updateHeaderState();
        showToast({
          title: isFavorite ? "Added to Wishlist" : "Removed from Wishlist",
        });
        return;
      }

      const addButton = e.target.closest(".product-card-add-btn");
      if (addButton) {
        e.preventDefault();
        if (!addButton.classList.contains("added")) {
          const product = homePageState.products.find(
            (p) => p.id === productId
          );
          if (product) {
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
                lucide.createIcons({ nodes: [addButton] });
              }
            }, 2000);
          }
        }
        return;
      }
    });

    document
      .getElementById("category-dropdown-toggle")
      ?.addEventListener("click", () => {
        document
          .getElementById("category-dropdown-menu")
          .classList.toggle("open");
        document.querySelector(".dropdown-chevron")?.classList.toggle("rotate");
      });

    document
      .getElementById("sort-by-select")
      ?.addEventListener("change", (e) => {
        homePageState.sortBy = e.target.value;
        renderProducts();
      });

    app._homePageListenersAttached = true;
  };

  renderSkeletons();
  try {
    const [heroSlidesData, productsData, categoriesData] = await Promise.all([
      getHeroSlides(),
      getProducts(),
      getCategories(),
    ]);
    setupHeroSlider(heroSlidesData);
    homePageState.products = productsData;
    homePageState.categories = ["All", ...categoriesData];
    const pageTitle =
      homePageState.selectedCategory === "All"
        ? "All Products"
        : homePageState.selectedCategory;
    const gridTitleEl = document.getElementById("product-grid-title");
    if (gridTitleEl) gridTitleEl.textContent = pageTitle;
    const selectedCatEl = document.getElementById("selected-category-label");
    if (selectedCatEl)
      selectedCatEl.textContent = homePageState.selectedCategory;
    renderCategories();
    renderProducts();
    addHomePageEventListeners();
  } catch (err) {
    console.error(err);
    const grid = document.getElementById("product-grid");
    if (grid) grid.innerHTML = `<p>Error loading products.</p>`;
  }
};
