# Learned

> Technical and creative lessons from specific project experience.

---

## SQLite Is Underestimated

**From:** PAI Data UI development

SQLite scales to millions of rows on a laptop, supports full-text search via FTS5, and requires zero configuration. For local-first applications, it is the right default — not a compromise. The mental model that SQLite is "for small projects" is wrong.

---

## Chokidar + SQLite Makes a Capable Live Index

**From:** PAI Data UI sync engine

Watching a directory of markdown files with Chokidar and syncing changes into SQLite gives you a live, searchable index of plaintext content. No server, no database process, no sync conflicts. This pattern is reusable for any local-first tool that needs search.

---

## Effect TS Pays Off on Data Layer Errors

**From:** PAI Data UI data layer

Using Effect TS for typed errors in server routes makes error handling explicit at the boundary. It adds ceremony up front but eliminates entire categories of silent failures. Worth the overhead for any data layer that will be maintained.

---

## Brand Strategy Before Logo Design

**From:** Lumina Studios engagement

Starting the Lumina engagement with a strategy workshop before any visual exploration saved significant rework. The logo emerged from the strategy; without that foundation, every direction would have been equally valid and equally debatable.

---

## API Integration Requires an Error Budget Discussion

**From:** Verdant Systems engagement

The Verdant API integration exceeded scope because we did not agree upfront on what happens when a third-party API fails. Error handling for external dependencies needs to be scoped explicitly — it can double the implementation time.

---

## TypeScript Path Aliases Need Consistent Configuration

**From:** PAI Data UI dev setup

The `@/` import alias in the dev-browser skill broke when running scripts from outside the skill directory. Path aliases are a convenience that become a tax when the project has multiple runtime contexts. Document the required working directory.
