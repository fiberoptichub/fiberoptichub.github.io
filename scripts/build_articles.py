import os
import re
import json
import markdown
import frontmatter


# =========================================================
# Fiber Optic Hub - Article Builder
# =========================================================

ARTICLES_DIR = "articles"
MARKDOWN_DIR = "markdown_articles"
TEMPLATE_PATH = os.path.join("templates", "template.html")

DATA_DIR = "data"
JSON_OUTPUT = os.path.join(DATA_DIR, "articles.json")

SITEMAP_OUTPUT = "sitemap.xml"
SITE_URL = "https://fiberoptichub.github.io"

# =========================================================
# Reading Time
# =========================================================

def calculate_reading_time(text):
    words = text.split()
    word_count = len(words)

    minutes = max(1, round(word_count / 200))

    return f"{minutes} min read"


# =========================================================
# Normalize Custom Image Syntax
#
# Supports:
#
# [Data Transmission] (../images/data-transmission.jpg)
#
# and converts it to:
#
# ![Data Transmission](../images/data-transmission.jpg)
#
# Also supports normal Markdown image syntax.
# =========================================================

def normalize_images(text):

    # Custom image format:
    # [Alt Text] (image.jpg)
    #
    # Note:
    # There is a space between ] and (
    custom_image_pattern = re.compile(
        r'\[([^\]]+)\]\s+\(([^)\s]+)\)'
    )

    def replace_image(match):

        alt = match.group(1).strip()
        src = match.group(2).strip()

        # If it already looks like a normal link,
        # don't blindly convert it.
        return f"![{alt}]({src})"

    text = custom_image_pattern.sub(replace_image, text)

    return text


# =========================================================
# Normalize Pipe Tables
#
# Converts simple pipe-separated comparison blocks such as:
#
# Copper Cable | Fiber Optic
# Signal Type | Electrical Signal | Light Signal
# Bandwidth   | Lower            | Higher
#
# into valid Markdown tables.
# =========================================================

def normalize_pipe_tables(text):

    lines = text.splitlines()
    output = []

    i = 0

    while i < len(lines):

        line = lines[i]

        # A table candidate must contain at least one pipe.
        if "|" not in line:
            output.append(line)
            i += 1
            continue

        # Don't interfere with already-valid Markdown tables.
        if i + 1 < len(lines):
            next_line = lines[i + 1].strip()

            separator_test = next_line.replace("|", "").replace("-", "").replace(":", "").strip()

            if (
                "|" in next_line
                and separator_test == ""
                and "-" in next_line
            ):
                output.append(line)
                i += 1
                continue

        # Collect consecutive pipe lines.
        block = []
        j = i

        while j < len(lines):
            current = lines[j].strip()

            if not current or "|" not in current:
                break

            block.append(current)
            j += 1

        # Need at least 2 rows to become a table.
        if len(block) >= 2:

            # Parse cells
            rows = []

            for row in block:

                # Remove optional leading/trailing pipe
                row = row.strip()

                if row.startswith("|"):
                    row = row[1:]

                if row.endswith("|"):
                    row = row[:-1]

                cells = [cell.strip() for cell in row.split("|")]

                rows.append(cells)

            # Determine maximum number of columns
            column_count = max(len(row) for row in rows)

            # Ignore very small accidental pipe usage
            if column_count >= 2:

                # Normalize row lengths
                for row in rows:
                    while len(row) < column_count:
                        row.append("")

                # Header
                header = rows[0]

                output.append(
                    "| " + " | ".join(header) + " |"
                )

                # Separator
                output.append(
                    "| "
                    + " | ".join(["---"] * column_count)
                    + " |"
                )

                # Remaining rows
                for row in rows[1:]:

                    output.append(
                        "| " + " | ".join(row) + " |"
                    )

                i = j
                continue

        # If it wasn't actually a table
        output.append(line)
        i += 1

    return "\n".join(output)


# =========================================================
# Normalize Markdown Content
# =========================================================

