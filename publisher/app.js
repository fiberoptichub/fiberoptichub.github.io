/* =====================================================
   FIBER OPTIC HUB
   ONE-CLICK ARTICLE PUBLISHER
   COMPLETE FINAL VERSION
   app.js
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

const WORKER_URL =
  "https://fiberoptichub-ai.htaylinnaung-ep.workers.dev/";


const WEBSITE_URL =
  "https://fiberoptichub.github.io";


/* =====================================================
   GLOBAL STATE
===================================================== */

let generatedArticle =
  null;

let selectedImagesData = [];
let selectedImageNames = [];
let selectedImageData = null;
let savedArticleURL = null;


/* =====================================================
   ELEMENTS
===================================================== */

const titleInput =
  document.getElementById(
    "articleTitle"
  );


const categoryInput =
  document.getElementById(
    "articleCategory"
  );


const levelInput =
  document.getElementById(
    "articleLevel"
  );


const descriptionInput =
  document.getElementById(
    "articleDescription"
  );


const imageInput =
  document.getElementById(
    "articleImage"
  );


const previewSection =
  document.getElementById(
    "previewSection"
  );


const articlePreview =
  document.getElementById(
    "articlePreview"
  );


const facebookPreview =
  document.getElementById(
    "facebookPreview"
  );


const publishButton =
  document.getElementById(
    "publishButton"
  );
const facebookPublishButton = document.getElementById("facebookPublishButton");


const statusBox =
  document.getElementById(
    "status"
  );


const previewStatus =
  document.getElementById(
    "previewStatus"
  );


/* =====================================================
   IMAGE SELECT — MULTIPLE IMAGES
===================================================== */

const selectedImagesPreview = (() => {
  if (!imageInput) return null;

  let element = document.getElementById("selectedImagesPreview");

  if (!element) {
    element = document.createElement("div");
    element.id = "selectedImagesPreview";
    element.className = "selected-images-preview";
    imageInput.insertAdjacentElement("afterend", element);
  }

  return element;
})();

function renderSelectedImagesPreview() {
  if (!selectedImagesPreview) return;

  if (!selectedImagesData.length) {
    selectedImagesPreview.innerHTML = "";
    return;
  }

  selectedImagesPreview.innerHTML = selectedImagesData.map(
    (src, index) => `
      <div class="selected-image-card">
        <img src="${src}" alt="Selected article image ${index + 1}">
        <div class="selected-image-actions">
          <span>Image ${index + 1}</span>
          <button type="button"
            class="remove-selected-image"
            data-remove-image="${index}"
            aria-label="Remove image ${index + 1}">Remove</button>
        </div>
      </div>
    `
  ).join("");
}

if (selectedImagesPreview) {
  selectedImagesPreview.addEventListener("click", function (event) {
    const button = event.target.closest("[data-remove-image]");
    if (!button) return;

    const index = Number(button.dataset.removeImage);
    if (!Number.isInteger(index) || index < 0 ||
        index >= selectedImagesData.length) return;

    selectedImagesData.splice(index, 1);
    selectedImageNames.splice(index, 1);
    selectedImageData = selectedImagesData[0] || null;
    renderSelectedImagesPreview();
  });
}

function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Image ဖတ်လို့ မရပါ။"));
    reader.readAsDataURL(file);
  });
}

