/* =====================================================
   FIBER OPTIC HUB
   AI ARTICLE GENERATOR + GITHUB PUBLISHER
   COMPLETE FINAL VERSION
   worker/src/index.js
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

const GITHUB_OWNER =
  "fiberoptichub";

const GITHUB_REPO =
  "fiberoptichub.github.io";

const GITHUB_BRANCH =
  "main";

const WEBSITE_URL =
  "https://fiberoptichub.github.io";


/* =====================================================
   CORS
===================================================== */

const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",

  "Access-Control-Allow-Headers":
    "Content-Type"

};


/* =====================================================
   MAIN WORKER
===================================================== */

export default {

  async fetch(request, env) {

    /* =================================================
       OPTIONS
    ================================================= */

    if (
      request.method ===
      "OPTIONS"
    ) {

      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders
        }
      );

    }


    /* =================================================
       ONLY POST
    ================================================= */

    if (
      request.method !==
      "POST"
    ) {

      return jsonResponse(

        {
          success: false,
          message:
            "POST request required."
        },

        405

      );

    }


    /* =================================================
       READ JSON
    ================================================= */

    let data;

    try {

      data =
        await request.json();

    } catch {

      return jsonResponse(

        {
          success: false,
          message:
            "Invalid JSON request."
        },

        400

      );

    }


    /* =================================================
       ACTION
    ================================================= */

    const action =
      String(
        data.action ||
        "generate"
      ).trim();


    /* =================================================
       GENERATE
    ================================================= */

    if (
      action ===
      "generate"
    ) {

      return generateArticle(
        data,
        env
      );

    }


    /* =================================================
       PUBLISH
    ================================================= */

    if (
      action ===
      "publish"
    ) {

      return publishArticle(
        data,
        env
      );

    }

    if (action === "facebook") {
      return publishFacebookArticle(data, env);
    }


    /* =================================================
       UNKNOWN ACTION
    ================================================= */

    return jsonResponse(

      {
        success: false,
        message:
          "Unknown action."
      },

      400

    );

  }

};


/* =====================================================
   GENERATE ARTICLE
===================================================== */

