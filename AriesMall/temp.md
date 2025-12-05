### System Instructions:
1. always ask for the files and confirmation of your plan before proceeding.
2. always provide complete files with the changes user will ask for.
3. at the of your response always give the small summary of what you have done and what is your next plan or question or suggestion.
4. always try to use less tokens because we have only 50k token window so work accordingly.
5. always give sets of files only in which changes are happened, to save the tokens.
6. most important thing always remember that if changes are very small or straight forward then don't generate complete files just give that code and proper step by step instructions to follow.
7. If files are too long then, split them in parts.
8. never use comments placeholders while regenerating files.

---
Enhancements:
- **Upload History:** change to display all links returned by uploader, upsclaer or enhancer in proper drop-down if links are more then 1.

---
### Cloudinary Details:
**Cloud Name:-** dc5tswwrw
**Upload Preset Name for Uploader:-** aries-mall-unsigned
**Upload Preset Name for Upscaler:-** aries_temp_upscaler

---
### API Credentials:
**Replicate API(dcspare git):-**
"r8_VRnMYgdExanZCA8fzKuc6DBwlMAv0KK0KLpse"
**Upscaler Model Version:-** "0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c"
name: tencentarc/gfpgan
**Enhancer Model Version:-** cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2  name: sczhou/codeformer

**Tinify API(d7598278):-** "yCW67Gx04X3Lf8Whv4XcDnhLr3NNdxBt"

---
### Cloudflare Details(Proxy Worker)
Google Login: disposaluse
Proxy Url: `https://cors.nexus-gateway.workers.dev/`
Free Limits: 100,000 request/day

### Where Can You Use This Proxy? (List of some Projects)

You can use this proxy in **any Frontend-Only Application** (React, Vue, Vanilla JS, Flutter Web) where you need to fetch data from an API that **blocks browsers**.

**1. AI & Machine Learning APIs**
*   **Replicate** (Image generation, restoration, LLMs).
*   **OpenAI** (ChatGPT, DALL-E) - *Note: Be careful exposing keys, restrict origins!*
*   **HuggingFace Inference API**.
*   **Stability AI** (Stable Diffusion).

**2. Image & File Processing**
*   **TinyPNG / Tinify** (Image compression).
*   **Remove.bg** (Background removal).
*   **Cloudinary** (Direct raw uploads via REST API if SDK isn't used).

**3. No-Code Databases & CMS**
*   **Notion API** (Fetching page content for a blog).
*   **Airtable** (Reading/Writing data from a static site).
*   **Google Sheets** (Using Sheets as a backend via Google Apps Script).

**4. Utility & Data Services**
*   **RSS Feeds** (Fetching news feeds from other domains).
*   **Crypto/Finance APIs** (CoinGecko, Currency conversion APIs that enforce CORS).
*   **Web Scraping** (Fetching raw HTML from a website to parse metadata).

---
**FINAL Suggestions:**


### 3. Security (The "Frontend-Only" Risk)
**Opinion:** The implementation of the **Supabase `system_config` table** and the **Cloudflare Worker (Nexus Gateway)** is a professional-grade solution for a frontend-only app.
**Suggestion:**
*   **Lock Down the Proxy:** In your Cloudflare Worker code, ensure `ALLOWED_ORIGINS` strictly contains *only* your production domain (`ariesmall.netlify.app`) and your local dev.
*   **Supabase RLS:** Go to Supabase > Database > Tables. Double-check that **Row Level Security (RLS)** is enabled on *every* table (`products`, `orders`, `profiles`).
    *   `products`: Public can READ, only Admin can WRITE.
    *   `orders`: Users can READ/WRITE their *own* orders. Admin can READ *all*.
    *   `system_config`: Public CANNOT read. Only Admin can READ.
Add Open Graph Meta Tags (so links look good on WhatsApp/Twitter).


what is your opinion and suggestion for our project in final production