# Jumpwin HRIS

An employee dashboard built with Astro 7, Lumos 0.0.4, and a custom Cloudflare
Worker with Access authentication and D1 storage.

## Getting started

Use Node.js 22.12.0 or newer, then run `npm ci`.

- `npm run dev`: preview the Astro UI at localhost:4321.
- `npm run preview`: build and preview the full Worker locally, including the
  configured development Access identity and local D1 binding.
- `npm test`: build and run the HRIS regressions and Lumos component build test.
- `npm run check`: build, check Astro components and TypeScript, and dry-run the
  Worker deployment.
- `npm run cf-typegen`: regenerate Worker types after changing bindings.
- `npm run build` then `npm run deploy`: build and deploy to Cloudflare.

The database binding is configured in `wrangler.json`. A local preview uses
local D1 data, not the production employee database.

## Lumos

Lumos components live directly in this repository. See
[Lumos integration](docs/LUMOS-INTEGRATION.md) for the imported source,
HRIS adaptations, usage examples, validation, and future updates. Read
[LUMOS.md](LUMOS.md) before building new components or styles.

The framework includes layout, typography, buttons, cards, forms, media,
navigation, and interactive components. Site metadata is in `src/consts.ts`;
design tokens and shared styling are in `src/styles`.

## Application structure

- `src/pages/index.astro`: dashboard page.
- `src/components/content/HrisDashboard.astro`: employee UI and client logic.
- `src/layouts/BaseLayout.astro`: shared Lumos layout, wrapped by `AppLayout`.
- `src/worker.ts`: Access authentication, HTML delivery, and API routing.
- `src/employees.ts`: D1 employee API and validation.
- `tests/fixtures/lumos-components.astro`: isolated build fixture, not a public route.

Astro generates `dist/index.html`. The custom Worker embeds that HTML and serves
its explicit asset routes. It does not automatically serve every file in
`public` or `dist`. No Astro server adapter is required for this arrangement.

## Credits

Lumos for Astro is MIT licensed; its notice is retained in
[licenses/Lumos-MIT.txt](licenses/Lumos-MIT.txt). The project originally started
from Cloudflare's Astro blog starter, based on Bear Blog.