async function generateArticle(
  data,
  env
) {

  /* =================================================
     GEMINI KEY
  ================================================= */

  if (
    !env.GEMINI_API_KEY
  ) {

    return jsonResponse(

      {
        success: false,
        message:
          "GEMINI_API_KEY is not configured."
      },

      500

    );

  }


  /* =================================================
     INPUT
  ================================================= */

  const title =
    String(
      data.title ||
      ""
    ).trim();


  const category =
    String(
      data.category ||
      "Fiber Optic Basics"
    ).trim();


  const level =
    String(
      data.level ||
      "Beginner"
    ).trim();


  const description =
    String(
      data.description ||
      ""
    ).trim();


  /* =================================================
     VALIDATION
  ================================================= */

  if (!title) {

    return jsonResponse(

      {
        success: false,
        message:
          "Article title is required."
      },

      400

    );

  }


  /* =================================================
     SLUG
  ================================================= */

  const articleSlug =
    createSlug(title);


  const articleURL =
    WEBSITE_URL +
    "/articles/" +
    articleSlug +
    ".html";


  /* =================================================
     MASTER PROMPT
  ================================================= */

  const prompt = `

You are the official AI educational
content assistant for Fiber Optic Hub.

Fiber Optic Hub is a technical knowledge-sharing
website focused on Fiber Optic Technology.

Create a technically accurate educational
Website Article and Facebook Educational Summary
about the same topic.

Topic:
${title}

Category:
${category}

Level:
${level}

User Description:
${description ||
"Create a useful educational article about this topic."
}


==================================================
WEBSITE ARTICLE
==================================================

Write primarily in clear Myanmar language.

Keep important technical terms in English.

Explain technical concepts clearly.

Use:

- Introduction
- Main topic explanation
- Important concepts/components
- How it works
- Practical Fiber Optic example
- Technical details when relevant
- Key Points
- Conclusion

Use short mobile-friendly paragraphs.

Use bullet points when useful.

Do not invent technical information.

Technical numbers must have correct context.

Do not present technology-specific specifications
as universal Fiber Optic specifications.


==================================================
WEBSITE ARTICLE MUST NOT CONTAIN
==================================================

Facebook content
Facebook hashtags
Facebook promotional language
Website URL
Read Full Article
Previous Article
Next Article
Related Articles
HTML
Markdown
Code
AI notices


==================================================
FACEBOOK SUMMARY
==================================================

Create a useful educational Facebook summary.

It must teach something useful.

It must be substantially shorter than
the Website Article.

Include useful technical facts.

Use:

💡 မှတ်သားစရာ

when appropriate.

At the end the system will add:

📚 Read Full Article:
${articleURL}

Learn • Practice • Share

Relevant hashtags.


==================================================
JSON OUTPUT
==================================================

Return ONLY valid JSON.

Use EXACTLY:

{
  "title": "",
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
  "facebook_summary": [],
  "facebook_note": [],
  "facebook_hashtags": []
}

Do not return Markdown.

Do not return code fences.

Do not write explanations outside JSON.

Verify technical accuracy before returning.
`;


  /* =================================================
     GEMINI MODEL
  ================================================= */

  const model =
    "gemini-3.6-flash";


  const apiURL =
    "https://generativelanguage.googleapis.com/" +
    "v1beta/models/" +
    model +
    ":generateContent?key=" +
    env.GEMINI_API_KEY;


  /* =================================================
     GEMINI REQUEST
  ================================================= */

  try {

    const response =
      await fetch(

        apiURL,

        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              contents: [

                {

                  parts: [

                    {
                      text:
                        prompt
                    }

                  ]

                }

              ],

              generationConfig: {

                temperature:
                  0.20,

                responseMimeType:
                  "application/json"

              }

            })

        }

      );


    /* =================================================
       GEMINI ERROR
    ================================================= */

    if (
      !response.ok
    ) {

      const errorText =
        await response.text();

      return jsonResponse(

        {
          success: false,
          message:
            "Gemini API request failed.",
          error:
            errorText
        },

        response.status

      );

    }


    /* =================================================
       GEMINI RESULT
    ================================================= */

    const result =
      await response.json();


    const text =
      result
        ?.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text;


    if (!text) {

      return jsonResponse(

        {
          success: false,
          message:
            "Gemini returned no article."
        },

        500

      );

    }


    /* =================================================
       PARSE JSON
    ================================================= */

    let article;

    try {

      article =
        JSON.parse(text);

    } catch {

      return jsonResponse(

        {
          success: false,
          message:
            "Gemini returned invalid JSON.",
          raw:
            text
        },

        500

      );

    }


    /* =================================================
       VALIDATE
    ================================================= */

    if (

      !article ||

      typeof article !==
        "object" ||

      !article.title ||

      !article.introduction ||

      !Array.isArray(
        article.sections
      ) ||

      !article.conclusion

    ) {

      return jsonResponse(

        {
          success: false,
          message:
            "Generated article structure is invalid.",
          article:
            article
        },

        500

      );

    }


    /* =================================================
       FACEBOOK DATA
    ================================================= */

    let facebookHashtags =
      Array.isArray(
        article.facebook_hashtags
      )
        ? article.facebook_hashtags
        : [];


    if (
      !facebookHashtags.includes(
        "#FiberOpticHub"
      )
    ) {

      facebookHashtags.unshift(
        "#FiberOpticHub"
      );

    }


    if (
      !facebookHashtags.includes(
        "#FiberOptic"
      )
    ) {

      facebookHashtags.splice(
        1,
        0,
        "#FiberOptic"
      );

    }


    facebookHashtags =
      facebookHashtags
        .map(
          tag =>
            String(
              tag || ""
            ).trim()
        )
        .filter(
          tag =>
            tag.length > 0
        );


    /* =================================================
       FINAL ARTICLE
    ================================================= */

    const finalArticle = {

      title:
        String(
          article.title
        ),

      description:
        String(
          article.description ||
          description ||
          ""
        ),

      introduction:
        String(
          article.introduction
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
          article.conclusion
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
        facebookHashtags

    };


    /* =================================================
       RESPONSE
    ================================================= */

    return jsonResponse(

      {
        success: true,

        article:
          finalArticle,

        articleURL:
          articleURL,

        slug:
          articleSlug

      },

      200

    );


  } catch (error) {

    return jsonResponse(

      {
        success: false,
        message:
          "Worker error.",
        error:
          error?.message ||
          String(error)
      },

      500

    );

  }

}


