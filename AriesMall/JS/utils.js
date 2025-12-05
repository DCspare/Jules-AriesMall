// JS/utils.js

/**
 * Converts a number into a formatted currency string (Indian Rupees).
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted currency string (e.g., "₹1,234.50").
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
      return '₹0.00';
  }

  // Use Intl.NumberFormat for standard Indian Rupee formatting
  // locale: 'en-IN' ensures comma placement and currency symbol are correct.
  return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
  }).format(amount);
};

/**
* A simple utility to sanitize text content before rendering it into HTML.
* This prevents XSS attacks by escaping key HTML characters.
* @param {any} text - The input text to sanitize.
* @returns {string} The sanitized text.
*/
export const sanitizeText = (text) => {
  if (text === null || text === undefined) {
    return "";
  }
  const textStr = String(text);
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return textStr.replace(/[&<>"']/g, (m) => map[m]);
};