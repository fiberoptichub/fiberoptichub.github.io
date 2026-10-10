# Fiber Optic Hub — Project Handoff
Updated: 2026-10-10

## 1. Current Project Status

The normal Fiber Optic Hub article workflow remains ACTIVE.
Only the Publisher redesign project is PAUSED.

### Normal article workflow — ACTIVE
- Write educational fiber-optic articles with ChatGPT.
- Save articles in markdown_articles/.
- Build articles with:
  python scripts/build_articles.py
- Review generated output and test the website.
- Commit, push, or publish only after explicit approval.

Do not treat the entire Fiber Optic Hub project as paused.

## 2. Publisher Redesign — PAUSED

### Planned direction
Redesign Publisher as a manual content-publishing tool:
- Import a ChatGPT-written Markdown article.
- Import a separate Facebook post file.
- Include and map article images.
- Preview and validate content before publishing.
- Require user approval before website or Facebook publication.
- Prefer a workflow that does not require a paid ChatGPT API.
- Preserve the existing Gemini workflow until the new workflow is tested.

Do not remove the existing Gemini workflow prematurely.

## 3. Known Publisher Image-Placement Issue

The IOR article preview previously displayed all three images below
the Introduction instead of their intended sections.

Expected image relevance:
- ior.jpg — Index of Refraction basics
- snell-law.jpg — Snell's Law / Core & Cladding
- fiber-ior.png — relevant Fiber IOR / OTDR section

Previously investigated areas:
- publisher/app.js: image placement mapping and preview rendering
- worker/src/index.js: Gemini image-placement prompt and Markdown insertion

Potential cause: empty or mismatched section_heading values may cause
images to be treated as unassigned.

The exact cause has not been confirmed. Inspect the current code and
Git diff before making any changes. Do not apply another blind patch.

## 4. IOR Article — Verify Before Continuing

File to check:
- markdown_articles/index-of-refraction.md

Related images:
- images/index-of-refraction/ior.jpg
- images/index-of-refraction/snell-law.jpg
- images/index-of-refraction/fiber-ior.png

The Markdown file was previously observed as empty and the article
had not yet been built. This is historical status, not confirmation
of the current file state. Verify before acting.

## 5. Previously Existing Backups

These backups were previously reported:
- publisher/app.js.backup-section-preview-20261010-111426
- publisher/app.js.backup-preview-intro-images-20261010-104715

Check that they still exist and compare them with the current
publisher/app.js before considering deletion.

## 6. Safe Working Rules

- Work on Android using Termux and Acode.
- Inspect current files and Git status before editing.
- Preserve working files and useful backups.
- Never delete backups solely because their filenames look old.
- Do not use destructive commands such as:
  git reset --hard
  git clean -fd
  git checkout
- Do not use git add . blindly.
- Do not commit, push, deploy, or publish without explicit approval.
- Never request or expose API keys, access tokens, or other secrets.
- Make changes in small, verifiable steps.

## 7. First Steps When Resuming Publisher Redesign

1. Inspect git status and the current branch.
2. List backup files and inspect their sizes and timestamps.
3. Compare each candidate backup with the current source file.
4. Keep the best recovery point; delete only confirmed redundant backups.
5. Reproduce and diagnose the image-placement issue.
6. Continue the manual Publisher redesign without disrupting
   the normal article-writing workflow.