/* =====================================================
   PUBLISH ARTICLE
===================================================== */

async function publishArticle(
  data,
  env
) {

  /* =================================================
     GITHUB TOKEN
  ================================================= */

  if (
    !env.GITHUB_TOKEN
  ) {

    return jsonResponse(

      {
        success: false,
        message:
          "GITHUB_TOKEN is not configured."
      },

      500

    );

  }


  /* =================================================
     ARTICLE
  ================================================= */

  const article =
    data.article;


  if (
    !article ||
    typeof article !==
      "object"
  ) {

    return jsonResponse(

      {
        success: false,
        message:
          "Article data is required."
      },

      400

    );

  }


  const title =
    String(
      article.title ||
      ""
    ).trim();


  if (!title) {

    return jsonResponse(

      {
        success: false,
        message:
          "Article title is required."
      },

      400

    );

  }


  /* =================================================
     SLUG
  ================================================= */

  const slug =
    createSlug(title);


  const articlePath =
    "articles/" +
    slug +
    ".html";

  // Safety: do not overwrite an existing Markdown article.
  const preflightMarkdownPath =
    "markdown_articles/" + slug + ".md";

  let existingMarkdownResponse;

  try {
    existingMarkdownResponse = await fetch(
      "https://api.github.com/repos/" +
        GITHUB_OWNER + "/" + GITHUB_REPO +
        "/contents/" + preflightMarkdownPath,
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + env.GITHUB_TOKEN,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );
  } catch (error) {
    return jsonResponse({
      success: false,
      message: "Could not check whether the article already exists."
    }, 502);
  }

  if (existingMarkdownResponse.ok) {
    return jsonResponse({
      success: false,
      message:
        "An article with this slug already exists. " +
        "Choose a different title or review the existing file."
    }, 409);
  }

  if (existingMarkdownResponse.status !== 404) {
    return jsonResponse({
      success: false,
      message: "GitHub could not verify the article path.",
      status: existingMarkdownResponse.status
    }, 502);
  }


  /* =================================================
     IMAGE
  ================================================= */

  const imageURLs = [];
  const imageItems = Array.isArray(article.images)
    ? article.images
    : [];

  // Support requests from the older Publisher too.
  if (!imageItems.length && article.image) {
    imageItems.push(article.image);
  }

  const usedNames = new Set();

  for (let index = 0; index < imageItems.length; index++) {
    const item = imageItems[index];
    const imageData = typeof item === "string" ? item : item?.data;

    if (typeof imageData !== "string" ||
        !imageData.startsWith("data:image/")) {
      continue;
    }

    try {
      const imageInfo = parseDataImage(imageData);
      const mimeExtension = getImageExtension(imageInfo.mime);
      const suppliedName = typeof item === "object" && item
        ? String(item.name || "")
        : "";

      // Use only the filename, never a user-supplied directory.
      const leafName = suppliedName.split(/[\\/]/).pop() || "";
      const extMatch = leafName.match(/\.([a-zA-Z0-9]{2,5})$/);
      const suppliedExtension = extMatch
        ? extMatch[1].toLowerCase()
        : "";

      let baseName = extMatch
        ? leafName.slice(0, -extMatch[0].length)
        : leafName;

      baseName = baseName
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_]+|[-_]+$/g, "")
        .slice(0, 100);

      if (!baseName) baseName = "image-" + (index + 1);

      const extensionMatchesMime =
        imageInfo.mime === "image/jpeg" ||
        imageInfo.mime === "image/jpg"
          ? ["jpg", "jpeg"].includes(suppliedExtension)
          : suppliedExtension === mimeExtension;

      const safeExtension = extensionMatchesMime
        ? suppliedExtension
        : mimeExtension;

      const folder = "images/" + slug;
      let suffix = 1;
      let candidateName;
      let candidatePath;

      // Check GitHub before each upload to avoid overwriting old images.
      while (true) {
        const suffixText = suffix === 1 ? "" : "-" + suffix;
        candidateName = baseName + suffixText + "." + safeExtension;
        candidatePath = folder + "/" + candidateName;

        if (usedNames.has(candidatePath)) {
          suffix++;
          continue;
        }

        const checkURL =
          "https://api.github.com/repos/" +
          GITHUB_OWNER + "/" + GITHUB_REPO +
          "/contents/" + candidatePath +
          "?ref=" + encodeURIComponent(GITHUB_BRANCH);

        const checkResponse = await fetch(checkURL, {
          method: "GET",
          headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": "Bearer " + env.GITHUB_TOKEN,
            "X-GitHub-Api-Version": "2022-11-28"
          }
        });

        if (checkResponse.status === 404) break;

        if (!checkResponse.ok) {
          throw new Error(
            "GitHub image check failed: " + await checkResponse.text()
          );
        }

        suffix++;
      }

      usedNames.add(candidatePath);

      await githubPutFile(
        candidatePath,
        imageInfo.base64,
        "Add article image: " + title + " - " + candidateName,
        env,
        true
      );

      imageURLs.push(WEBSITE_URL + "/" + candidatePath);
    } catch (error) {
      return jsonResponse({
        success: false,
        message: "Image upload failed.",
        error: error?.message || String(error)
      }, 500);
    }
  }

  /* =================================================
     MARKDOWN
  ================================================= */

  const markdown = buildArticleMarkdown(article, imageURLs);

  const markdownBase64 =
    toBase64UTF8(
      markdown
    );

  const markdownPath =
    "markdown_articles/" +
    slug +
    ".md";

  /* =================================================
     SAVE MARKDOWN ARTICLE
  ================================================= */

  try {

    await githubPutFile(

      markdownPath,

      markdownBase64,

      "Publish Markdown article: " +
      title,

      env,

      false
    );


    const articleURL =
      WEBSITE_URL + "/articles/" + slug + ".html";

    return jsonResponse({
      success: true,
      message: "Article saved to GitHub. Facebook was not posted.",
      facebookPublished: false,
      title: title,
      slug: slug,
      articlePath: articlePath,
      articleURL: articleURL,
      facebookPost: buildFacebookPost(article, articleURL)
    }, 200);



  } catch (error) {

    return jsonResponse(

      {

        success:
          false,

        message:
          "GitHub publish failed.",

        error:
          error?.message ||
          String(error)

      },

      500

    );

  }

}