def normalize_markdown(text):

    # 1. Fix custom image syntax
    text = normalize_images(text)

    # 2. Fix simple comparison / pipe tables
    text = normalize_pipe_tables(text)

    return text


# =========================================================
# Convert Markdown -> HTML
# =========================================================

def markdown_to_html(text):

    text = normalize_markdown(text)

    body_html = markdown.markdown(
        text,
        extensions=[
            "extra",
            "tables",
            "fenced_code",
            "sane_lists"
        ]
    )

    return body_html


# =========================================================
# Get Metadata
# =========================================================

# =========================================================
# Get OG Image
# Uses the first image in the article as the Open Graph image.
# Falls back to the default OG image when no article image exists.
# =========================================================

def get_og_image(text):

    normalized_text = normalize_images(text)

    match = re.search(
        r"!\[[^\]]*\]\(([^)\s]+)",
        normalized_text
    )

    if not match:
        return f"{SITE_URL}/images/og-image.jpg"

    image_path = match.group(1).strip()

    if image_path.startswith(("http://", "https://")):
        return image_path

    while image_path.startswith("../"):
        image_path = image_path[3:]

    if image_path.startswith("./"):
        image_path = image_path[2:]

    if image_path.startswith("/"):
        image_path = image_path[1:]

    return f"{SITE_URL}/{image_path}"


def get_metadata(post):

    title = (
        post.get("title")
        or post.get("TITLE")
        or "Untitled"
    )

    date = str(
        post.get("date")
        or post.get("DATE")
        or ""
    )

    category = (
        post.get("category")
        or post.get("CATEGORY")
        or "All"
    )

    level = (
        post.get("level")
        or post.get("LEVEL")
        or "Beginner"
    )

    description = (
        post.get("description")
        or post.get("DESCRIPTION")
        or ""
    )

    return (
        str(title),
        date,
        str(category),
        str(level),
        str(description)
    )


# =========================================================
# Main Pipeline
# =========================================================

