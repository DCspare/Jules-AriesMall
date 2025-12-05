// Admin/JS/admin-auth.js

import { supabase } from "../../JS/supabase-client.js";
import { showToast } from "./ui.js"; 

/**
 * Executes the login attempt for the admin panel.
 */
export function initAdminAuth() {
    const form = document.getElementById('admin-login-form');
    const loginButton = document.getElementById('login-button');
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');
    const errorMessage = document.getElementById('auth-error-message');

    if (!form || !loginButton) return; 

    // Helper to manage button state (Fixes button collapse/re-enable issue)
    const toggleLoading = (isLoading) => {
        // 1. Disable button to prevent double clicks
        loginButton.disabled = isLoading;
        
        // 2. Hide text, show spinner
        buttonText.classList.toggle('hidden', isLoading);
        buttonSpinner.classList.toggle('hidden', !isLoading);
        
        // 3. Clear existing error message when starting a new attempt
        if (isLoading) {
            errorMessage.classList.add('hidden');
            errorMessage.textContent = '';
        }
    };

    const displayError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        showToast({ title: "Login Failed", description: message, type: 'error' });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        toggleLoading(true);

        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!supabase) {
            displayError("System error: Database client not configured.");
            toggleLoading(false); 
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error("Admin login error:", error);
                
                let msg = "Login failed. Check your credentials.";
                if (error.message.includes("Invalid login credentials")) {
                    msg = "Invalid email or password.";
                } else if (error.message.includes("Email not confirmed")) {
                    msg = "Please confirm your email address first.";
                }
                
                displayError(msg);
                toggleLoading(false); // RE-ENABLE BUTTON ON FAILURE

            } else {
                // SUCCESS: Redirection handled here (Fixes redirection issue)
                showToast({ title: "Login successful", description: "Redirecting...", type: 'success' });
                
                // Force the hash change to trigger the router, which should confirm the session
                window.location.hash = '#/dashboard';
            }
        } catch (e) {
            console.error("Critical login submission error:", e);
            displayError("An unexpected error occurred during submission.");
            toggleLoading(false); // RE-ENABLE BUTTON ON CRITICAL ERROR
        }
    });
}