/* =====================================================
   PUBLISH FACEBOOK ARTICLE — SEPARATE ACTION
===================================================== */

async function publishFacebookArticle(data, env) {
  if (!env.FB_PAGE_ACCESS_TOKEN) {
    return jsonResponse({
      success: false,
      message: "FB_PAGE_ACCESS_TOKEN is not configured."
    }, 500);
  }

  const article = data.article;

  if (!article || typeof article !== "object") {
    return jsonResponse({
      success: false,
      message: "Article data is required."
    }, 400);
  }

  const title = String(article.title || "").trim();

  if (!title) {
    return jsonResponse({
      success: false,
      message: "Article title is required."
    }, 400);
  }

  const slug = createSlug(title);
  const markdownPath = "markdown_articles/" + slug + ".md";
  const articleURL = WEBSITE_URL + "/articles/" + slug + ".html";

  try {
    const savedResponse = await fetch(
      "https://api.github.com/repos/" +
        GITHUB_OWNER + "/" + GITHUB_REPO +
        "/contents/" + markdownPath,
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + env.GITHUB_TOKEN,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );

    if (savedResponse.status === 404) {
      return jsonResponse({
        success: false,
        message: "Save the article to GitHub before publishing to Facebook."
      }, 409);
    }

    if (!savedResponse.ok) {
      return jsonResponse({
        success: false,
        message: "Could not verify the saved article on GitHub."
      }, 502);
    }

    const facebookPost = buildFacebookPost(article, articleURL);

    const fbResponse = await fetch(
      "https://graph.facebook.com/v26.0/1154215104451751/feed",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.FB_PAGE_ACCESS_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          message: facebookPost
        })
      }
    );

    const fbResult = await fbResponse.json().catch(() => ({}));

    if (!fbResponse.ok || !fbResult.id) {
      return jsonResponse({
        success: false,
        message:
          fbResult?.error?.message ||
          "Facebook rejected the post request.",
        facebookPublished: false
      }, 502);
    }

    return jsonResponse({
      success: true,
      message: "Facebook post published successfully.",
      facebookPublished: true,
      facebookPostId: fbResult.id,
      title: title,
      slug: slug,
      articleURL: articleURL,
      facebookPost: facebookPost
    }, 200);

  } catch (error) {
    return jsonResponse({
      success: false,
      message:
        "Facebook publishing could not be confirmed. " +
        "Check the Page before attempting another post."
    }, 502);
  }
}


