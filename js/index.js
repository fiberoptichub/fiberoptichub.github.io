document.addEventListener('DOMContentLoaded', () => {
// Mobile Menu Toggle
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
if (menuBtn && mobileNav) {
menuBtn.addEventListener('click', () => {
const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
menuBtn.setAttribute('aria-expanded', !isExpanded);
mobileNav.setAttribute('aria-hidden', isExpanded);
mobileNav.style.display = isExpanded ? 'none' : 'flex';
});
}

// Loss Calculator Logic  
const calcForm = document.getElementById('lossCalcForm');  
if (calcForm) {  
    calcForm.addEventListener('submit', (e) => {  
        e.preventDefault();  
        const length = parseFloat(document.getElementById('fiberLength').value) || 0;  
        const splices = parseInt(document.getElementById('spliceCount').value) || 0;  
        const totalLoss = (length * 0.3) + (splices * 0.1);  
        const resultDiv = document.getElementById('calcResult');  
        if (resultDiv) {  
            resultDiv.textContent = `Estimated Loss: ${totalLoss.toFixed(2)} dB`;  
        }  
    });  
}  

let allArticles = [];  
let currentCategory = 'All';  
let currentPage = 1;  
const articlesPerPage = 5;  

const container = document.getElementById('paginatedArticlesContainer') || document.getElementById('articlesContainer');  
const paginationContainer = document.getElementById('paginationControls');  

// JSON ဖိုင်ကို အမျိုးမျိုးသော path ဖြင့် စမ်းခေါ်ခြင်း (Error မတက်စေရန်)  
const jsonPaths = ['articles.json', 'data/articles.json', './articles.json', './data/articles.json'];  

function loadArticlesJSON(index = 0) {  
    if (index >= jsonPaths.length) {  
        console.warn('articles.json not found. Using fallback demo articles.');  
        // ဖိုင်မရှိသေးရင် Test လုပ်လို့ရအောင် နမူနာပြသရန်  
        allArticles = [  
            {  
                title: "Fiber Optic အခြေခံများ နိဒါန်း",  
                url: "#",  
                date: "2026-09-19",  
                category: "Fiber Optic Basics",  
                level: "Beginner",  
                summary: "Fiber Optic ကေဘယ်လ်များ အလုပ်လုပ်ပုံနှင့် အခြေခံသဘောတရားများကို လေ့လာပါ။"  
            },  
            {  
                title: "Splicing ပြုလုပ်နည်း အဆင့်ဆင့်",  
                url: "#",  
                date: "2026-09-18",  
                category: "Splicing",  
                level: "Intermediate",  
                summary: "ဖိုင်ဘာကြိုးဆက်ခြင်း (Splicing) ပြုလုပ်ရာတွင် သိထားရမည့် အချက်များနှင့် ကျင့်စဉ်များ။"  
            }  
        ];  
        updateCategoryCounts();
        renderArticles();  
        setupCategoryFilter();  
        return;  
    }  

    fetch(jsonPaths[index])  
        .then(response => {  
            if (!response.ok) throw new Error('Not found');  
            return response.json();  
        })  
        .then(data => {  
            allArticles = data;  
            updateCategoryCounts();
            renderArticles();  
            setupCategoryFilter();  
            setupSearch();  
        })  
        .catch(() => {  
            loadArticlesJSON(index + 1);  
        });  
}  

loadArticlesJSON();  

function renderArticles() {  
    if (!container) return;  

    let filtered = allArticles;  
    if (currentCategory !== 'All') {  
        filtered = allArticles.filter(art =>   
            art.category && art.category.toLowerCase() === currentCategory.toLowerCase()  
        );  
    }  

    const startIndex = (currentPage - 1) * articlesPerPage;  
    const endIndex = startIndex + articlesPerPage;  
    const paginatedItems = filtered.slice(startIndex, endIndex);  

    container.innerHTML = '';  

    if (paginatedItems.length === 0) {  
        container.innerHTML = '<p style="color: #94a3b8; padding: 1rem 0;">ဤ Category ထဲတွင် ဆောင်းပါး မရှိသေးပါ။ Python script ဖြင့် build လုပ်ထားခြင်း ရှိမရှိ စစ်ဆေးပါ။</p>';  
        if (paginationContainer) paginationContainer.innerHTML = '';  
        return;  
    }  

    paginatedItems.forEach(art => {  
        const card = document.createElement('article');  
        card.className = 'article-card';  
        card.style.cssText = 'background: #1e293b; padding: 1.25rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 1rem;';  
        card.innerHTML = `  
            <div style="font-size: 0.8rem; color: #38bdf8; margin-bottom: 0.4rem; font-weight: bold;">${art.category || 'General'} • ${art.date || ''}</div>  
            <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;"><a href="${art.url}" style="color: #fff; text-decoration: none;">${art.title}</a></h3>  
            <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.5;">${art.summary || ''}</p>  
        `;  
        container.appendChild(card);  
    });  

    renderPagination(filtered.length);  
}  

function renderPagination(totalItems) {  
    if (!paginationContainer) return;  
    paginationContainer.innerHTML = '';  

    const totalPages = Math.ceil(totalItems / articlesPerPage);  
    if (totalPages <= 1) return;  

    for (let i = 1; i <= totalPages; i++) {  
        const btn = document.createElement('button');  
        btn.textContent = i;  
        btn.style.cssText = `padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid #475569; background: ${i === currentPage ? '#2563eb' : '#0f172a'}; color: #fff; cursor: pointer; margin-right: 5px;`;  
        btn.addEventListener('click', () => {  
            currentPage = i;  
            renderArticles();  
            window.scrollTo({ top: 300, behavior: 'smooth' });  
        });  
        paginationContainer.appendChild(btn);  
    }  
}  

function updateCategoryCounts() {
    const categoryLinks = document.querySelectorAll('.sidebar-categories a');

    categoryLinks.forEach(link => {
        link.style.display = 'flex';
        link.style.justifyContent = 'space-between';
        link.style.alignItems = 'center';
    });

    categoryLinks.forEach(link => {
        const href = link.getAttribute('href') || '';

        if (href.includes('all-articles')) {
            const count = allArticles.length;
            link.querySelector(".category-count").textContent = count;
            return;
        }

        const categoryName = link.dataset.category || "";




        const count = allArticles.filter(article =>
            article.category &&
            article.category.toLowerCase() === categoryName.toLowerCase()
        ).length;

        const emoji = link.textContent.match(/[📖🔧🔬📡]/)?.[0] || '';
        link.querySelector(".category-count").textContent = count;
    });
}

        function setupCategoryFilter() {  
    const categoryLinks = document.querySelectorAll('.sidebar-categories a, .categories a');  
    const sectionTitle = document.getElementById('sectionTitle');  

    categoryLinks.forEach(link => {  
        link.addEventListener('click', (e) => {  
            e.preventDefault();  
            categoryLinks.forEach(l => l.style.fontWeight = 'normal');  
            link.style.fontWeight = 'bold';  

            // HTML ထဲက Link text ယူမည့်အစား Link ရဲ့ href သို့မဟုတ် သတ်မှတ်ထားသော နာမည်ကို တိုက်ရိုက်သုံးခြင်း  
            const href = link.getAttribute('href');  
            let titleText = link.dataset.category || link.textContent.trim();

            if (href.includes('all-articles')) {  
                currentCategory = 'All';  
                if (sectionTitle) sectionTitle.textContent = 'All Articles (Newest First)';  
            } else {  
                currentCategory = titleText;  
                if (sectionTitle) sectionTitle.textContent = titleText;  
            }  
              
            currentPage = 1;  
            renderArticles();  
        });  
    });  
}  



function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (query.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        const matched = allArticles.filter(art => {
            const title = (art.title || '').toLowerCase();
            const summary = (art.summary || '').toLowerCase();
            const category = (art.category || '').toLowerCase();
            const level = (art.level || '').toLowerCase();

            return (
                title.includes(query) ||
                summary.includes(query) ||
                category.includes(query) ||
                level.includes(query)
            );
        });

        searchResults.style.display = 'block';
        searchResults.style.cssText =
            'position: absolute; top: 100%; left: 0; right: 0; background: #1e293b; border: 1px solid #475569; border-radius: 6px; margin-top: 5px; max-height: 300px; overflow-y: auto; z-index: 100; padding: 0.5rem;';

        if (matched.length === 0) {
            searchResults.textContent = 'No results found';
            searchResults.style.color = '#94a3b8';
            searchResults.style.fontSize = '0.9rem';
            return;
        }

        matched.forEach(art => {
            const item = document.createElement('a');
            item.href = art.url;
            item.style.cssText =
                'display: block; padding: 0.5rem; color: #38bdf8; text-decoration: none; font-size: 0.9rem; border-bottom: 1px solid #334155;';

            const title = document.createElement('div');
            title.textContent = art.title || '';

            const meta = document.createElement('div');
            meta.textContent =
                [art.category, art.level].filter(Boolean).join(' · ');
            meta.style.cssText =
                'color: #94a3b8; font-size: 0.75rem; margin-top: 2px;';

            item.appendChild(title);
            item.appendChild(meta);
            searchResults.appendChild(item);
        });
    });
}

});

