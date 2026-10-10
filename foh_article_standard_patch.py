from pathlib import Path
from datetime import datetime
import re
import shutil
import sys

ROOT = Path.cwd()

WORKER = ROOT / "worker/src/index.js"
APP = ROOT / "publisher/app.js"
HTML = ROOT / "publisher/index.html"

def read(path):
    if not path.is_file():
        raise RuntimeError(f"Missing file: {path}")
    return path.read_text(encoding="utf-8")

def replace_once(text, pattern, replacement, label, flags=0):
    result, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"Expected exactly one match for: {label}; found {count}")
    return result

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

worker = read(WORKER)
app = read(APP)
html = read(HTML)

# Refuse to run twice.
if "FOH_ARTICLE_STANDARD_PATCH_V1" in worker:
    print("Patch marker already exists. No files changed.")
    sys.exit(0)

# ============================================================
# 1. WORKER: input values and Thailand date helper
# ============================================================

worker = replace_once(
    worker,
    r'async function generateArticle\(\s*data,\s*env\s*\)\s*\{',
    '''function getThailandDateISO() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.filter(part => part.type !== "literal")
         .map(part => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

/* FOH_ARTICLE_STANDARD_PATCH_V1 */
async function generateArticle(
  data,
  env
) {''',
    "Worker generation function"
)

worker = replace_once(
    worker,
    r'const description\s*=\s*String\(\s*data\.description\s*\|\|\s*""\s*\)\.trim\(\);',
    '''const description =
    String(data.description || "").trim();

  const imageNames = Array.isArray(data.imageNames)
    ? data.imageNames
        .slice(0, 10)
        .map(name => String(name || "").trim())
        .filter(Boolean)
    : [];

  const youtubeLink = String(data.youtubeLink || "").trim();

  const categoryIsAuto =
    !category || category.toLowerCase() === "auto";

  const levelIsAuto =
    !level || level.toLowerCase() === "auto";''',
    "Worker input fields"
)

# Replace the complete master prompt, preserving the surrounding API code.
worker = replace_once(
    worker,
    r'  const prompt = `.*?`;',
    '''  const prompt = `
You are the official AI educational content assistant
for Fiber Optic Hub, a technical knowledge-sharing website.

Create a technically accurate website article and a separate,
medium-length educational Facebook post about the same topic.

USER'S EXACT ARTICLE TITLE:
${title}

Do not rewrite, translate, shorten, or embellish the title.
Return it exactly as supplied.

CATEGORY INPUT: ${category}
CATEGORY AUTO-CLASSIFICATION: ${categoryIsAuto}
LEVEL INPUT: ${level}
LEVEL AUTO-CLASSIFICATION: ${levelIsAuto}

USER DESCRIPTION:
${description || "Create a useful educational article about this topic."}

IMAGE FILENAMES SUPPLIED BY THE USER:
${JSON.stringify(imageNames)}

USER-SUPPLIED YOUTUBE URL:
${youtubeLink || "(No YouTube URL supplied)"}

WEBSITE ARTICLE REQUIREMENTS
- Write primarily in clear, professional Myanmar language.
- Keep important technical terms in English.
- Explain concepts accurately and accessibly for the specified level.
- Include an introduction, relevant main sections, working principles,
  components or concepts, practical Fiber Optic examples, useful
  technical details, key points and a conclusion as appropriate.
- Use short mobile-friendly paragraphs and helpful bullet points.
- Use ##-style section headings in the structured JSON headings.
- Never invent specifications, measurements, sources or URLs.
- Do not include HTML, code fences, website URLs, Facebook promotions,
  hashtags, previous/next article links or related-article lists in prose.
- Preserve the term "Light Signal" exactly in English.
- In Fiber Optic context, translate "guide light" using "လမ်းကြောင်း",
  not "လမ်းညွှန်". For example, "Light ကို Fiber အတွင်း လမ်းကြောင်းပေးသည်".
- Use the exact category supplied unless CATEGORY AUTO-CLASSIFICATION
  is true. When Auto, select the most suitable category from:
  Fiber Optic Basics, FTTH, Splicing, Testing & Measurement,
  Troubleshooting, Advanced.
- Use the exact level supplied unless LEVEL AUTO-CLASSIFICATION is true.
  When Auto, classify as Beginner, Intermediate, or Advanced based
  on the technical depth required.
- If description is empty, generate a concise Myanmar description.

IMAGE PLACEMENT
- Never invent image filenames or image URLs.
- Only use filenames in the supplied list.
- Return one image_placements entry for each supplied filename.
- Select the most relevant section_heading from your generated sections.
- If no section is a good fit, use an empty section_heading.
- Write concise alt_text and an optional Myanmar caption.
- The application will render actual uploaded image URLs; do not output URLs.

FACEBOOK EDUCATIONAL POST DATA
- Provide a useful educational summary, not merely an advertisement.
- Keep it substantially shorter than the website article.
- Include useful technical facts and mobile-friendly points.
- Use Burmese where appropriate and a few relevant emojis.
- Avoid claiming that a Facebook post has already been published.
- The application adds the required final article link and hashtags.

Return ONLY valid JSON with exactly this schema:
{
  "title": "",
  "category": "",
  "level": "",
  "description": "",
  "introduction": "",
  "sections": [
    {
      "heading": "",
      "paragraphs": [],
      "bullets": []
    }
  ],
  "key_points": [],
  "conclusion": "",
  "image_placements": [
    {
      "image_name": "",
      "section_heading": "",
      "alt_text": "",
      "caption": ""
    }
  ],
  "facebook_summary": [],
  "facebook_note": [],
  "facebook_hashtags": []
}

For a non-Auto category or level, preserve the supplied value exactly.
Return the article title exactly as supplied.
Do not return Markdown, code fences or explanations outside JSON.
Verify technical accuracy before returning.
`;''',
    "Master prompt",
    flags=re.S
)

