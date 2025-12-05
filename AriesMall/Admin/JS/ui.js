// Admin/JS/ui.js

/**
 * Shows a toast notification.
 * @param {object} options - The options for the toast.
 * @param {string} options.title - The title of the toast.
 * @param {string} [options.description] - The description text.
 * @param {string} [options.type='success'] - 'success' or 'error'.
 * @param {number} [options.duration=4000] - How long the toast is visible in ms.
 */
export const showToast = ({
  title,
  description = "",
  type = "success",
  duration = 4000,
}) => {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    console.error("Toast container not found!");
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  const iconName = type === "success" ? "check-circle" : "alert-circle";

  toast.innerHTML = `
        <div class="toast__icon">
            <i data-feather="${iconName}"></i>
        </div>
        <div class="toast__message">
            <p class="toast__title">${title}</p>
            ${
              description
                ? `<p class="toast__description">${description}</p>`
                : ""
            }
        </div>
        <button class="toast__close">&times;</button>
    `;

  // Render the Feather icon we just added
  if (window.feather) {
    feather.replace({
      nodes: toast.querySelectorAll("[data-feather]"),
    });
  }

  const closeToast = () => {
    toast.classList.add("toast--hiding");
    toast.addEventListener("animationend", () => toast.remove(), {
      once: true,
    });
  };

  toast.querySelector(".toast__close").addEventListener("click", closeToast, {
    once: true,
  });

  setTimeout(closeToast, duration);

  toastContainer.appendChild(toast);
};
