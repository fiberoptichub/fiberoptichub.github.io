/* =====================================================
   FIBER OPTIC HUB — DYNAMIC SYSTEM
   - Mobile Menu Navigation
   - Dynamic Search Index Fetching (Fixed Description Mismatch)
   - Optical Loss Budget Calculator
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    // 1. MOBILE MENU TOGGLE
    const menuBtn = document.getElementById("menuBtn");
    const mobileNav = document.getElementById("mobileNav");

    if (menuBtn && mobileNav) {
        menuBtn.addEventListener("click", function () {
            mobileNav.classList.toggle("show");
            const isExpanded = mobileNav.classList.contains("show");
            menuBtn.setAttribute("aria-expanded", isExpanded);
        });
    }

    // 2. DYNAMIC SEARCH INDEX FETCHING
    const searchInput = document.getElementById("searchInput") || document.querySelector(".search-box input");
    const searchDropdown = document.getElementById("searchResults") || document.querySelector(".search-results-dropdown");

    if (searchInput && searchDropdown) {
        let articlesIndex = [];

        // Determine relative path for data/articles.json
        const currentPath = window.location.pathname;
        const isSubFolder = currentPath.includes("/articles/") || currentPath.includes("/categories/");
        const jsonPath = isSubFolder ? "../data/articles.json" : "data/articles.json";

        // Fetch Articles JSON Data (with Cache-busting)
        fetch(`${jsonPath}?v=${new Date().getTime()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to load articles index");
                }
                return response.json();
            })
            .then(data => {
                articlesIndex = data;
            })
            .catch(error => {
                console.error("Search Index Error:", error);
            });

        // Real-time Input Event Listener
        searchInput.addEventListener("input", function () {
            const query = this.value.trim().toLowerCase();

            if (query.length === 0) {
                searchDropdown.innerHTML = "";
                searchDropdown.style.display = "none";
                return;
            }

            if (articlesIndex.length === 0) {
                searchDropdown.innerHTML = `<div class="search-no-results" style="padding: 15px; color: #b8c7d9;">ဆောင်းပါးများ ရယူနေပါသည်...</div>`;
                searchDropdown.style.display = "block";
                return;
            }

            // Filter Search Index (Handling both description and desc)
            const results = articlesIndex.filter(article => {
                const title = (article.title || "").toLowerCase();
                const category = (article.category || "").toLowerCase();
                const description = (article.description || article.desc || "").toLowerCase();

                return title.includes(query) || category.includes(query) || description.includes(query);
            });

            renderSearchResults(results, query, searchDropdown, isSubFolder);
        });

        // Close search dropdown on outside click
        document.addEventListener("click", function (e) {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = "none";
            }
        });
    }
});

// 3. RENDER SEARCH RESULTS IN DROPDOWN
function renderSearchResults(results, query, dropdown, isSubFolder) {
    if (results.length === 0) {
        dropdown.innerHTML = `<div class="search-no-results" style="padding: 15px; color: #b8c7d9;">"${query}" နှင့် ပတ်သက်သော ဆောင်းပါး ရှာမတွေ့ပါ။</div>`;
        dropdown.style.display = "block";
        return;
    }

    let html = `<div class="search-results-header" style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem; color: #b8c7d9;">
                    <span>ရှာဖွေတွေ့ရှိချက် (${results.length} ခု)</span>
                </div>`;

    const urlPrefix = isSubFolder ? "../" : "";

    results.forEach(item => {
        // Safe check for description or desc property
        const itemDesc = item.description || item.desc || "";

        html += `
            <a href="${urlPrefix}${item.url}" class="search-result-card" style="display: block; padding: 12px; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div class="search-result-content">
                    <h3 style="margin: 0; font-size: 1rem; color: #fff;">${item.title}</h3>
                    <div class="search-result-meta" style="font-size: 0.8rem; color: #29b6f6; margin: 4px 0;">🏷️ ${item.category} • 📊 ${item.level || 'Beginner'}</div>
                    <p style="margin: 0; font-size: 0.85rem; color: #b8c7d9;">${itemDesc}</p>
                </div>
            </a>
        `;
    });

    dropdown.innerHTML = html;
    dropdown.style.display = "block";
}
