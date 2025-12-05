// JS/api.js
// Central module for all API interactions.

import { supabase } from "./supabase-client.js";

// Mock Order History (Will be replaced by Supabase 'orders' table later)
const MOCK_ORDER_HISTORY = [
    {
      id: "ORD1001",
      date: "2025-10-20",
      total: 1299.0,
      status: "Delivered",
      items: [
        { name: "Luxury Leather Sofa", quantity: 1, price: 1200 },
        { name: "Delivery Fee", quantity: 1, price: 99.0 },
      ],
    },
    // ... other mock orders ...
];


// --- API FUNCTIONS (Supabase Implementation) ---

// NEW: Fetch slides from Supabase
export const getHeroSlides = async () => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('is_active', true) // Only fetch slides marked as 'active'
        .order('created_at', { ascending: true }); // Order them by creation date

    if (error) {
        console.error("Error fetching hero slides:", error);
        return []; // Return empty array on error
    }

    // IMPORTANT: Map database columns (snake_case) to the keys the frontend component expects (camelCase)
    return data.map(slide => ({
        title: slide.title,
        description: slide.description,
        buttonText: slide.button_text,
        buttonLink: slide.button_link,
        backgroundImageDesktop: slide.image_url_desktop,
        backgroundImageMobile: slide.image_url_mobile,
        thumbnailImage: slide.thumbnail_url,
        overlay: slide.show_overlay,
        fitDesktop: slide.fit_desktop,
        fitMobile: slide.fit_mobile,
    }));
};

// 1. Fetch All Products (Used by home.js, search.js)
export const getProducts = async () => {
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('products')
        .select('*'); 
    
    if (error) {
        console.error("Error fetching all products:", error);
        return [];
    }
    return data;
};

// 2. Fetch Categories (Dynamically extracted from product data)
export const getCategories = async () => {
    const products = await getProducts(); 
    
    const uniqueCategories = new Set(products.map(p => p.category));
    return Array.from(uniqueCategories);
};

/**
 * 3. Fetch Products by Category and optionally by Brand
 * @param {string} categorySlug - The category slug to filter by.
 * @param {string | null} [brandSlug=null] - The brand slug to filter by.
 */
export const getProductsByCategory = async (categorySlug, brandSlug = null) => {
    if (!supabase) return [];

    let query = supabase
        .from('products')
        .select('*')
        // Filter by category slug (case-insensitive approximation)
        .ilike('category', categorySlug);
        
    if (brandSlug) {
        // Filter by brand slug (case-insensitive approximation)
        // Ensure brand name in DB matches normalized brand slug
        query = query.ilike('brand', brandSlug); 
    }

    const { data, error } = await query;

    if (error) {
        console.error(`Error fetching products for category ${categorySlug} and brand ${brandSlug}:`, error);
        return [];
    }
    return data;
};


// 4. Fetch Single Product by ID (Used by product.js)
export const getProductById = async (id) => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        return null;
    }
    return data;
};

// --- API FUNCTIONS (Legacy/Auth - Retained for now) ---
export const login = async (email, password) => {
    return { user: { email }, session: {} };
};

export const signup = async (email, password) => {
    return { user: { email }, session: {} };
};

export const getOrderHistory = () => MOCK_ORDER_HISTORY;