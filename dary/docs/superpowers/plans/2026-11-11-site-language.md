# Site Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the Dary storefront into Arabic, French, and English while preserving the existing visual design and behavior.

**Architecture:** Keep locale dictionaries and lookup helpers in a small `i18n.js` module. Static HTML uses translation keys, while `app.js` uses the same translator for generated and interactive content; language selection updates the document locale/direction and persists locally.

**Tech Stack:** Existing vanilla JavaScript ES modules, HTML, CSS, and Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-11-site-language-design.md`

## Global Constraints

- Preserve the existing visual design, product prices, images, and interactions.
- Support only Arabic, French, and English; default to Arabic.
- Keep Arabic category IDs as the internal catalog filter values.
- Add no translation service, backend, or network dependency.

## Review Focus

- Invalid or missing saved locale falls back to Arabic; test locale normalization.
- English/French use LTR and Arabic uses RTL; test locale metadata.
- Switching locale does not break category filtering; test catalog behavior remains keyed on Arabic category values.
- Dynamic modal and product copy follows the selected locale; test translator fallback and product translation lookup.
- Locale selection survives a reload; test persistence through the browser interaction workflow.

---

### Task 1: Locale dictionary and translator

**Files:**
- Create: `i18n.js`
- Create: `tests/i18n.test.js`

**Interfaces:**
- Produces: `SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE`, `normalizeLanguage(value)`, `getDirection(language)`, `t(language, key, values = {})`, and `productText(language, product)`.

- [ ] **Step 1: Write failing behavior tests** for supported language normalization, Arabic fallback, RTL/LTR direction, translated UI key lookup, product translation, and fallback to the Arabic source product copy.
- [ ] **Step 2: Run `node --test tests/i18n.test.js`** and confirm it fails because `i18n.js` is missing.
- [ ] **Step 3: Implement `i18n.js`** with Arabic/French/English UI dictionaries and translations for all 21 catalog products, categories, makers, units, badges, and descriptions.
- [ ] **Step 4: Run `node --test tests/i18n.test.js`** and confirm all locale contract tests pass.

### Task 2: Translate the storefront and interactive states

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `scripts/build.mjs`
- Test: `tests/i18n.test.js`

**Interfaces:**
- Consumes: `t(language, key, values)`, `productText(language, product)`, `normalizeLanguage(value)`, and `getDirection(language)` from Task 1.
- Produces: a language selector that updates all visible copy and persists the selected locale.

- [ ] **Step 1: Add integration assertions** for presence of locale controls, required translated areas, preserved Arabic category identifiers, and build copying the i18n module.
- [ ] **Step 2: Run the focused test** and confirm it fails on missing selector/static integration.
- [ ] **Step 3: Translate all static and dynamic UI** using locale keys; wire selector changes to rerender translated content, update `lang`/`dir`, and persist through reload. Leave styles/layout untouched except selector sizing/alignment and RTL/LTR direction rules.
- [ ] **Step 4: Run `node --test`** and ensure the complete suite passes.
- [ ] **Step 5: Run `node scripts/build.mjs`** and confirm `dist/` contains `i18n.js` and the translated site entry points.

### Task 3: Local browser verification

**Files:**
- No additional source changes unless a defect is found.

- [ ] **Step 1:** Open the local site and switch Arabic → French → English → Arabic.
- [ ] **Step 2:** Confirm translated catalog, category filtering, account modal, and cart/checkout labels; confirm language survives reload and direction changes appropriately.
- [ ] **Step 3:** Check browser console and fix any translation-related errors; rerun tests and build after fixes.