# Add authoritative metadata to the Worker response.
worker = replace_once(
    worker,
    r'    const finalArticle = \{\s*title:\s*String\(\s*article\.title\s*\),',
    '''    const finalArticle = {
      title: title,

      category: categoryIsAuto
        ? String(article.category || "Fiber Optic Basics").trim()
        : category,

      level: levelIsAuto
        ? String(article.level || "Beginner").trim()
        : level,

      date: getThailandDateISO(),

      youtube_link: youtubeLink,

      image_placements: Array.isArray(article.image_placements)
        ? article.image_placements.slice(0, 10)
        : [],''',
    "Final article metadata"
)

# Keep description and remaining structured content from the original object.
# The replacement above intentionally leaves the original description onward.

# ============================================================
# 2. WORKER: replace Markdown builder with section-aware images
# ============================================================

markdown_builder = r'''/* =====================================================
   BUILD ARTICLE MARKDOWN
===================================================== */

function buildArticleMarkdown(article, imageURLs) {
  const title = String(article.title || "").trim();
  const category = String(article.category || "Fiber Optic Basics").trim();
  const level = String(article.level || "Beginner").trim();
  const description = String(article.description || "")
    .replace(/\r?\n/g, " ")
    .trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(article.date || ""))
    ? String(article.date)
    : getThailandDateISO();

  const yamlEscape = value => String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ");

  const lines = [
    "---",
    `title: "${yamlEscape(title)}"`,
    `date: "${yamlEscape(date)}"`,
    `category: "${yamlEscape(category)}"`,
    `level: "${yamlEscape(level)}"`,
    `description: "${yamlEscape(description)}"`,
    "---",
    "",
    `# ${title}`,
    ""
  ];

  const urls = Array.isArray(imageURLs)
    ? imageURLs
    : (imageURLs ? [imageURLs] : []);

  const uploadedImages = urls.map((url, index) => {
    if (typeof url !== "string" || !url.startsWith(WEBSITE_URL + "/")) {
      return null;
    }

    const metadata = Array.isArray(article.images)
      ? article.images[index] || {}
      : {};

    const sourceName = String(metadata.name || "").trim();
    const placements = Array.isArray(article.image_placements)
      ? article.image_placements
      : [];

    const placement =
      placements.find(item =>
        String(item.image_name || "").trim() === sourceName
      ) ||
      placements[index] ||
      {};

    const rawAlt = String(placement.alt_text || "").trim();
    const rawCaption = String(placement.caption || "").trim();

    return {
      url: url.replace(WEBSITE_URL + "/", "../"),
      sourceName,
      heading: String(placement.section_heading || "").trim(),
      alt: rawAlt || `${title} — image ${index + 1}`,
      caption: rawCaption
    };
  }).filter(Boolean);

  const usedImages = new Set();

  const appendImage = image => {
    if (usedImages.has(image)) return;
    usedImages.add(image);

    lines.push(`![${image.alt.replace(/\]/g, "\\]")}](${image.url})`, "");

    if (image.caption) {
      lines.push(`*${image.caption}*`, "");
    }
  };

  if (article.introduction) {
    lines.push(String(article.introduction).trim(), "");
  }

  // Images without a matching section are shown after the introduction.
  uploadedImages
    .filter(image => !image.heading)
    .forEach(appendImage);

  if (Array.isArray(article.sections)) {
    article.sections.forEach(section => {
      const heading = String(section?.heading || "").trim();

      if (heading) {
        lines.push(`## ${heading}`, "");
      }

      // Put each image directly under its matching section heading.
      uploadedImages
        .filter(image =>
          !usedImages.has(image) &&
          image.heading &&
          image.heading.toLowerCase() === heading.toLowerCase()
        )
        .forEach(appendImage);

      if (Array.isArray(section?.paragraphs)) {
        section.paragraphs.forEach(paragraph => {
          const text = String(paragraph || "").trim();
          if (text) lines.push(text, "");
        });
      }

      if (Array.isArray(section?.bullets)) {
        const bullets = section.bullets
          .map(bullet => String(bullet || "").trim())
          .filter(Boolean);

        bullets.forEach(bullet => lines.push(`- ${bullet}`));
        if (bullets.length) lines.push("");
      }
    });
  }

  // Never silently omit an uploaded image because its heading did not match.
  uploadedImages.filter(image => !usedImages.has(image)).forEach(appendImage);

  if (Array.isArray(article.key_points) && article.key_points.length) {
    lines.push("## Key Points", "");

    article.key_points.forEach(point => {
      const text = String(point || "").trim();
      if (text) lines.push(`- ${text}`);
    });

    lines.push("");
  }

  if (article.conclusion) {
    lines.push("## Conclusion", "", String(article.conclusion).trim(), "");
  }

  const youtubeLink = String(article.youtube_link || "").trim();

  if (youtubeLink) {
    try {
      const parsed = new URL(youtubeLink);
      const allowedHosts = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be"
      ];

      if (["https:", "http:"].includes(parsed.protocol) &&
          allowedHosts.includes(parsed.hostname.toLowerCase())) {
        lines.push("## Further Learning", "", `[Watch on YouTube](${parsed.href})`, "");
      }
    } catch {
      // Invalid user-provided URL: omit it rather than invent or rewrite it.
    }
  }

  return lines.join("\n").trim() + "\n";
}

/* =====================================================
   BUILD ARTICLE HTML
===================================================== */'''