if (imageInput) {
  imageInput.multiple = true;
  imageInput.accept = "image/*";

  imageInput.addEventListener("change", async function () {
    const files = Array.from(this.files || []);

    if (!files.length) {
      selectedImagesData = [];
      selectedImageNames = [];
      selectedImageData = null;
      renderSelectedImagesPreview();
      return;
    }

    if (files.length > 10) {
      showStatus("⚠️ ပုံ ၁၀ ပုံအထိသာ တစ်ကြိမ်ရွေးနိုင်ပါတယ်။", true);
      this.value = "";
      return;
    }

    const invalidFile = files.find(file =>
      !file.type.startsWith("image/") ||
      file.size > 5 * 1024 * 1024
    );

    if (invalidFile) {
      showStatus(
        "⚠️ ပုံဖိုင်သာ ရွေးပါ။ ပုံတစ်ပုံလျှင် 5MB ထက် မကျော်ရပါ။",
        true
      );
      this.value = "";
      return;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > 20 * 1024 * 1024) {
      showStatus("⚠️ ရွေးထားတဲ့ပုံအားလုံးပေါင်း 20MB ထက် မကျော်ရပါ။", true);
      this.value = "";
      return;
    }

    try {
      const images = await Promise.all(files.map(readImageAsDataURL));
      selectedImagesData = images;
      selectedImageNames = files.map(file => file.name);
      selectedImageData = selectedImagesData[0] || null;
      renderSelectedImagesPreview();
    } catch (error) {
      selectedImagesData = [];
      selectedImageNames = [];
      selectedImageData = null;
      renderSelectedImagesPreview();
      showStatus(error.message || "⚠️ Image ဖတ်လို့ မရပါ။", true);
    }
  });
}

/* =====================================================
   GENERATE ARTICLE
===================================================== */

async function generateArticle() {

  const title =
    titleInput
      ? titleInput.value.trim()
      : "";


  const category =
    categoryInput
      ? categoryInput.value
      : "Fiber Optic Basics";


  const level =
    levelInput
      ? levelInput.value
      : "Beginner";


  const description =
    descriptionInput
      ? descriptionInput.value.trim()
      : "";


  if (!title) {

    showStatus(
      "⚠️ Article Topic / Title ထည့်ပါ။",
      true
    );

    if (
      titleInput
    ) {

      titleInput.focus();

    }

    return;

  }


  const generateButton =
    document.querySelector(
      ".generate-btn"
    );


  if (
    generateButton
  ) {

    generateButton.disabled =
      true;

    generateButton.textContent =
      "🤖 Generating...";

  }


  if (
    publishButton
  ) {

    publishButton.disabled =
      true;

  }


  if (
    previewStatus
  ) {

    previewStatus.textContent =
      "GENERATING";

  }


  showStatus(
    "🤖 Gemini AI က Article ရေးနေပါတယ်..."
  );


  const requestData = {

    action:
      "generate",

    title:
      title,

    category:
      category,

    level:
      level,

    description:
      description

  };


  try {

    const response =
      await fetch(

        WORKER_URL,

        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify(
              requestData
            )

        }

      );


    const result =
      await response.json();


    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(

        result.message ||
        "Article generate မအောင်မြင်ပါ။"

      );

    }


    const article =
      result.article;


    if (!article) {

      throw new Error(
        "Article data မရပါ။"
      );

    }


    generatedArticle = {

      title:
        String(
          article.title ||
          title
        ),

      category:
        category,

      level:
        level,

      description:
        String(
          article.description ||
          description ||
          ""
        ),

      introduction:
        String(
          article.introduction ||
          ""
        ),

      sections:
        Array.isArray(
          article.sections
        )
          ? article.sections
          : [],

      key_points:
        Array.isArray(
          article.key_points
        )
          ? article.key_points
          : [],

      conclusion:
        String(
          article.conclusion ||
          ""
        ),

      facebook_summary:
        Array.isArray(
          article.facebook_summary
        )
          ? article.facebook_summary
          : [],

      facebook_note:
        Array.isArray(
          article.facebook_note
        )
          ? article.facebook_note
          : [],

      facebook_hashtags:
        Array.isArray(
          article.facebook_hashtags
        )
          ? article.facebook_hashtags
          : [],

      date:
        new Date().toISOString(),

      images: selectedImagesData.map((data, index) => ({
        name: selectedImageNames[index] || `image-${index + 1}.jpg`,
        data
      })),
      image: selectedImagesData[0] || null

    };

      savedArticleURL = null;
      if (facebookPublishButton) {
        facebookPublishButton.disabled = true;
        facebookPublishButton.textContent = "📘 Publish to Facebook";
      }


    renderArticlePreview(
      generatedArticle
    );


    renderFacebookPreview(
      generatedArticle
    );


    if (
      publishButton
    ) {

      publishButton.disabled =
        false;

    }


    if (
      previewStatus
    ) {

      previewStatus.textContent =
        "READY";

    }


    showStatus(
      "✅ Article Preview Ready!"
    );


    if (
      previewSection
    ) {

      previewSection.scrollIntoView({

        behavior:
          "smooth",

        block:
          "start"

      });

    }


  } catch (
    error
  ) {

    console.error(
      "Generate Error:",
      error
    );


    generatedArticle =
      null;


    if (
      publishButton
    ) {

      publishButton.disabled =
        true;

    }


    if (
      previewStatus
    ) {

      previewStatus.textContent =
        "ERROR";

    }


    showStatus(

      "❌ " +
      (
        error.message ||
        "Article Generate မအောင်မြင်ပါ။"
      ),

      true

    );

  } finally {

    if (
      generateButton
    ) {

      generateButton.disabled =
        false;

      generateButton.textContent =
        "🤖 Generate Article";

    }

  }

}


