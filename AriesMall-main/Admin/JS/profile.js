// Admin/JS/profile.js

import { supabase } from "../../JS/supabase-client.js";
import { showToast } from "./ui.js";

/**
 * Initializes the Admin Profile page, displaying user info and setting up logout.
 * @param {string} adminEmail - The expected email of the administrator.
 */
export async function initProfile(adminEmail) {
    if (!supabase) return;

    const logoutButton = document.getElementById('admin-logout-btn');
    const emailElement = document.getElementById('admin-email');

    // 1. Fetch User Data
    const { data: { user } } = await supabase.auth.getUser();

    if (user && user.email === adminEmail) {
        if (emailElement) {
            emailElement.textContent = user.email;
        }
    } else {
        // Should not happen due to checkAuth, but safe guard just in case.
        if (emailElement) {
            emailElement.textContent = "Unauthorized";
        }
    }

    // 2. Setup Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error("Logout failed:", error);
                if (window.ui && window.ui.showToast) {
                    showToast({ title: "Logout Failed", type: 'error' });
                }
            } else {
                if (window.ui && window.ui.showToast) {
                    showToast({ title: "Signed Out", description: "You have been successfully signed out.", type: 'success' });
                }
                // Redirect back to the login page after sign out
                window.location.hash = '#/admin-login';
            }
        });
    }
}