/* Menu ဖွင့်ပိတ်ရန် လုပ်ဆောင်ချက် */
function toggleMenu() {
const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenu) {
mobileMenu.classList.toggle('show');
}
}

function closeMenu() {
const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenu) {
mobileMenu.classList.remove('show');
}
}

/* =========================================================
   RELATED ARTICLES
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const relatedContainer =
        document.getElementById("relatedArticlesContainer");

    if (!relatedContainer) return;

    /*
     * IMPORTANT:
     * Article pages are inside /articles/
     * Therefore ../data/articles.json is used here.
     */
    fetch("../data/articles.json")
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    `articles.json loading failed: ${response.status}`
                );
            }

            return response.json();
        })

        .then(articles => {

            if (!Array.isArray(articles)) {
                throw new Error(
                    "articles.json format is invalid."
                );
            }


            /* ---------------------------------------------
               Current Article
               --------------------------------------------- */

            const currentPath =
                window.location.pathname
                    .replace(/^\/+/, "")
                    .replace(/\/+$/, "");


            /* ---------------------------------------------
               Remove Current Article
               --------------------------------------------- */

            let relatedArticles =
                articles.filter(article => {

                    if (!article.url) return false;

                    const articlePath =
                        article.url
                            .replace(/^\/+/, "")
                            .replace(/\/+$/, "");

                    return !currentPath.endsWith(
                        articlePath
                    );
                });


            /* ---------------------------------------------
               Same Category First, Then Newest
               --------------------------------------------- */

            const currentArticle = articles.find(article => {
                if (!article.url) return false;

                const articlePath =
                    article.url
                        .replace(/^\/+/, "")
                        .replace(/\/+$/, "");

                return currentPath.endsWith(articlePath);
            });

            const currentCategory =
                currentArticle?.category || "";

            relatedArticles.sort((a, b) => {

                const aSameCategory =
                    currentCategory &&
                    a.category &&
                    a.category.toLowerCase() ===
                    currentCategory.toLowerCase();

                const bSameCategory =
                    currentCategory &&
                    b.category &&
                    b.category.toLowerCase() ===
                    currentCategory.toLowerCase();

                if (aSameCategory !== bSameCategory) {
                    return bSameCategory - aSameCategory;
                }

                return (
                    new Date(b.date || "1970-01-01") -
                    new Date(a.date || "1970-01-01")
                );

            });


            /* ---------------------------------------------
               ONLY 3 ARTICLES
               --------------------------------------------- */

            relatedArticles =
                relatedArticles.slice(0, 3);


            /* ---------------------------------------------
               No Articles
               --------------------------------------------- */

            if (relatedArticles.length === 0) {

                relatedContainer.innerHTML = `
                    <p style="color: var(--text-sub);">
                        ဆက်လက်လေ့လာရန် ဆောင်းပါး မရှိသေးပါ။
                    </p>
                `;

                return;
            }


            /* ---------------------------------------------
               Create Cards
               --------------------------------------------- */

            relatedContainer.innerHTML =
                relatedArticles.map(article => {

                    return `
                        <article class="related-card">

                            <div class="related-card-top">

                                <span class="related-category">
                                    ${article.category || "General"}
                                </span>

                                <span class="related-date">
                                    ${article.date || ""}
                                </span>

                            </div>


                            <h3 class="related-title">
                                <a href="../${article.url}">
                                    ${article.title || ""}
                                </a>
                            </h3>


                            <p class="related-summary">
                                ${article.summary || ""}
                            </p>


                            <div class="related-footer">

                                <a
                                    href="../${article.url}"
                                    class="related-read-more"
                                >
                                    ဆက်ဖတ်ရန်
                                    <span>→</span>
                                </a>

                            </div>

                        </article>
                    `;

                }).join("");

        })

        .catch(error => {

            console.error(
                "Related Articles Error:",
                error
            );

            relatedContainer.innerHTML = `
                <p style="color: #94a3b8;">
                    Related Articles များကို ဖတ်ယူ၍ မရပါ။
                </p>
            `;

        });

});

