# Site Language Design

## Intent

Let visitors use the Dary storefront in Arabic, French, or English. The request is limited to translating the site; keep its visual design, product data, and existing interactions intact.

## Goals

- Provide an Arabic/French/English language selector in the existing header.
- Translate all visitor-facing static and dynamic text, including product cards/details, account and seller dialogs, cart and checkout, orders, and status messages.
- Set the document language and text direction to Arabic/RTL or French/English/LTR when the visitor changes language.
- Remember the selected language in local browser storage and use Arabic when no selection exists.
- Preserve Arabic catalog categories as internal filter identifiers so filtering continues to work in every locale.

## Non-goals and constraints

- Do not redesign the site or change its color, layout, imagery, or product/pricing content.
- Do not add languages beyond Arabic, French, and English.
- Do not add a translation service, backend, or network dependency.
- Translate the existing sample storefront copy, not real seller-entered content from an external service.

## Approaches

- Use a local dictionary and a language selector. This supports the whole static page and dynamic dialogs without a dependency. **Selected.**
- Translate only the header and main page. This leaves account, order, and product interactions in Arabic, which does not meet the request to translate the website.
- Use a remote translation service. This adds a network dependency and cannot reliably localize the current dynamic UI without exposing user-entered text.

## Design

Add a small local i18n module containing the three locale dictionaries and locale metadata. Mark static HTML strings with translation keys; use the same dictionary from JavaScript for generated cards, dialogs, buttons, and toasts. Catalog identifiers and Arabic filter values remain unchanged, while their displayed labels come from the selected locale. Switching locale updates translated text, `document.documentElement.lang`, direction, and local storage without changing the page's visual structure.

## Calls left to the implementer

- Choose concise natural French and English equivalents for the existing Arabic sample copy.
- Keep the language selector compact and styled like the existing header controls.
- Fall back to the Arabic source value when a newly added product lacks a translation.
