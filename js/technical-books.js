/* Fiber Optic Hub — Technical Library */
(() => {
  "use strict";

  const BOT_USERNAME = "Yadukhit_bot";
  const grid = document.getElementById("fohBooksGrid");
  const status = document.getElementById("fohBooksStatus");
  const search = document.getElementById("fohBooksSearch");
  const isAllBooksPage = document.body.dataset.booksPage === "all";

  if (!grid || !status) return;

  let allBooks = [];

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderBooks(query = "") {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredBooks = allBooks.filter(book => {
      const searchable = [
        book.title,
        book.author
      ].filter(Boolean).join(" ").toLowerCase();

      return searchable.includes(normalizedQuery);
    });

    const visibleBooks = isAllBooksPage
      ? filteredBooks
      : filteredBooks.slice(0, 3);

    grid.replaceChildren();

    for (const book of visibleBooks) {
      const card = make("article", "foh-book-card");
      const cover = make("div", "foh-book-cover");

      if (typeof book.coverImage === "string" && book.coverImage.trim()) {
        const image = make("img");
        image.src = book.coverImage;
        image.alt = book.title + " book cover";
        image.loading = "lazy";
        image.onerror = () => {
          cover.replaceChildren();
          cover.append(make("strong", "", "PDF"));
          cover.append(make("span", "", "FIBER OPTIC HUB"));
        };
        cover.append(image);
      } else {
        cover.append(make("strong", "", "PDF"));
        cover.append(make("span", "", "FIBER OPTIC HUB"));
      }

      card.append(cover);
      card.append(make("h3", "", book.title));

      if (book.author) {
        card.append(make("p", "foh-book-author", "Author: " + book.author));
      }


      const actions = make("div", "foh-book-actions");
      const link = make("a", "foh-book-button", "Get PDF");
      link.href = "https://t.me/" + BOT_USERNAME + "?start=book_" + book.id;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      actions.append(link);
      card.append(actions);
      grid.append(card);
    }

    if (!filteredBooks.length) {
      status.textContent = normalizedQuery
        ? "ကိုက်ညီသောစာအုပ် မတွေ့ပါ။"
        : "စာအုပ်များကို ပြင်ဆင်နေဆဲဖြစ်သည်။";
      return;
    }

    status.textContent = normalizedQuery
      ? "ကိုက်ညီသောစာအုပ် " + filteredBooks.length + " အုပ် တွေ့ပါသည်။"
      : (isAllBooksPage
          ? "စာအုပ် စုစုပေါင်း " + filteredBooks.length + " အုပ်"
          : "နောက်ဆုံးစာအုပ် " + visibleBooks.length + " အုပ်");
  }

  async function loadBooks() {
    try {
      const response = await fetch("https://foh-telegram-pdf-bot.htaylinnaung-ep.workers.dev/api/books", { cache: "no-cache" });
      if (!response.ok) throw new Error("HTTP " + response.status);

      const payload = await response.json();
      const books = payload.books;
      if (!Array.isArray(books)) throw new Error("Invalid book list");

      allBooks = books
        .filter(book =>
          book &&
          typeof book.title === "string" &&
          Number.isInteger(book.id) &&
          book.id > 0 &&
          book.pdfLinked === true
        )
        .sort((a, b) => {
          const dateA = Date.parse(a.dateAdded || a.createdAt || "");
          const dateB = Date.parse(b.dateAdded || b.createdAt || "");

          if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
            return dateB - dateA;
          }

          return b.id - a.id;
        });

      renderBooks(search ? search.value : "");
    } catch (error) {
      status.textContent = "စာအုပ်စာရင်းကို ဖွင့်မရပါ။ Cloudflare Books API ကို စစ်ဆေးပါ။";
      console.error("FOH Technical Library:", error);
    }
  }

  if (search) {
    search.addEventListener("input", () => renderBooks(search.value));
  }

  loadBooks();
})();