/* Back to Top Script */
document.addEventListener("DOMContentLoaded", () => {
const backToTopBtn = document.getElementById("backToTopBtn");

if (backToTopBtn) {  
    // စာမျက်နှာကို ဆင်းသည့်အခါ ခလုတ်ပေါ်လာရန် စစ်ဆေးခြင်း  
    window.addEventListener("scroll", () => {  
        if (window.scrollY > 300) {  
            backToTopBtn.classList.add("show");  
        } else {  
            backToTopBtn.classList.remove("show");  
        }  
    });  

    // ခလုတ်ကို နှိပ်လိုက်လျှင် အပေါ်ဆုံးသို့ ပြန်တက်ရန်  
    backToTopBtn.addEventListener("click", () => {  
        window.scrollTo({  
            top: 0,  
            behavior: "smooth"  
        });  
    });  
}

});

function selectCategory(element) {
// 1. အခြားဟာတွေမှာ ရှိတဲ့ active class တွေကို ဖြုတ်ပါ
const items = document.querySelectorAll('.category-item');
items.forEach(item => item.classList.remove('active'));

// 2. အခုနှိပ်လိုက်တဲ့ item ကို active class ထည့်ပါ  
element.classList.add('active');

}

document.addEventListener("DOMContentLoaded", function() {
// လက်ရှိ URL နဲ့ ကိုက်ညီတဲ့ Category ကို အလိုအလျောက် Active ဖြစ်စေရန်
const currentPath = window.location.pathname;
const categoryLinks = document.querySelectorAll('.category-item');

categoryLinks.forEach(link => {  
    // URL ထဲမှာ လင့်ခ်ပါလာရင် active class ထည့်ရန်  
    if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {  
        categoryLinks.forEach(el => el.classList.remove('active', 'font-bold'));  
        link.classList.add('active');  
        link.style.color = '#38bdf8';  
        link.style.fontWeight = 'bold';  
    }  

    // ကလစ်နှိပ်လိုက်တဲ့အခါ အရောင်ပြောင်းရန်  
    link.addEventListener('click', function() {  
        categoryLinks.forEach(el => {  
            el.classList.remove('active');  
            el.style.color = '#94a3b8'; // ပုံမှန်အရောင်  
            el.style.fontWeight = 'normal';  
        });  
        this.classList.add('active');  
        this.style.color = '#38bdf8'; // Active ဖြစ်စဉ် အရောင်  
        this.style.fontWeight = 'bold';  
    });  
});

});

