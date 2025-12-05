// Admin/JS/admin.js

import { supabase } from "../../JS/supabase-client.js";
import { initDashboard } from "./dashboard.js";
import { initProductManager } from "./product-manager.js";
import { initAdminAuth } from "./admin-auth.js";
import { initProfile } from "./profile.js";

// Import necessary modules for Media Hub
import { initUploader } from './uploader.js';
import { initUpscaler } from './upscaler.js';
import { initEnhancer } from './enhancer.js';
import { initMediaHistory, renderHistory } from './media-history.js';

document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  const ADMIN_EMAIL = 'admin@ariesmall.com';
  // -------------------------
  
  // --- ELEMENT SELECTORS ---
  const content = document.getElementById("admin-content");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const adminLayout = document.querySelector(".admin-layout");
  const navLinks = document.querySelectorAll(".nav-link");
  const headerTitle = document.getElementById("header-title");
  const themeToggleBtn = document.getElementById("theme-toggle");
  const preloader = document.getElementById("preloader");
  const docElement = document.documentElement;
  
  const pageTitles = {
    dashboard: "Dashboard",
    "product-manager": "Product Manager",
    "media-hub": "Media Hub",
    profile: "User Profile",
    "admin-login": "Sign In",
  };
  
  // --- AUTH CHECK FUNCTION: Enforce Admin Role ---
  const checkAuth = async (targetPage) => {
    if (!supabase) return 'admin-login';
    
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthenticated = !!session;
    const userEmail = session?.user?.email;
    const isAdmin = isAuthenticated && (userEmail === ADMIN_EMAIL);
    
    if (!isAdmin && targetPage !== 'admin-login') {
      if (isAuthenticated) console.warn(`User ${userEmail} attempted unauthorized access.`);
      return 'admin-login';
    }
    
    if (isAdmin && targetPage === 'admin-login') {
      return 'dashboard';
    }
    return targetPage;
  };
  
  // --- ROUTER ---
  const loadContent = async (page) => {
    content.innerHTML = `<div class="content-loader"><div class="preloader-spinner"></div></div>`;
    
    const finalPage = await checkAuth(page);
    if (finalPage !== page) {
      window.location.hash = `#/${finalPage}`;
      return;
    }
    
    adminLayout.classList.toggle('auth-page', finalPage === 'admin-login');
    
    try {
      const response = await fetch(`Pages/${finalPage}.html`);
      if (!response.ok) throw new Error(`Page not found: ${finalPage}.html`);
      
      // Load HTML first
      content.innerHTML = await response.text();
      feather.replace();
      
      // Initialize Page Logic
      switch (finalPage) {
        case 'dashboard':
          initDashboard();
          break;
        case 'product-manager':
          initProductManager();
          break;
        case 'admin-login':
          initAdminAuth();
          break;
        case 'profile':
          initProfile(ADMIN_EMAIL);
          break;
        case 'media-hub':
          // 1. Init Tools (They now fetch config internally)
          initUploader(); 
          initUpscaler();
          initEnhancer();
          initMediaHistory(); // Ensure History is initialized
          
          // 2. Tab Switching Logic for Media Hub
          const switchTab = (tabName) => {
            // Deactivate all
            document.querySelectorAll('.media-tab-button, .media-tab-panel').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.custom-dropdown__menu li').forEach(el => el.classList.remove('active')); 
            
            // Activate selected desktop button and panel
            const desktopButton = document.querySelector(`.media-tab-button[data-tab="${tabName}"]`);
            const targetPanel = document.getElementById(`${tabName}-panel`);
            
            if (desktopButton) desktopButton.classList.add('active');
            if (targetPanel) targetPanel.classList.add('active');
            
            // Sync custom dropdown label (Mobile)
            const customLabel = document.getElementById('custom-dropdown-label');
            const selectedOption = document.querySelector(`.custom-dropdown__menu li[data-value="${tabName}"]`);
            if (selectedOption && customLabel) {
              customLabel.textContent = selectedOption.textContent;
              selectedOption.classList.add('active');
            }
            
            // Refresh history if selected
            if (tabName === 'history') {
              renderHistory();
            }
          };
          
          const initMediaManagerTabs = () => {
            // Desktop Button Listeners
            document.querySelectorAll('.media-tab-button').forEach(button => {
              button.addEventListener('click', () => switchTab(button.dataset.tab));
            });
            
            // Custom Dropdown Logic
            const customDropdown = document.getElementById('media-tab-select-custom');
            const dropdownButton = document.getElementById('custom-dropdown-button');
            const dropdownMenu = document.getElementById('custom-dropdown-menu');
            
            if (customDropdown && dropdownButton && dropdownMenu) {
              dropdownButton.addEventListener('click', (e) => {
                e.stopPropagation(); 
                customDropdown.classList.toggle('open');
                dropdownMenu.classList.toggle('hidden');
              });
              
              dropdownMenu.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', (e) => {
                  const tabName = e.target.dataset.value;
                  switchTab(tabName);
                  customDropdown.classList.remove('open');
                  dropdownMenu.classList.add('hidden');
                });
              });
              
              document.addEventListener('click', (e) => {
                if (customDropdown && !customDropdown.contains(e.target)) {
                  customDropdown.classList.remove('open');
                  dropdownMenu.classList.add('hidden');
                }
              });
            }
            
            // Set Initial Active Tab
            switchTab('enhancer');
          };
          
          const loadGuideContent = async () => {
            const guideContainer = document.querySelector('#guide-panel .guide-content');
            if (!guideContainer) return;
            
            try {
              const response = await fetch('admin-guide.md');
              if (!response.ok) throw new Error('admin-guide.md file not found.');
              
              const markdownText = await response.text();
              if (typeof marked !== 'undefined') {
                guideContainer.innerHTML = marked.parse(markdownText);
              } else {
                guideContainer.innerHTML = `<p class="error-message">Error: Markdown parser ('marked') is not loaded.</p>`;
              }
            } catch (error) {
              console.error('Failed to load guide:', error);
              guideContainer.innerHTML = `<p class="error-message">Error: Could not load the admin guide.</p>`;
            }
          };
          
          // Run the logic defined above
          initMediaManagerTabs();
          loadGuideContent();
          
          break; // Break AFTER all the logic works
      }
    } catch (error) {
      content.innerHTML = `<div class="content-wrapper"><h2>Error</h2><p>${error.message}</p></div>`;
      console.error("Failed to load page:", error);
    }
  };
  
  const handleRouteChange = () => {
    const hash = window.location.hash.substring(2) || "dashboard";
    loadContent(hash);
    updateActiveLink(hash);
    updateHeaderTitle(hash);
  };
  
  const updateActiveLink = (page) => navLinks.forEach((link) => link.classList.toggle("active", link.dataset.page === page));
  const updateHeaderTitle = (page) => (headerTitle.textContent = pageTitles[page] || "Admin");
  
  const applyTheme = () => {
    const currentTheme = localStorage.getItem("theme") || "dark";
    docElement.classList.toggle("dark", currentTheme === "dark");
  };
  themeToggleBtn.addEventListener("click", () => {
    docElement.classList.toggle("dark");
    localStorage.setItem("theme", docElement.classList.contains("dark") ? "dark" : "light");
  });
  
  menuToggle.addEventListener("click", () => adminLayout.classList.add("sidebar-open"));
  sidebarOverlay.addEventListener("click", () => adminLayout.classList.remove("sidebar-open"));
  navLinks.forEach((link) => link.addEventListener("click", () => adminLayout.classList.remove("sidebar-open")));
  
  // --- INITIALIZATION ---
  function init() {
    applyTheme();
    feather.replace();
    window.addEventListener("hashchange", handleRouteChange);
    handleRouteChange(); // Initial page load
    preloader.classList.add("fade-out");
  }
  
  setTimeout(init, 300); 
});