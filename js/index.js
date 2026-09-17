/* =====================================================
 * FIBER OPTIC HUB — DYNAMIC SYSTEM
 * - Mobile Menu Navigation
 * - Dynamic Search Index Fetching
 * - Optical Loss Budget Calculator
 * - Automatic Pagination System
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    // --------------------------------------------------
    // 1. MOBILE MENU TOGGLE
    // --------------------------------------------------
    const menuBtn = document.getElementById("menuBtn");
    const mobileNav = document.getElementById("mobileNav");

    if (menuBtn && mobileNav) {
        menuBtn.addEventListener("click", function () {
            const isShown = mobileNav.classList.toggle("show");
            menuBtn.setAttribute("aria-expanded", isShown);
            mobileNav.setAttribute("aria-hidden", !isShown);
        });

        mobileNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", function () {
                mobileNav.classList.remove("show");
                menuBtn.setAttribute("aria-expanded", "false");
                mobileNav.setAttribute("aria-hidden", "true");
            });
        });
    }

    // --------------------------------------------------
    // 2. DYNAMIC SEARCH INDEX FETCHING & REALTIME SEARCH
    // --------------------------------------------------
    const searchInput = document.getElementById("searchInput");
    const searchDropdown = document.getElementById("searchResults");

    if (searchInput && searchDropdown) {
        let articlesIndex = [];

        // Dynamic Path Resolver for root vs subfolder pages
        const currentPath = window.location.pathname;
        const isSubFolder = currentPath.includes("/articles/") || currentPath.includes("/categories/");
        const jsonPath = isSubFolder ? "../data/articles.json" : "data/articles.json";

        fetch(jsonPath)
            .then(response => {
                if (!response.ok) throw new Error("Failed to load search index");
                return response.json();
            })
            .then(data => {
                articlesIndex = data;
            })
            .catch(error => {
                console.error("Search Index Error:", error);
            });

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

            const results = articlesIndex.filter(article => {
                return (
                    article.title.toLowerCase().includes(query) ||
                    article.category.toLowerCase().includes(query) ||
                    article.desc.toLowerCase().includes(query) ||
                    (article.keywords && article.keywords.toLowerCase().includes(query))
                );
            });

            renderSearchResults(results, query, searchDropdown, isSubFolder);
        });

        document.addEventListener("click", function (e) {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = "none";
            }
        });
    }

    // --------------------------------------------------
    // 3. OPTICAL LOSS BUDGET CALCULATOR
    // --------------------------------------------------
    const lossForm = document.getElementById("lossCalcForm");
    const calcResult = document.getElementById("calcResult");

    if (lossForm && calcResult) {
        lossForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const length = parseFloat(document.getElementById("fiberLength").value) || 0;
            const splices = parseInt(document.getElementById("spliceCount").value) || 0;

            // Standard Loss Coefficients (1310nm Standard: Fiber=0.35dB/km, Splice=0.1dB)
            const fiberAttenuation = 0.35; 
            const spliceLoss = 0.1;

            const totalFiberLoss = length * fiberAttenuation;
            const totalSpliceLoss = splices * spliceLoss;
            const estimatedTotalLoss = (totalFiberLoss + totalSpliceLoss).toFixed(2);

            calcResult.innerHTML = `
                <div style="padding: 15px; background: rgba(41, 182, 246, 0.1); border: 1px solid #29b6f6; border-radius: 8px; color: #fff;">
                    <strong>Estimated Loss Results:</strong><br>
                    • Fiber Distance Loss (${length} km): <strong>${totalFiberLoss.toFixed(2)} dB</strong><br>
                    • Splice Loss (${splices} splices): <strong>${totalSpliceLoss.toFixed(2)} dB</strong><br>
                    -----------------------------------<br>
                    Total Link Loss: <strong style="color: #29b6f6; font-size: 1.1rem;">${estimatedTotalLoss} dB</strong>
                </div>
            `;
        });
    }

    // --------------------------------------------------
    // 4. AUTOMATIC PAGINATION SYSTEM
    // --------------------------------------------------
    const articlesPerPage = 6; // စာမျက်နှာတစ်ခုတွင် ပြသလိုသော Article အရေအတွက်
    const articleContainer = document.getElementById("auto-article-list");
    const paginationContainer = document.getElementById("articlePagination");

    if (articleContainer && paginationContainer) {
        const articles = Array.from(articleContainer.querySelectorAll(".searchable, .related-card, .article-card"));
        const totalPages = Math.ceil(articles.length / articlesPerPage);

        // Article အရေအတွက် ၆ ခုထက် နည်းပါက Pagination မပြပါ
        if (totalPages <= 1) {
            paginationContainer.style.display = "none";
        } else {
            function showPage(page) {
                const start = (page - 1) * articlesPerPage;
                const end = start + articlesPerPage;

                articles.forEach((article, index) => {
                    if (index >= start && index < end) {
                        article.style.display = "block";
                    } else {
                        article.style.display = "none";
                    }
                });

                renderPaginationControls(page);
            }

            function renderPaginationControls(currentPage) {
                let navHtml = "";

                // Previous Button
                if (currentPage > 1) {
                    navHtml += `<button onclick="changePage(${currentPage - 1})" class="page-btn">← Prev</button>`;
                } else {
                    navHtml += `<button class="page-btn disabled" disabled>← Prev</button>`;
                }

                // Page Numbers
                for (let i = 1; i <= totalPages; i++) {
                    if (i === currentPage) {
                        navHtml += `<button class="page-btn active">${i}</button>`;
                    } else {
                        navHtml += `<button onclick="changePage(${i})" class="page-btn">${i}</button>`;
                    }
                }

                // Next Button
                if (currentPage < totalPages) {
                    navHtml += `<button onclick="changePage(${currentPage + 1})" class="page-btn">Next →</button>`;
                } else {
                    navHtml += `<button class="page-btn disabled" disabled>Next →</button>`;
                }

                paginationContainer.innerHTML = navHtml;
            }

            // Global function ဖြင့် စာမျက်နှာ ကူးပြောင်းရန်
            window.changePage = function (page) {
                showPage(page);
                window.scrollTo({ top: articleContainer.offsetTop - 100, behavior: "smooth" });
            };

            // Initial Load
            showPage(1);
        }
    }
});

// Render Search Results Helper
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
        html += `
            <a href="${urlPrefix}${item.url}" class="search-result-card" style="display: block; padding: 12px; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div class="search-result-content">
                    <h3 style="margin: 0; font-size: 1rem; color: #fff;">${item.title}</h3>
                    <div class="search-result-meta" style="font-size: 0.8rem; color: #29b6f6; margin: 4px 0;">🏷️ ${item.category} • 📊 ${item.level}</div>
                    <p style="margin: 0; font-size: 0.85rem; color: #b8c7d9;">${item.desc}</p>
                </div>
            </a>
        `;
    });

    dropdown.innerHTML = html;
    dropdown.style.display = "block";
}
