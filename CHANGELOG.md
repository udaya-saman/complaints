# Changelog

## v2.5.0 — Readability and integrated update

- Enlarged text throughout the dashboard, simplified page headings and removed the permanent import advisory while retaining warnings and confirmation.
- Added Update & repair as an in-app subpage linked from Data library and the footer, with direct return links. Retained emergency recovery page for startup failures.
- Improved detailed PDF field and record spacing, increased font size and preserved continuation text with complaint identifiers.
- No changes to approved complaint classification, filters, import eligibility, or database schema.
- 41 Node tests, six workbook regression tests in both decompression modes, and Chromium simulated-storage interaction tests passed.


## v2.4.0 — PHSL monthly workbook compatibility and reliability

- Resolve worksheet names using workbook relationships; read the named Master Sheet (including Master Sheet (2)), exclude lookup/summary/hidden sheets, reject ambiguous duplicate Master Sheets.
- Recover overwritten O/R/U headers only with verified layout anchors; normalize Alutgama; avoid blank formula-template rows and flag inconsistent duplicates without data loss.
- Preselect month/year from filename; confirm mismatch and zero-record imports; preserve approved coach allocation and show historical mismatches; warn about imports made before this release.
- Display all relevant outlets, improve PDF filter consistency and both channel breakdowns, improve pagination, serialize delete and restore operations.
- Correct the locally bundled decompression fallback and add ZIP bounds checks.
- 37 automated tests passed. All six real monthly files passed native and fallback reader regression checks. An independent XML comparison matched every accepted source row and 16 mapped source fields (normalizing line endings), plus closure classification. Desktop and mobile-width Chromium interaction checks passed using the real parser and simulated storage. Live Pages, actual IndexedDB/service worker, and physical-device testing remain open.

## v2.3.0 — Dashboard navigation and startup repair

- Prebuilt classic dashboard and workbook-reader bundles; no runtime module imports, no CDN. Physical release-specific asset filenames reduce stale-cache collisions.
- Explicit hash navigation for all five tabs, including repeated selection; avoid duplicate re-renders on hash changes. Render failures show the affected section and repair/retry actions.
- Storage-open timeout and retry, transaction-abort handling, and visible storage warnings rather than redirecting every tab to the library. Database name and version are unchanged.
- Reset stale complaint search, channel and status filters after a new import or restore. Show matching records count on mobile.
- Keep the existing native file picker and workbook rules. Warn about months saved by the older parser.
- Added a uniquely named repair page; validates release files before clearing app-only code caches.
- 33 automated tests pass. Real workbook isolated Chromium navigation test passed at desktop and mobile widths; expanded synthetic run also passed both PDFs, history and storage retry. Real deployment and physical phones are not verified.

## v2.2.0 — Native upload, cache recovery and Excel data correction

- Native file inputs cover header, welcome, empty-state and library upload targets, independent of a JS-triggered click.
- Queue file selection during module startup and display startup errors; preserve the IndexedDB schema.
- Versioned asset URLs, network-first navigation and standalone update/repair page to escape older caches without clearing customer records.
- Fixed formatted-empty-cell parsing, including the original workbook's Area Coach in B1. Actual counts: 22 verified eligible rows, 4 outside scope, 21 resolved, 1 pending.
- Missing explicit closure status without a qualifying directive now remains Pending, per approved rules.
- Warn about earlier saved imports; require re-import rather than silent mutation.
- Guard saves/restores, disallow duplicate reporting months in backups, reject malformed CSV quotes, ignore blank lines, add worker timeout and clear-file action, avoid putting raw search queries in PDF titles/filters.
- 31 automated tests passed; isolated Chromium native chooser and UI workflow tests passed. Browser deployment integration and real phones remain unverified.

## v2.1.0 — Import Excel button + reliability patch

- Fixed the top-bar Import Excel button; it now opens the native file chooser immediately from every screen.
- Added a persistent file input, same-file reselection support, and direct upload actions in the welcome and empty states.
- Fixed stale review after reporting month/year edits and reset the missing-coach approval when changing files.
- Added friendly file errors (empty, wrong type, oversized), worker startup error handling, and safer drag/drop handling.
- Prevented mid-import file switching; result metadata always identifies the originally imported file.
- Hardened verification of restored/persisted outlet and Area Coach combinations.
- Preserved the current IndexedDB database and data schema to avoid destroying existing saved months.
- Bumped service worker cache for updates; expanded the automated suite to 28 tests.


## v2.0.0 — Approved full build

- Enforced independent Area Coach and outlet eligibility, including exact coach aliases and mismatch exclusions.
- Added explicit, unchecked approval required for outlet-only records when no coach column is present.
- Added import previews with accepted, excluded, duplicate, date mismatch, missing coach, and status warnings.
- Added monthly cross-history duplication warnings while preserving month-end complaint snapshots.
- Added pending complaint age groups using Order Date as the documented reference date.
- Added normalized complaint category labels and historical new-unique counts.
- Added professional offline A4 portrait summary and A4 landscape detail PDF downloads with optional customer contacts.
- Rebuilt desktop and mobile navigation, modern cards, touch-friendly filters, mobile complaint cards, PDF reporting panel and clearer Data Library.
- Added local decompression fallback for browsers without native raw-DEFLATE support, with MIT license.
- Added weekly backup reminder and strict legacy restore migration with explicit consent.
- Updated offline precache to v2.0.0 and retained GitHub Pages subpath compatibility.
- Expanded tests to include manager scope, worker import and PDF structure.

## v1.1.0 — Previous package

- Added contact-number, order-date, order-number and customer searches.
- Added service and complaint channel filters and approved closure-directive rule.
- Added complaint type breakdown and source-value auditing.
