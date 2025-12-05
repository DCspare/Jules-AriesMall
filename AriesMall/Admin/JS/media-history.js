// Admin/JS/media-history.js

import { supabase } from "../../JS/supabase-client.js";
import { showToast } from "./ui.js";

// --- SAVE TO DB ---
export const saveToHistory = async ({ name, url, type }) => {
  if (!supabase) return;

  try {
    const user = (await supabase.auth.getUser()).data.user;
    
    const { error } = await supabase.from('media_history').insert([{
      file_name: name,
      file_url: url,
      media_type: type,
      admin_email: user ? user.email : 'unknown'
    }]);

    if (error) throw error;
    
    // Refresh the list if it's currently visible
    const historyList = document.getElementById("history-list");
    if (historyList) {
        renderHistory();
    }

  } catch (error) {
    console.error("Failed to save media history:", error);
    // We don't show a toast here to avoid spamming the user if this background task fails
  }
};

// --- FETCH FROM DB ---
export const getHistory = async () => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('media_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50); // Fetch last 50 items

  if (error) {
    console.error("Error fetching history:", error);
    showToast({ title: "Error", description: "Could not load history.", type: "error" });
    return [];
  }
  return data;
};

// --- CLEAR HISTORY (Delete All) ---
export const clearHistory = async () => {
  if (!confirm("Are you sure you want to PERMANENTLY delete the entire upload history log? The files themselves will remain in Cloudinary.")) {
    return;
  }

  const { error } = await supabase
    .from('media_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    showToast({ title: "Error", description: "Could not clear history.", type: "error" });
  } else {
    showToast({ title: "History Cleared", type: "success" });
    renderHistory();
  }
};

// --- RENDER UI ---
export const renderHistory = async () => {
  const container = document.getElementById("history-list");
  if (!container) return;

  // Show loading state
  container.innerHTML = `<div class="content-loader"><div class="preloader-spinner"></div></div>`;

  const history = await getHistory();

  if (history.length === 0) {
    container.innerHTML = `
        <div class="empty-state">
            <i data-feather="clock" style="width: 48px; height: 48px; color: var(--border);"></i>
            <p style="margin-top: 1rem; color: var(--muted-foreground);">No history found.</p>
        </div>`;
    feather.replace();
    return;
  }

  container.innerHTML = history.map(item => {
    const date = new Date(item.created_at).toLocaleString();
    const typeIcon = item.media_type === 'upscale' ? 'trending-up' : 'upload-cloud';
    
    // Cloudinary thumb trick
    const thumbUrl = item.file_url.includes('cloudinary') 
        ? item.file_url.replace('/upload/', '/upload/w_100,h_100,c_fill/') 
        : item.file_url;

    return `
      <div class="history-item">
        <div class="history-item__left">
            <img src="${thumbUrl}" alt="thumb" class="history-item__thumb">
            <div class="history-item__info">
                <span class="history-item__name">${item.file_name}</span>
                <span class="history-item__meta">
                    <i data-feather="${typeIcon}" style="width:12px; height:12px;"></i> ${item.media_type} • ${date}
                </span>
            </div>
        </div>
        <div class="history-item__actions">
            <button class="action-btn copy-btn" data-url="${item.file_url}" title="Copy URL">
                <i data-feather="copy"></i>
            </button>
            <a href="${item.file_url}" target="_blank" class="action-btn" title="Open">
                <i data-feather="external-link"></i>
            </a>
        </div>
      </div>
    `;
  }).join("");

  // Add Listeners
  container.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        navigator.clipboard.writeText(btn.dataset.url);
        showToast({ title: "Copied!", description: "URL copied to clipboard.", type: "success" });
    });
  });

  feather.replace();
};

export const initMediaHistory = () => {
  const clearBtn = document.getElementById("clear-history-btn");
  if (clearBtn) {
    // Clone to remove old listeners
    const newBtn = clearBtn.cloneNode(true);
    clearBtn.parentNode.replaceChild(newBtn, clearBtn);
    newBtn.addEventListener("click", clearHistory);
  }

  renderHistory();
};