/* =====================================================
   ARTICLE PREVIEW
===================================================== */

function renderArticlePreview(
  article
) {

  if (
    !articlePreview
  ) {

    return;

  }


  const formattedDate =
    formatDate(
      article.date
    );


  const previewImages = Array.isArray(article.images)
    ? article.images.map(item =>
        typeof item === "string" ? item : item?.data
      ).filter(Boolean)
    : (article.image ? [article.image] : []);

  const imageHTML = previewImages.map((src, index) => `
    <figure class="preview-figure">
      <img
        src="${src}"
        alt="${escapeHTML(article.title)} — image ${index + 1}"
        class="preview-image"
        loading="lazy"
      >
      <figcaption>Image ${index + 1} of ${previewImages.length}</figcaption>
    </figure>
  `).join("");

  let contentHTML =
    "";


  if (
    article.introduction
  ) {

    contentHTML += `

      <h2>
        Introduction
      </h2>

      <p>
        ${escapeHTML(
          article.introduction
        )}
      </p>

    `;

  }


  if (
    Array.isArray(
      article.sections
    )
  ) {

    article.sections.forEach(
      section => {

        if (!section) {

          return;

        }


        const heading =
          String(
            section.heading ||
            ""
          ).trim();


        if (
          heading
        ) {

          contentHTML += `

            <h2>
              ${escapeHTML(
                heading
              )}
            </h2>

          `;

        }


        if (
          Array.isArray(
            section.paragraphs
          )
        ) {

          section.paragraphs.forEach(
            paragraph => {

              if (
                paragraph
              ) {

                contentHTML += `

                  <p>
                    ${escapeHTML(
                      paragraph
                    )}
                  </p>

                `;

              }

            }
          );

        }


        if (
          Array.isArray(
            section.bullets
          ) &&
          section.bullets.length
        ) {

          contentHTML +=
            "<ul>";


          section.bullets.forEach(
            bullet => {

              if (
                bullet
              ) {

                contentHTML += `

                  <li>
                    ${escapeHTML(
                      bullet
                    )}
                  </li>

                `;

              }

            }
          );


          contentHTML +=
            "</ul>";

        }

      }
    );

  }


  if (
    Array.isArray(
      article.key_points
    ) &&
    article.key_points.length
  ) {

    contentHTML += `

      <h2>
        Key Points
      </h2>

      <ul>

    `;


    article.key_points.forEach(
      point => {

        if (
          point
        ) {

          contentHTML += `

            <li>
              ${escapeHTML(
                point
              )}
            </li>

          `;

        }

      }
    );


    contentHTML +=
      "</ul>";

  }


  if (
    article.conclusion
  ) {

    contentHTML += `

      <h2>
        Conclusion
      </h2>

      <p>
        ${escapeHTML(
          article.conclusion
        )}
      </p>

    `;

  }


  articlePreview.innerHTML = `

    <article>

      <h1 class="preview-article-title">

        ${escapeHTML(
          article.title
        )}

      </h1>


      <div class="preview-meta">

        ${escapeHTML(
          article.category
        )}

        •

        ${escapeHTML(
          article.level
        )}

        •

        ${formattedDate}

      </div>


      ${imageHTML}


      <div class="preview-content">

        ${contentHTML}

      </div>

    </article>

  `;

}