def build_articles_pipeline():

    # -----------------------------------------------------
    # Check directories
    # -----------------------------------------------------

    if not os.path.exists(MARKDOWN_DIR):

        print(
            f"Directory not found: {MARKDOWN_DIR}"
        )

        return

    if not os.path.exists(ARTICLES_DIR):
        os.makedirs(ARTICLES_DIR)

    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

    if not os.path.exists(TEMPLATE_PATH):

        print(
            f"Error: Template file not found at "
            f"{TEMPLATE_PATH}"
        )

        return

    # -----------------------------------------------------
    # Load template
    # -----------------------------------------------------

    with open(
        TEMPLATE_PATH,
        "r",
        encoding="utf-8"
    ) as tf:

        template_content = tf.read()

    # -----------------------------------------------------
    # Find Markdown files
    # -----------------------------------------------------

    md_files = [
        f
        for f in os.listdir(MARKDOWN_DIR)
        if f.lower().endswith(".md")
    ]

    def get_file_date(filename):
        post = frontmatter.load(
            os.path.join(MARKDOWN_DIR, filename)
        )
        return str(
            post.get("date")
            or post.get("DATE")
            or ""
        )

    md_files.sort(
        key=get_file_date,
        reverse=True
    )

    total_files = len(md_files)

    articles_data = []

    # -----------------------------------------------------
    # Build each article
    # -----------------------------------------------------

    for i, filename in enumerate(md_files):

        md_path = os.path.join(
            MARKDOWN_DIR,
            filename
        )

        print(
            f"Processing: {filename}"
        )

        try:

            # ---------------------------------------------
            # Load Markdown + Front Matter
            # ---------------------------------------------

            with open(
                md_path,
                "r",
                encoding="utf-8"
            ) as mf:

                post = frontmatter.load(mf)

            # ---------------------------------------------
            # Convert Markdown content
            # ---------------------------------------------

            body_html = markdown_to_html(
                post.content
            )

            # ---------------------------------------------
            # Metadata
            # ---------------------------------------------

            (
                title,
                date,
                category,
                level,
                description
            ) = get_metadata(post)

            og_image = get_og_image(post.content)

            read_time = calculate_reading_time(
                post.content
            )

            # ---------------------------------------------
            # Previous / Next
            # ---------------------------------------------

            prev_link = (
                md_files[i - 1].replace(".md", ".html")
                if i > 0
                else "#"
            )

            next_link = (
                md_files[i + 1].replace(".md", ".html")
                if i < total_files - 1
                else "#"
            )

            # ---------------------------------------------
            # Inject data into template
            # ---------------------------------------------

            article_html = template_content

            replacements = {

                "{{ARTICLE_TITLE}}": title,
                "{{ARTICLE_SLUG}}": os.path.splitext(filename)[0],

                "{{ARTICLE_DATE}}": date,

                "{{ARTICLE_CATEGORY}}": category,

                "{{ARTICLE_LEVEL}}": level,

                "{{ARTICLE_DESCRIPTION}}": description,
                "{{ARTICLE_OG_IMAGE}}": og_image,


                "{{READ_TIME}}": read_time,

                "{{ARTICLE_CONTENT}}": body_html,

                "{{PREV_ARTICLE}}": prev_link,

                "{{NEXT_ARTICLE}}": next_link,
            }

            for placeholder, value in replacements.items():

                article_html = article_html.replace(
                    placeholder,
                    str(value)
                )

            # ---------------------------------------------
            # Output
            # ---------------------------------------------

            output_filename = filename.replace(
                ".md",
                ".html"
            )

            output_path = os.path.join(
                ARTICLES_DIR,
                output_filename
            )

            with open(
                output_path,
                "w",
                encoding="utf-8"
            ) as f:

                f.write(article_html)

            print(
                f"Generated HTML: {output_filename}"
            )

            # ---------------------------------------------
            # JSON data
            # ---------------------------------------------

            articles_data.append({

                "title": title,

                "url": f"articles/{output_filename}",

                "date": date,

                "category": category,

                "level": level,

                "summary": description,
                "description": description,

                "readingTime": read_time

            })

        except Exception as e:

            print(
                f"ERROR processing {filename}:"
            )

            print(
                f"  {type(e).__name__}: {e}"
            )

            print(
                "  Skipping this file..."
            )

    # -----------------------------------------------------
    # Sort by date
    # -----------------------------------------------------

    articles_data.sort(
        key=lambda x: x["date"],
        reverse=True
    )

    # -----------------------------------------------------
    # Save articles.json
    # -----------------------------------------------------

    with open(
        JSON_OUTPUT,
        "w",
        encoding="utf-8"
    ) as jf:

        json.dump(
            articles_data,
            jf,
            ensure_ascii=False,
            indent=4
        )

    # -----------------------------------------------------
    # Generate sitemap.xml
    # -----------------------------------------------------

    sitemap_urls = []

    # Homepage
    sitemap_urls.append(
        f"""    <url>
        <loc>{SITE_URL}/</loc>
    </url>"""
    )

    # Articles
    for article in articles_data:

        article_url = article.get("url")

        if not article_url:
            continue

        sitemap_urls.append(
            f"""    <url>
        <loc>{SITE_URL}/{article_url}</loc>
    </url>"""
        )

    sitemap_content = """<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

""" + "\n\n".join(sitemap_urls) + """

</urlset>
"""

    with open(
        SITEMAP_OUTPUT,
        "w",
        encoding="utf-8"
    ) as sf:

        sf.write(sitemap_content)

    print(
        f"Successfully updated {SITEMAP_OUTPUT}"
    )

    print(
        f"Sitemap URLs: {len(sitemap_urls)}"
    )
  
    # -----------------------------------------------------
    # Done
    # -----------------------------------------------------

    print()
    print(
        "========================================"
    )

    print(
        f"Successfully updated {JSON_OUTPUT}"
    )

    print(
        f"Articles generated: {len(articles_data)}"
    )

    print(
        "========================================"
    )


# =========================================================
# Run
# =========================================================

if __name__ == "__main__":

    build_articles_pipeline()