worker = replace_once(
    worker,
    r'/\* =====================================================\s+BUILD ARTICLE MARKDOWN\s+===================================================== \*/.*?/\* =====================================================\s+BUILD ARTICLE HTML\s+===================================================== \*/',
    lambda match: markdown_builder,
    "Markdown builder",
    flags=re.S
)

# ============================================================
# 3. WORKER: Facebook ending
# ============================================================

worker = replace_once(
    worker,
    r'function buildFacebookPost\(\s*article,\s*articleURL\s*\)\s*\{.*?\n\}\s*(?=/\* =====================================================\s+DATA IMAGE PARSER)',
    '''function buildFacebookPost(article, articleURL) {
  let post = "";

  post += "🌐 " + String(article.title || "") + "\\n\\n";

  if (article.description) {
    post += String(article.description) + "\\n\\n";
  }

  if (Array.isArray(article.facebook_summary) && article.facebook_summary.length) {
    article.facebook_summary.slice(0, 6).forEach(item => {
      post += "🔹 " + String(item).trim() + "\\n";
    });
    post += "\\n";
  }

  if (Array.isArray(article.facebook_note) && article.facebook_note.length) {
    post += "💡 မှတ်သားစရာ\\n\\n";
    article.facebook_note.slice(0, 6).forEach(item => {
      post += "🔹 " + String(item).trim() + "\\n";
    });
    post += "\\n";
  }

  post +=
    "📖 အသေးစိတ်အကြောင်းအရာများကို Fiber Optic Hub Website ရှိ Article အပြည့်အစုံတွင် ဆက်လက်ဖတ်ရှုနိုင်ပါတယ်။\\n" +
    "👉 Read Full Article: " + String(articleURL || "") + "\\n\\n";

  const hashtags = Array.isArray(article.facebook_hashtags)
    ? article.facebook_hashtags
    : [];

  post += hashtags.join(" ");

  return post;
}

/* =====================================================
   DATA IMAGE PARSER
===================================================== */''',
    "Facebook post builder",
    flags=re.S
)

# ============================================================
# 4. PUBLISHER: Auto fields, image names, YouTube URL
# ============================================================

