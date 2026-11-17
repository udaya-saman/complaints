# Design and implementation specification (v2.4.0)

## Purpose and top tasks

1. Import monthly Excel reports without requiring rigid source formatting.
2. View records for Tharanga/Morris, their exact 14 outlets and both clusters.
3. Search individual orders/customer complaints and identify Pending versus Resolved.
4. Compare reporting months and identify repeat complaints and aging pending cases.
5. Produce professional offline management and detailed PDFs and protect data with backups.

## Information architecture

`#/overview` (KPIs and actions), `#/complaints` (searchable register), `#/trends` (monthly behavior and categories), `#/reports` (PDF exports), `#/library` (import/review/backup). Desktop: fixed dark sidebar, content up to 1620px. Mobile: five-item bottom navigation with safe-area support and responsive complaint cards.

## Source eligibility and priority

1. Canonicalize Outlet, reject unapproved outlets.
2. Require a nonempty Complaint Description or Complaint Type.
3. If `Area Coach` exists: canonicalize to Tharanga/Morris, reject other coaches, blank coach values, or mismatches with cluster outlet assignment.
4. If missing: mark provisional; require explicit unchecked UI checkbox before committing the month.
5. Status: `(Closure Directive By = Morris|Tharanga) AND (Close Complaint = Yes)` => Resolved; else known closed statuses => Resolved; else explicit Pending or unknown => Pending. A missing status with a Yes close flag is Resolved as a legacy compatibility fallback.
6. Retain source values, complaint-type labels and coach provenance so users can audit results.

## Screens and primary states

- Overview: empty welcome CTA / imported KPIs / zero-results filter message / aged-pending buckets.
- Complaints: filtered register / search date picker / status pills / sortable-by-priority (pending first) / detail modal / CSV export / empty results.
- Monthly trends: months available, total and new-unique / category breakdown / outlet comparison / no-history explanation.
- Reports: selected filters / report type / privacy opt-in / preview / no-records disabled state / download PDF or error toast.
- Data library: file picker, month-year selectors, progress, import review, missing-coach checkbox, blocked zero-eligible save, saved months, delete confirmation, backup/restore, empty state.

## Design tokens

- Brand red `#C8102E`, red hover `#AA0E26`, red tint `#FFF1F3`.
- Charcoal sidebar `#24272D`, ink `#232730`, muted `#77808D`, page `#F6F7F9`, borders `#E7EAF0`.
- Green resolved `#25734D`, amber pending `#9B6417`. Status labels include text and are not color-only.
- System font stack; 16px browser default. 45px desktop controls, mobile touch targets 42px minimum; rounded cards 17px radius.
- App performance: asynchronous worker import, no remote runtime dependencies, direct DOM rendering, offline caching.

## Data schema

One IndexedDB snapshot per `YYYY-MM`: `period`, `records[]`, `fileName`, `savedAt`, `stats`, `version`.

Per record: `id`, `identity`, `period`, `outlet`, `cluster`, `areaCoach`, `coachUnverified`, `orderDate`, `orderNumber`, `customerName`, `customerContact`, `lodgedBy`, `description`, `complaintType`, `category`, `status`, `statusRaw`, `closedFlag`, `closureDirective`, `action`, `salesAction`, `customerFeedback`, `notes`, `complaintChannel`, `serviceChannel`, `product`, `sourceRow`.

Backup format: JSON containing schemaVersion 2 plus all snapshots. Backups from schemaVersion 1 can only migrate through a specific user confirmation acknowledging unverifiable Area Coach values.

## PDF structure

A4 portrait summary: title, report scope, date, four KPIs, vector monthly chart, outlet-by-outlet performance, categories, channel breakdown, pending aging summary. A4 landscape detail: full, paginated complaint cards; repeat page header/footer; customer contacts omitted unless opted in.

## Security and privacy

No remote data sharing. App source is public if deployed to public GitHub Pages; imported records remain local IndexedDB. No login, multi-device sync or cryptographic device encryption. On shared devices, managers must use protected operating-system accounts or separate browser profiles. JSON backups and contact-number PDFs contain private data.

## Known constraints

The ~68MB source workbook includes hundreds of thousands of formatted blank rows. Stream it; do not build giant HTML tables or retain the binary. The official Excel file lacks a readable Area Coach column; the importer must not infer it from unnamed numeric values or `Closure Directive By`. No transaction denominators: do not fabricate 5% complaint rates. PDF standard fonts may replace unsupported non-Latin glyphs.

## v2.2.0 reliability changes
Native file inputs cover the visible import controls; startup.js queues files chosen before the main module is ready. Versioned module URLs and a standalone update page support cache recovery. Existing local database is preserved. The XML reader distinguishes formatted empty cells from populated cells; older monthly imports are flagged for re-import.

## v2.4.0 deployment hardening
Classic prebuilt dashboard and worker release assets eliminate runtime ES module dependency requests. The same modular source and database schema remain. Navigation has explicit hash handling, render-error boundaries, and local storage retry; the native picker remains available. Use the version-specific repair page while online.

## v2.4 compatibility decisions

See README PHSL monthly workbook compatibility and QA_CHECKLIST. Master Sheet is authoritative, template anchors guard positional header recovery, and fixed approved coalition/coach mapping remains enforced for historical reports. Actual worksheet records, not source summary figures, determine dashboard totals.
