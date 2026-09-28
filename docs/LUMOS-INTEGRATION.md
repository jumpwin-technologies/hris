# Lumos in HRIS

This repository vendors [Lumos for Astro](https://lumosframework.com/docs/)
**0.0.4**, from release commit
`42d489788b7bf59fadd5f0505cdf783f690da75e`.
The original MIT notice is in [licenses/Lumos-MIT.txt](../licenses/Lumos-MIT.txt).
Astro remains at 7.3.5; Node 22.12 or newer is required.

## Included source

- All 35 upstream components: wrappers, typography, buttons, cards, forms,
  interactive controls, media, global navigation, and metadata utilities.
- The four CSS files in `src/styles`: tokens, cascade layers, patterns, utilities.
- The six component SVG icons and the slots, slug, unique-ID, and SEO utilities.
- Shared metadata types and an adapted `BaseLayout`.

The components, CSS, utilities, and icons already present were compared with the
release and were identical. Missing files were added from the release archive.
The starter CLI failed while copying Claude skill symlinks on Windows, so the
official tagged GitHub archive was used for the source files.

## HRIS adaptations

- `BaseLayout` provides `head`, `header`, default, and `after-main` slots.
  `AppLayout` forwards those slots and props for the existing dashboard.
  Navigation and footer can be explicitly placed in those slots when wanted.
- `utility/BaseHead` keeps HRIS titles, font preloads, and favicon, supports
  optional social images, and applies the configured noindex routes.
  `components/BaseHead` remains a compatibility wrapper.
- `Nav` and `Footer` use Jumpwin text branding and the dashboard link.
- `src/consts.ts` retains HRIS metadata and adds the site name, locale, and
  noindex routes. No public origin or marketing social image is invented.
- Existing typography is retained; the Lumos font token falls back to system
  fonts. The starter's Inter font and demo artwork are not required.
- The custom Worker, Access authentication, D1 API, and employee UI remain the
  application entry points. Starter pages, robots route, sitemap setup,
  deployment config, and agent configuration were not copied over them.

## Using components

The people workspace is composed from `PeopleHeader`, `PeopleOverview`, and
`PeopleDirectory`, with employee state and the Lumos side-panel editor in
`HrisDashboard`. Each custom component owns its styles in the `components`
cascade layer. The green/neutral palette and radii are defined once in
`base.css`; layout uses Lumos wrappers, spacing tokens, and Grid breakpoints.
The directory retains table semantics when rows stack into mobile records.
Search, department/status filters, filter reset, loading, empty, refresh errors,
and save errors are explicit UI states. Concurrent saves and refreshes are
guarded to prevent duplicate writes and stale refreshes overwriting a save.

Cloudflare delivery remains the authenticated Worker with the `HRIS_DB` D1
binding. HTML and employee responses use `private, no-store`; employee SQL uses
bound parameters. No employee data is stored in browser persistence. See
[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
and [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/).

Read [LUMOS.md](../LUMOS.md) for the component and styling conventions. Import
components directly from `@/components/`; for example:

```astro
---
import Fieldset from "@/components/form/Fieldset.astro";
import Input from "@/components/form/Input.astro";
---

<Fieldset legend="Employee details">
  <Input variant="email" label="Work email" name="email" required />
</Fieldset>
```

The dashboard uses official `Card`, `Input`, `Select`, `Fieldset`, `Form`,
`Button`, `Modal`, and `Accordion` components alongside Lumos layout and
typography components. The employee table and searchable manager list retain
application-specific markup and use Lumos design tokens.

`Form` has one local extension: `enhance={false}` disables its built-in
submission handler. The employee form uses this option to retain its JSON D1
submission and manager-validation logic without duplicate submissions or
premature form resets. Other forms keep the upstream behavior by default.

The Worker embeds the dashboard HTML instead of serving the whole `dist`
directory. CSS and Lumos's standalone client scripts are inlined through the
Astro/Vite configuration. `npm test` builds an isolated component fixture and
checks that no external scripts or stylesheets are required. The fixture is
outside `src/pages` and is never part of the production build.

New pages, optimized images, videos, or scripts with shared/dynamic imports may
emit additional files. Add delivery support in the custom Worker before using
those files in production; merely placing them in `public` or `dist` does not
make the current Worker serve them.

## Validation and upgrades

- `npm test`: production build, HRIS regressions, and isolated Lumos build test.
- `npm run check`: build, Astro component diagnostics, TypeScript, and Worker
  deployment dry run.
- `npm run preview`: local Worker with Access and D1 bindings.

Lumos is copied source, not an automatically updated npm dependency. For future
upgrades, compare the recorded release with the target release, then merge
changes into these local files, preserving the adaptations above. Update the
Lumos version and commit in `package.json` only after reviewing and validating
the merge. Keep the MIT notice with the imported code.