/* =====================================================
   FACEBOOK PREVIEW
===================================================== */

function renderFacebookPreview(
  article
) {

  if (
    !facebookPreview
  ) {

    return;

  }


  const title =
    String(
      article.title ||
      ""
    ).trim();


  const description =
    String(
      article.description ||
      ""
    ).trim();


  let postText =
    "";


  postText +=
    "🌐 " +
    title +
    "\n\n";


  if (
    description
  ) {

    postText +=
      description +
      "\n\n";

  }


  if (
    Array.isArray(
      article.facebook_summary
    ) &&
    article.facebook_summary.length
  ) {

    postText +=
      "📚 ဒီ Article မှာ ဘာတွေ လေ့လာနိုင်မလဲ?\n\n";


    article.facebook_summary
      .slice(0, 6)
      .forEach(
        item => {

          postText +=
            "🔹 " +
            String(
              item
            ).trim() +
            "\n";

        }
      );


    postText +=
      "\n";

  }


  if (
    Array.isArray(
      article.facebook_note
    ) &&
    article.facebook_note.length
  ) {

    postText +=
      "💡 မှတ်သားစရာ\n\n";


    article.facebook_note
      .slice(0, 6)
      .forEach(
        item => {

          postText +=
            "🔹 " +
            String(
              item
            ).trim() +
            "\n";

        }
      );


    postText +=
      "\n";

  }


  const slug =
    createSlug(
      title
    );


  const articleURL =
    WEBSITE_URL +
    "/articles/" +
    slug +
    ".html";


  postText +=
    "📚 Read Full Article:\n" +
    articleURL +
    "\n\n";


  postText +=
    "Learn • Practice • Share\n\n";


  const hashtags =
    Array.isArray(
      article.facebook_hashtags
    )
      ? article.facebook_hashtags
      : [];


  postText +=
    hashtags.join(
      " "
    );


  facebookPreview.textContent =
    postText;

}


/* =====================================================
   SAVE ARTICLE — GITHUB ONLY
===================================================== */

async function publishArticle() {
  if (!generatedArticle) {
    showStatus("⚠️ Article မရှိသေးပါ။", true);
    return;
  }

  if (savedArticleURL) {
    showStatus("✅ ဒီ Article ကို GitHub မှာ သိမ်းပြီးပါပြီ။");
    return;
  }

  if (publishButton) {
    publishButton.disabled = true;
    publishButton.textContent = "💾 Saving...";
  }

  if (previewStatus) {
    previewStatus.textContent = "SAVING";
  }

  showStatus("💾 GitHub မှာ Article သိမ်းနေပါတယ်...");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "publish",
        article: generatedArticle
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Article သိမ်းဆည်းမှု မအောင်မြင်ပါ။");
    }

    if (!result.articleURL) {
      throw new Error("GitHub response မှ Article URL မရရှိပါ။");
    }

    savedArticleURL = result.articleURL;

    if (previewStatus) {
      previewStatus.textContent = "SAVED — READY FOR FACEBOOK";
    }

    if (facebookPreview && result.facebookPost) {
      facebookPreview.textContent = result.facebookPost;
    }

    if (articlePreview) {
      const oldNotice = articlePreview.querySelector(".publish-success");
      if (oldNotice) oldNotice.remove();

      const notice = document.createElement("div");
      notice.className = "publish-success";

      const heading = document.createElement("p");
      heading.textContent = "✅ Article saved to GitHub.";
      notice.appendChild(heading);

      const link = document.createElement("a");
      link.href = result.articleURL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "🌐 Open Published Article";
      notice.appendChild(link);

      articlePreview.insertAdjacentElement("afterbegin", notice);
    }

    if (facebookPublishButton) {
      facebookPublishButton.disabled = false;
      facebookPublishButton.textContent = "📘 Publish to Facebook";
    }

    showStatus("✅ GitHub မှာ သိမ်းပြီးပါပြီ။ Facebook တင်ဖို့ သီးခြားခလုတ်ကို နှိပ်ပါ။");

  } catch (error) {
    if (previewStatus) previewStatus.textContent = "SAVE ERROR";

    showStatus(
      "❌ " + (error.message || "Article သိမ်းဆည်းမှု မအောင်မြင်ပါ။"),
      true
    );

  } finally {
    if (publishButton) {
      publishButton.disabled = Boolean(savedArticleURL);
      publishButton.textContent = savedArticleURL
        ? "✅ Article Saved"
        : "💾 Save Article";
    }
  }
}