/* =====================================================
   GITHUB PUT FILE
===================================================== */

async function githubPutFile(
  path,
  contentBase64,
  message,
  env,
  isBinary
) {

  const apiURL =
    "https://api.github.com/repos/" +
    GITHUB_OWNER +
    "/" +
    GITHUB_REPO +
    "/contents/" +
    path;


  /* =================================================
     CHECK EXISTING FILE
  ================================================= */

  let sha =
    null;


  const getResponse =
    await fetch(

      apiURL +
      "?ref=" +
      encodeURIComponent(
        GITHUB_BRANCH
      ),

      {

        method:
          "GET",

        headers: {

          "Accept":
            "application/vnd.github+json",

          "Authorization":
            "Bearer " +
            env.GITHUB_TOKEN,

          "X-GitHub-Api-Version":
            "2022-11-28"

        }

      }

    );


  if (
    getResponse.ok
  ) {

    const existing =
      await getResponse.json();

    sha =
      existing.sha;

  } else if (
    getResponse.status !==
    404
  ) {

    const errorText =
      await getResponse.text();

    throw new Error(
      "GitHub file check failed: " +
      errorText
    );

  }


  /* =================================================
     PUT
  ================================================= */

  const body = {

    message:
      message,

    content:
      contentBase64,

    branch:
      GITHUB_BRANCH

  };


  if (sha) {

    body.sha =
      sha;

  }


  const putResponse =
    await fetch(

      apiURL,

      {

        method:
          "PUT",

        headers: {

          "Accept":
            "application/vnd.github+json",

          "Authorization":
            "Bearer " +
            env.GITHUB_TOKEN,

          "X-GitHub-Api-Version":
            "2022-11-28",

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify(
            body
          )

      }

    );


  if (
    !putResponse.ok
  ) {

    const errorText =
      await putResponse.text();

    throw new Error(
      "GitHub PUT failed: " +
      errorText
    );

  }


  return await putResponse.json();

}


/* =====================================================
   BUILD ARTICLE MARKDOWN
===================================================== */

function buildArticleMarkdown(article, imageURLs) {

  const title =
    String(
      article.title || ""
    ).trim();

  const category =
    String(
      article.category ||
      "Fiber Optic Basics"
    ).trim();

  const level =
    String(
      article.level ||
      "Beginner"
    ).trim();

  const description =
    String(
      article.description || ""
    )
      .replace(/\r?\n/g, " ")
      .trim();

  const date =
    String(
      article.date ||
      new Date().toISOString()
    ).slice(0, 10);

  const yamlEscape = value =>
    String(
      value || ""
    )
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


  const markdownImageURLs = Array.isArray(imageURLs)
    ? imageURLs
    : (imageURLs ? [imageURLs] : []);

  markdownImageURLs.forEach((url, index) => {
    if (typeof url !== "string" ||
        !url.startsWith(WEBSITE_URL + "/")) {
      return;
    }

    const imagePath = url.replace(WEBSITE_URL + "/", "../");
    lines.push(
      `![${title} — image ${index + 1}](${imagePath})`,
      ""
    );
  });

  if (
    article.introduction

  ) {

    lines.push(
      String(
        article.introduction
      ).trim(),
      ""
    );
  }

  if (
    Array.isArray(
      article.sections
    )
  ) {

    article.sections.forEach(
      section => {

        const heading =
          String(
            section?.heading || ""
          ).trim();

        if (heading) {

          lines.push(
            `## ${heading}`,
            ""
          );
        }

        if (
          Array.isArray(
            section?.paragraphs
          )
        ) {

          section.paragraphs.forEach(
            paragraph => {

              const text =
                String(
                  paragraph || ""
                ).trim();

              if (text) {

                lines.push(
                  text,
                  ""
                );
              }
            }
          );
        }

        if (
          Array.isArray(
            section?.bullets
          )
        ) {

          section.bullets.forEach(
            bullet => {

              const text =
                String(
                  bullet || ""
                ).trim();

              if (text) {

                lines.push(
                  `- ${text}`
                );
              }
            }
          );

          if (
            section.bullets.length
          ) {

            lines.push("");
          }
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

    lines.push(
      "## Key Points",
      ""
    );

    article.key_points.forEach(
      point => {

        const text =
          String(
            point || ""
          ).trim();

        if (text) {

          lines.push(
            `- ${text}`
          );
        }
      }
    );

    lines.push("");
  }

  if (
    article.conclusion
  ) {

    lines.push(
      "## Conclusion",
      "",
      String(
        article.conclusion
      ).trim(),
      ""
    );
  }

  return lines.join("\n").trim() + "\n";
}

/* =====================================================
   BUILD ARTICLE HTML
===================================================== */


function buildArticleHTML(
  article,
  imageURL
) {

  const title =
    escapeHTML(
      article.title
    );


  const description =
    escapeHTML(
      article.description ||
      ""
    );


  const category =
    escapeHTML(
      article.category ||
      "Fiber Optic Basics"
    );


  const level =
    escapeHTML(
      article.level ||
      "Beginner"
    );


  const date =
    formatDate(
      new Date()
        .toISOString()
    );


  let content =
    "";


  /* =================================================
     INTRODUCTION
  ================================================= */

  if (
    article.introduction
  ) {

    content +=
      "<h2>Introduction</h2>" +
      "<p>" +
      escapeHTML(
        article.introduction
      ) +
      "</p>";

  }


  /* =================================================
     SECTIONS
  ================================================= */

  if (
    Array.isArray(
      article.sections
    )
  ) {

    article.sections.forEach(
      section => {

        if (
          !section
        ) {

          return;

        }


        if (
          section.heading
        ) {

          content +=
            "<h2>" +
            escapeHTML(
              section.heading
            ) +
            "</h2>";

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

                content +=
                  "<p>" +
                  escapeHTML(
                    paragraph
                  ) +
                  "</p>";

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

          content +=
            "<ul>";

          section.bullets.forEach(
            bullet => {

              if (
                bullet
              ) {

                content +=
                  "<li>" +
                  escapeHTML(
                    bullet
                  ) +
                  "</li>";

              }

            }
          );

          content +=
            "</ul>";

        }

      }
    );

  }


  /* =================================================
     KEY POINTS
  ================================================= */

  if (
    Array.isArray(
      article.key_points
    ) &&
    article.key_points.length
  ) {

    content +=
      "<h2>Key Points</h2>" +
      "<ul>";


    article.key_points.forEach(
      point => {

        if (
          point
        ) {

          content +=
            "<li>" +
            escapeHTML(
              point
            ) +
            "</li>";

        }

      }
    );


    content +=
      "</ul>";

  }


  /* =================================================
     CONCLUSION
  ================================================= */

  if (
    article.conclusion
  ) {

    content +=
      "<h2>Conclusion</h2>" +
      "<p>" +
      escapeHTML(
        article.conclusion
      ) +
      "</p>";

  }


  /* =================================================
     IMAGE
  ================================================= */

  let imageHTML =
    "";


  if (
    imageURL
  ) {

    imageHTML = `

      <figure class="article-image">

        <img
          src="${escapeHTML(imageURL)}"
          alt="${title}"
          loading="lazy"
        >

      </figure>

    `;

  }


  /* =================================================
     FINAL HTML
  ================================================= */

  return `<!DOCTYPE html>
<html lang="my">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<meta
  name="description"
  content="${description}"
>

<meta
  name="robots"
  content="index, follow"
>

<title>
${title} | Fiber Optic Hub
</title>

<link
  rel="stylesheet"
  href="../css/index.css"
>

</head>

<body>

<header>

  <div class="logo">
    Fiber <span>Optic Hub</span>
  </div>

</header>


<main>

<article class="article-page">

  <a
    href="../index.html"
    class="back-button"
  >
    ← Back to Home
  </a>


  <div class="article-meta">

    ${category}
    •
    ${level}
    •
    ${date}

  </div>


  <h1 class="article-title">
    ${title}
  </h1>


  <p class="article-description">
    ${description}
  </p>


  ${imageHTML}


  <div class="article-content">

    ${content}

  </div>


</article>

</main>


<footer>

  <div class="footer-logo">
    Fiber <span>Optic Hub</span>
  </div>

</footer>

</body>

</html>`;

}


/* =====================================================
   BUILD FACEBOOK POST
===================================================== */

function buildFacebookPost(
  article,
  articleURL
) {

  let post =
    "";


  post +=
    "🌐 " +
    String(
      article.title ||
      ""
    ) +
    "\n\n";


  if (
    article.description
  ) {

    post +=
      String(
        article.description
      ) +
      "\n\n";

  }


  if (
    Array.isArray(
      article.facebook_summary
    ) &&
    article.facebook_summary.length
  ) {

    article.facebook_summary
      .slice(0, 6)
      .forEach(
        item => {

          post +=
            "🔹 " +
            String(
              item
            ).trim() +
            "\n";

        }
      );


    post +=
      "\n";

  }


  if (
    Array.isArray(
      article.facebook_note
    ) &&
    article.facebook_note.length
  ) {

    post +=
      "💡 မှတ်သားစရာ\n\n";


    article.facebook_note
      .slice(0, 6)
      .forEach(
        item => {

          post +=
            "🔹 " +
            String(
              item
            ).trim() +
            "\n";

        }
      );


    post +=
      "\n";

  }


  post +=
    "📚 Read Full Article:\n" +
    articleURL +
    "\n\n";


  post +=
    "Learn • Practice • Share\n\n";


  const hashtags =
    Array.isArray(
      article.facebook_hashtags
    )
      ? article.facebook_hashtags
      : [];


  post +=
    hashtags
      .join(" ");


  return post;

}


/* =====================================================
   DATA IMAGE PARSER
===================================================== */

function parseDataImage(
  dataURL
) {

  const match =
    dataURL.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
    );


  if (!match) {

    throw new Error(
      "Invalid image data."
    );

  }


  const mime = match[1].toLowerCase();

  const supportedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif"
  ];

  if (!supportedMimes.includes(mime)) {
    throw new Error("Unsupported image format: " + mime);
  }

  return {
    mime,
    base64: match[2]
  };

}


/* =====================================================
   IMAGE EXTENSION
===================================================== */

function getImageExtension(
  mime
) {

  const map = {

    "image/jpeg":
      "jpg",

    "image/jpg":
      "jpg",

    "image/png":
      "png",

    "image/webp":
      "webp",

    "image/gif":
      "gif"

  };


  return (
    map[mime] ||
    "jpg"
  );

}


/* =====================================================
   UTF-8 BASE64
===================================================== */

function toBase64UTF8(
  text
) {

  const bytes =
    new TextEncoder()
      .encode(text);


  let binary =
    "";


  const chunkSize =
    0x8000;


  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {

    binary += String.fromCharCode(
      ...bytes.subarray(
        i,
        i + chunkSize
      )
    );

  }


  return btoa(
    binary
  );

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
  const input =
    String(
      text || ""
    )
      .toLowerCase()
      .trim();

  const slug =
    input
      .replace(/[^\\x00-\\x7F]/g, " ")
      .replace(/[^a-z0-9\\s-]/g, "")
      .replace(/\\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  let hash = 0;

  for (const char of input) {
    hash =
      ((hash << 5) -
        hash +
        char.codePointAt(0)) |
      0;
  }

  const hashPart =
    Math.abs(hash).toString(36);

  if (!slug) {
    return "fiber-optic-article-" + hashPart;
  }

  if (/[^\x00-]/.test(input)) {
    return slug + "-" + hashPart;
  }

  return slug;
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
   JSON RESPONSE
===================================================== */

function jsonResponse(
  data,
  status
) {

  return new Response(

    JSON.stringify(
      data
    ),

    {

      status:
        status,

      headers: {

        ...corsHeaders,

        "Content-Type":
          "application/json; charset=UTF-8"

      }

    }

  );

}