const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');

if (menuBtn && mobileNav) {
menuBtn.addEventListener('click', function(e) {
e.stopPropagation();
mobileNav.classList.toggle('open');
});

// မီနူးအပြင်ဘက်ကို နှိပ်လိုက်ပါက ပိတ်သွားစေရန်  
document.addEventListener('click', function(e) {  
    if (!mobileNav.contains(e.target) && !menuBtn.contains(e.target)) {  
        mobileNav.classList.remove('open');  
    }  
});

}



// Search box ရဲ့ အပြင်ဘက်ကို နှိပ်လိုက်ရင် ရလဒ် ပျောက်သွားစေရန်
document.addEventListener('click', function(e) {
if (!e.target.closest('.search-box')) {
document.getElementById('searchResults').innerHTML = '';
}
});

function toggleWidget(headerElement) {
let widget = headerElement.closest('.collapsible-widget');
widget.classList.toggle('collapsed');
}

/* =========================================================
   SITE INFORMATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const articlesEl =
        document.getElementById("infoArticles");

    const categoriesEl =
        document.getElementById("infoCategories");

    const beginnerEl =
        document.getElementById("infoBeginner");

    const intermediateEl =
        document.getElementById("infoIntermediate");

    const advancedEl =
        document.getElementById("infoAdvanced");

    const latestArticleEl =
        document.getElementById("infoLatestArticle");


    if (!articlesEl) return;


    /* -----------------------------------------------------
       JSON PATHS
       ----------------------------------------------------- */

    const jsonPaths = [
        "data/articles.json",
        "../data/articles.json",
        "./data/articles.json",
        "./articles.json",
        "../articles.json"
    ];


    /* -----------------------------------------------------
       FIND WORKING JSON PATH
       ----------------------------------------------------- */

    function loadArticles(index = 0) {

        if (index >= jsonPaths.length) {

            throw new Error(
                "articles.json ကို ရှာမတွေ့ပါ။"
            );

        }


        return fetch(jsonPaths[index])
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                return response.json();

            })

            .catch(() => {

                return loadArticles(index + 1);

            });

    }


    /* -----------------------------------------------------
       LOAD ARTICLES
       ----------------------------------------------------- */

    loadArticles()

        .then(articles => {

            if (!Array.isArray(articles)) {
                throw new Error(
                    "articles.json format is invalid."
                );
            }


            /* -------------------------------------------------
               ARTICLES
               ------------------------------------------------- */

            articlesEl.textContent =
                articles.length;


            /* -------------------------------------------------
               CATEGORIES
               ------------------------------------------------- */

            const categories = new Set();

            articles.forEach(article => {

                if (article.category) {

                    categories.add(
                        String(article.category).trim()
                    );

                }

            });


            if (categoriesEl) {

                categoriesEl.textContent =
                    categories.size;

            }


            /* -------------------------------------------------
               LEVELS
               ------------------------------------------------- */

            let beginner = 0;
            let intermediate = 0;
            let advanced = 0;


            articles.forEach(article => {

                const level =
                    String(article.level || "")
                        .trim()
                        .toLowerCase();


                if (level === "beginner") {
                    beginner++;
                }

                else if (level === "intermediate") {
                    intermediate++;
                }

                else if (level === "advanced") {
                    advanced++;
                }

            });


            if (beginnerEl) {
                beginnerEl.textContent =
                    beginner;
            }

            if (intermediateEl) {
                intermediateEl.textContent =
                    intermediate;
            }

            if (advancedEl) {
                advancedEl.textContent =
                    advanced;
            }


            /* -------------------------------------------------
               LATEST ARTICLE
               ------------------------------------------------- */

            const datedArticles =
                articles
                    .filter(article => article.date)
                    .sort((a, b) => {

                        return new Date(b.date) -
                               new Date(a.date);

                    });


            if (
                latestArticleEl &&
                datedArticles.length > 0
            ) {

                latestArticleEl.textContent =
                    datedArticles[0].date;

            }


            console.log(
                "Site Information loaded:",
                articles.length,
                "articles"
            );

        })


        .catch(error => {

            console.error(
                "Site Information Error:",
                error
            );

        });


    /* -----------------------------------------------------
       COLLAPSIBLE
       ----------------------------------------------------- */

    const widget =
        document.querySelector(
            ".site-info-widget"
        );

    const toggle =
        document.querySelector(
            ".site-info-toggle"
        );


    if (widget && toggle) {

        toggle.addEventListener(
            "click",
            () => {

                const isCollapsed =
                    widget.classList.toggle(
                        "collapsed"
                    );

                toggle.setAttribute(
                    "aria-expanded",
                    String(!isCollapsed)
                );

            }
        );

    }

});
