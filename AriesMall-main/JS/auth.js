// JS/auth.js

import { supabase } from "./supabase-client.js";
import { showToast } from "./ui.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (formData, path) => {
  const errors = {};
  const email = formData.get("email");
  const password = formData.get("password");

  if (path === "/signup") {
    const fullName = formData.get("full_name");
    if (!fullName || fullName.trim().length === 0) {
      errors.full_name = "Full name is required.";
    }
  }

  if (!email || email.trim().length === 0) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password || password.length === 0) {
    errors.password = "Password is required.";
  } else if (path === "/signup" && password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }

  return errors;
};

const showFieldError = (input, message) => {
  input.classList.add("invalid");
  const errorElement = document.getElementById(`${input.name}-error`);
  if (errorElement) {
    errorElement.textContent = message;
  }
};

const clearAllErrors = (form) => {
  const inputs = form.querySelectorAll(".form-input");
  inputs.forEach((input) => {
    input.classList.remove("invalid");
    const errorElement = document.getElementById(`${input.name}-error`);
    if (errorElement) {
      errorElement.textContent = "";
    }
  });

  const errorMessageDiv = document.getElementById("auth-error-message");
  if (errorMessageDiv) {
    errorMessageDiv.style.display = "none";
    errorMessageDiv.textContent = "";
  }
};

export const initializeAuthPage = (path) => {
  const form = document.querySelector(
    path === "/login" ? "#login-form" : "#signup-form"
  );
  if (!form) return;

  form.querySelectorAll(".form-input").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("invalid");
      const errorElement = document.getElementById(`${input.name}-error`);
      if (errorElement) {
        errorElement.textContent = "";
      }
    });
  });

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!supabase) {
      showToast({
        title: "Service Error",
        description: "Authentication services are currently unavailable.",
        type: "error",
      });
      return;
    }

    clearAllErrors(form);

    const formData = new FormData(form);
    const errors = validateForm(formData, path);

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([fieldName, errorMessage]) => {
        const input = form.elements[fieldName];
        if (input) {
          showFieldError(input, errorMessage);
        }
      });
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const errorMessageDiv = document.getElementById("auth-error-message");
    if (button.disabled) return;

    const originalButtonText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<div class="spinner"></div>';

    try {
      const email = formData.get("email");
      const password = formData.get("password");
      let authResponse;

      if (path === "/login") {
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!authResponse.error) {
          // FIX: Correctly access the user's name for the welcome message.
          const userName =
            authResponse.data.user?.user_metadata?.full_name || "back";
          showToast({
            title: "Login Successful",
            description: `Welcome Back, ${userName}!`,
          });
          window.location.hash = "#/";
        }
      } else {
        const fullName = formData.get("full_name");
        authResponse = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (!authResponse.error) {
          showToast({
            title: "Account Created!",
            description: "Welcome to Aries Mall!",
            type: "success",
            duration: 5000,
          });
          window.location.hash = "#/";
          form.reset();
        }
      }

      if (authResponse.error) {
        throw authResponse.error;
      }
    } catch (error) {
      errorMessageDiv.textContent =
        error.message || "An unknown error occurred.";
      errorMessageDiv.style.display = "block";

      if (path === "/login") {
        const emailInput = form.elements["email"];
        const passwordInput = form.elements["password"];
        if (emailInput) emailInput.classList.add("invalid");
        if (passwordInput) passwordInput.classList.add("invalid");
      }
    } finally {
      button.disabled = false;
      button.innerHTML = originalButtonText;
    }
  };

  form.addEventListener("submit", submitHandler);
};