/* =====================================================
   PUBLISH TO FACEBOOK — USER CONFIRMATION REQUIRED
===================================================== */

async function publishToFacebook() {
  if (!generatedArticle || !savedArticleURL) {
    showStatus("⚠️ Facebook မတင်ခင် Article ကို GitHub မှာ အရင် Save လုပ်ပါ။", true);
    return;
  }

  if (!window.confirm(
    "Article ကို GitHub မှာ Save ပြီးပါပြီ။ Facebook Page မှာ အခုတင်မလား?"
  )) {
    return;
  }

  if (facebookPublishButton) {
    facebookPublishButton.disabled = true;
    facebookPublishButton.textContent = "📘 Publishing...";
  }

  if (previewStatus) previewStatus.textContent = "FACEBOOK PUBLISHING";

  showStatus("📘 Facebook Page မှာ တင်နေပါတယ်...");

  // Do not resend the image data. Facebook needs the article text only.
  const source = generatedArticle;
  const facebookArticle = {
    title: source.title,
    category: source.category,
    level: source.level,
    description: source.description,
    introduction: source.introduction,
    sections: source.sections,
    key_points: source.key_points,
    conclusion: source.conclusion,
    facebook_summary: source.facebook_summary,
    facebook_note: source.facebook_note,
    facebook_hashtags: source.facebook_hashtags,
    date: source.date
  };

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "facebook",
        article: facebookArticle
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success || !result.facebookPublished) {
      throw new Error(
        result.message ||
        "Facebook post အောင်မြင်ကြောင်း အတည်မပြုနိုင်ပါ။"
      );
    }

    if (previewStatus) previewStatus.textContent = "FACEBOOK PUBLISHED";

    if (facebookPreview && result.facebookPost) {
      facebookPreview.textContent = result.facebookPost;
    }

    if (facebookPublishButton) {
      facebookPublishButton.textContent = "✅ Facebook Published";
    }

    showStatus("✅ Facebook Page မှာ Post တင်ပြီးပါပြီ။");

  } catch (error) {
    // Prevent accidental duplicate posts if the response was lost.
    if (facebookPublishButton) {
      facebookPublishButton.disabled = true;
      facebookPublishButton.textContent = "⚠️ Verify Facebook";
    }

    if (previewStatus) previewStatus.textContent = "FACEBOOK STATUS UNKNOWN";

    showStatus(
      "⚠️ " + (error.message || "Facebook post ကို အတည်မပြုနိုင်ပါ။") +
      " Facebook Page ကို အရင်စစ်ပြီးမှ ထပ်ကြိုးစားပါ။",
      true
    );
  }
}


/* =====================================================
   CLEAR
===================================================== */

function clearPublisher() {

  savedArticleURL = null;
  if (facebookPublishButton) {
    facebookPublishButton.disabled = true;
    facebookPublishButton.textContent = "📘 Publish to Facebook";
  }
  if (publishButton) {
    publishButton.disabled = true;
    publishButton.textContent = "💾 Save Article";
  }


  if (
    titleInput
  ) {

    titleInput.value =
      "";

  }


  if (
    descriptionInput
  ) {

    descriptionInput.value =
      "";

  }


  if (
    categoryInput
  ) {

    categoryInput.selectedIndex =
      0;

  }


  if (
    levelInput
  ) {

    levelInput.selectedIndex =
      0;

  }


  if (
    imageInput
  ) {

    imageInput.value =
      "";

  }


  selectedImagesData = [];
  selectedImageNames = [];
  selectedImageData = null;
  renderSelectedImagesPreview();


  generatedArticle =
    null;


  if (
    articlePreview
  ) {

    articlePreview.innerHTML = `

      <div class="empty-preview">

        <div class="empty-icon">
          📄
        </div>

        <h3>
          No Article Yet
        </h3>

        <p>
          Topic ထည့်ပြီး
          Generate Article ကိုနှိပ်ပါ။
        </p>

      </div>

    `;

  }


  if (
    facebookPreview
  ) {

    facebookPreview.textContent =
      "Facebook Post ကို Generate လုပ်ပြီးနောက် ဒီနေရာမှာ ပြပါမယ်။";

  }


  if (
    publishButton
  ) {

    publishButton.disabled =
      true;

  }


  if (
    previewStatus
  ) {

    previewStatus.textContent =
      "DRAFT";

  }


  if (
    statusBox
  ) {

    statusBox.textContent =
      "";

  }

}


