# Conventions

Read [`rainey-stack/CONVENTIONS.md`](https://github.com/datacendia/rainey-stack/blob/main/CONVENTIONS.md) first. This file only adds what's specific to this repo.

- **Sibling of DrMarshllow.** The admin sign-in, form guard, file store and health check are ported from `drmarshllowTest` and keep its patterns: data in JSON files on a Railway volume (no database), zod-validated env in `src/lib/env.ts`, `node --test` unit tests importing `src/lib/*.ts` directly (so lib files import each other with relative paths and `.ts` extensions).
- **No Tailwind.** Deliberate deviation from §4.1: the site's design is hand-written CSS with tokens in `src/app/globals.css`. Don't add Tailwind alongside it.
- **Numbers live in `src/data/`.** Prices in `packages.ts`, calculator benchmarks in `benchmarks.ts`. Each benchmark is cited on the page; change the citation in `Calculator.tsx` in the same commit as the number. `tests/unit/funnel.test.ts` pins the figures the page shows.
- **Placeholders say so.** The studio name (`src/data/site.ts`) and the 20% close rate are placeholders. Copy never presents a placeholder or an example as research or as a result.
- **The reply promise is measured.** "We reply within one business day" is checked by `src/lib/reply-time.ts` and shown in the admin. Change the copy and the rule together.