app = replace_once(
    app,
    r'(const descriptionInput\s*=\s*document\.getElementById\(\s*"articleDescription"\s*\);\s*)',
    r'''\1

const youtubeInput =
  document.getElementById("articleYoutubeLink");
''',
    "Publisher YouTube input reference"
)

app = replace_once(
    app,
    r'(    description:\s*description\s*\n\s*\};)',
    '''    description: description,

    imageNames: selectedImageNames.slice(0, 10),

    youtubeLink: youtubeInput
      ? youtubeInput.value.trim()
      : ""
  };''',
    "Publisher generation request"
)

app = replace_once(
    app,
    r'category:\s*category,\s*level:\s*level,',
    '''category: String(article.category || category || "Fiber Optic Basics"),
      level: String(article.level || level || "Beginner"),''',
    "Publisher generated category and level",
    flags=re.S
)

# Insert structured image metadata and authoritative date before existing date property.
app = replace_once(
    app,
    r'(\n\s*date\s*:\s*)',
    '''
      image_placements: Array.isArray(article.image_placements)
        ? article.image_placements
        : [],

      youtube_link: String(article.youtube_link || ""),

      date: article.date || getPublisherThailandDate(),
''',
    "Publisher article date and media metadata",
    flags=re.S
)

# Add the date helper only once near the top of app.js.
app = replace_once(
    app,
    r'(const WEBSITE_URL\s*=\s*"https://fiberoptichub\.github\.io";)',
    r'''\1

function getPublisherThailandDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.filter(part => part.type !== "literal")
         .map(part => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}''',
    "Publisher Thailand date helper"
)

# Reset the optional YouTube URL when the form is cleared.
app = replace_once(
    app,
    r'(function clearPublisher\(\)\s*\{)',
    r'''\1
  if (youtubeInput) youtubeInput.value = "";''',
    "Publisher clear YouTube field"
)

# ============================================================
# 5. PUBLISHER HTML: Auto options and optional YouTube URL
# ============================================================

html = replace_once(
    html,
    r'(<select id="articleCategory">\s*)',
    r'''\1
                    <option value="Auto" selected>Auto — AI classify</option>
''',
    "Category Auto option"
)

html = replace_once(
    html,
    r'(<select id="articleLevel">\s*)',
    r'''\1
                    <option value="Auto" selected>Auto — AI classify</option>
''',
    "Level Auto option"
)

youtube_html = '''        <div class="form-group">
            <label for="articleYoutubeLink">YouTube Link (Optional)</label>
            <input
                type="url"
                id="articleYoutubeLink"
                placeholder="https://www.youtube.com/watch?v=..."
            >
            <small>ကိုယ်တိုင်ပေးထားတဲ့ YouTube URL ကိုသာ Article ထဲမှာ ထည့်ပါမယ်။</small>
        </div>

'''

html = replace_once(
    html,
    r'(?=<div class="form-group">\s*<label for="articleImage">)',
    youtube_html,
    "YouTube URL input"
)

# ============================================================
# 6. Verify all planned output before writing anything
# ============================================================

require("FOH_ARTICLE_STANDARD_PATCH_V1" in worker, "Worker patch marker missing")
require('"image_placements"' in worker, "Worker image placements missing")
require("Further Learning" in worker, "YouTube rendering missing")
require("Read Full Article: " in worker, "Facebook article URL ending missing")
require("youtubeInput" in app, "Publisher YouTube reference missing")
require("imageNames: selectedImageNames" in app, "Publisher image names missing")
require('value="Auto"' in html, "Auto options missing")
require('id="articleYoutubeLink"' in html, "YouTube input missing")

# Make backups only after every replacement has succeeded in memory.
stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_dir = ROOT / f".foh-article-standard-backup-{stamp}"
backup_dir.mkdir(parents=True, exist_ok=False)

for path in (WORKER, APP, HTML):
    shutil.copy2(path, backup_dir / path.name)

try:
    WORKER.write_text(worker, encoding="utf-8")
    APP.write_text(app, encoding="utf-8")
    HTML.write_text(html, encoding="utf-8")
except Exception:
    # Restore all three files if a write fails midway.
    for path in (WORKER, APP, HTML):
        backup = backup_dir / path.name
        if backup.exists():
            shutil.copy2(backup, path)
    raise

print("Patch applied.")
print(f"Backup directory: {backup_dir}")
print("Files changed:")
print(" - worker/src/index.js")
print(" - publisher/app.js")
print(" - publisher/index.html")
print("No commit, push, deployment, or Facebook post was performed.")