/* =====================================================
   STATUS
===================================================== */

function showStatus(
  message,
  isError = false
) {

  if (
    !statusBox
  ) {

    return;

  }


  statusBox.textContent =
    message;


  statusBox.style.color =
    isError
      ? "#ff8a80"
      : "#8fa3b8";

}


/* =====================================================
   DATE
===================================================== */

function formatDate(
  dateString
) {

  const date =
    new Date(
      dateString
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleDateString(
    "en-GB",
    {

      year:
        "numeric",

      month:
        "short",

      day:
        "numeric"

    }
  );

}


/* =====================================================
   SLUG
===================================================== */

function createSlug(
  text
) {

  const slug =
    String(
      text || ""
    )

      .toLowerCase()

      .trim()

      .replace(
        /[^a-z0-9\s-]/g,
        ""
      )

      .replace(
        /\s+/g,
        "-"
      )

      .replace(
        /-+/g,
        "-"
      )

      .replace(
        /^-+|-+$/g,
        "");


  return (
    slug ||
    "fiber-optic-article"
  );

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(
  value
) {

  return String(
    value || ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =====================================================
   INITIAL STATE
===================================================== */

if (
  publishButton
) {

  publishButton.disabled =
    true;

}


if (
  previewSection
) {

  previewSection.style.display =
    "block";

}


if (
  previewStatus
) {

  previewStatus.textContent =
    "DRAFT";

}


/* =====================================================
   PREVIEW FULLSCREEN CONTROLS
   Independent of article saving and Facebook publishing.
===================================================== */

function togglePreviewFullscreen(type) {
  const panels = {
    article: document.getElementById("articlePreviewPanel"),
    facebook: document.querySelector(".facebook-preview")
  };

  const target = panels[type];
  if (!target) return;

  const opening = !target.classList.contains("preview-fullscreen-active");

  // Keep only one preview fullscreen at a time.
  document.querySelectorAll(".preview-fullscreen-active").forEach((panel) => {
    panel.classList.remove("preview-fullscreen-active");

    const panelType = panel.id === "articlePreviewPanel"
      ? "article"
      : "facebook";

    const button = document.querySelector(
      '[data-preview-fullscreen="' + panelType + '"]'
    );

    if (button) {
      button.textContent = "⛶ Full Screen";
      button.setAttribute("aria-expanded", "false");
    }
  });

  if (opening) {
    target.classList.add("preview-fullscreen-active");
    document.body.classList.add("preview-fullscreen-open");

    const button = document.querySelector(
      '[data-preview-fullscreen="' + type + '"]'
    );

    if (button) {
      button.textContent = "✕ Close Full Screen";
      button.setAttribute("aria-expanded", "true");
    }
  } else {
    document.body.classList.remove("preview-fullscreen-open");
  }
}

document.addEventListener("keydown", function (event) {
  if (event.key !== "Escape") return;

  document.querySelectorAll(".preview-fullscreen-active").forEach((panel) => {
    panel.classList.remove("preview-fullscreen-active");

    const type = panel.id === "articlePreviewPanel"
      ? "article"
      : "facebook";

    const button = document.querySelector(
      '[data-preview-fullscreen="' + type + '"]'
    );

    if (button) {
      button.textContent = "⛶ Full Screen";
      button.setAttribute("aria-expanded", "false");
    }
  });

  document.body.classList.remove("preview-fullscreen-open");
});
