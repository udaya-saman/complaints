# Customer Complaints Hub — version 2.5.0

A responsive, private, offline-first customer complaint dashboard built for **Pizza Hut Sri Lanka**, deployed as a static site on GitHub Pages. Desktop/laptop usage is the primary target; smartphone use is supported with a five-item bottom navigation and stacked complaint cards.

## Key features

- Import `.xlsx` / `.csv` complaints spreadsheets, even with minor header variations.
- The `.xlsx` importer processes worksheets as streams in a Web Worker. It is designed to handle the supplied ~68 MB heavily formatted worksheet. If native raw-DEFLATE decompression is unavailable, a locally bundled MIT-licensed pako fallback is used.
- **Strict scope**: 14 outlets in exactly two approved clusters. If the workbook includes an `Area Coach` column, the row must show **Tharanga** or **Morris** AND match that coach's assigned outlet. Other coaches, unrelated outlets, and coach/outlet mismatches are excluded.
- **Missing Area Coach column**: eligible outlets appear only in a *provisional review* and require explicit checkbox approval before storage. All accepted rows are marked as outlet-assigned rather than independently verified. No other-coach data can be positively excluded when that source column is absent; the user takes responsibility for verifying the file's scope before approving.
- Closure directive by Morris/Tharanga **AND** `Close Complaint (Yes/No) = Yes` means **Resolved**, overriding conflicting Sales Centre Closure Status. Otherwise explicit Closed/Resolved is resolved, explicit Pending/Un-Cont is pending, and blank/unknown values follow the conservative rules documented in parser-core.js.
- Filter by cluster, outlet, month, service channel, complaint channel, and status. Search by order date, customer name, contact number (both `0` and `+94`), order number, or description.
- Monthly IndexedDB snapshots, outlet comparison, month-by-month charts, category normalization, and pending aging (0-6 / 7-13 / 14-29 / 30+ days measured from **Order Date**).
- Exact same-file duplicates are removed; possible duplicates with differing details are kept and flagged. Cross-month repeat complaints are **flagged** and kept in each month's snapshot to preserve status comparisons; first appearances are counted as “New unique” in trends.
- Offline **A4 portrait management PDF** (KPIs, outlet statistics, category and channel breakdown, monthly chart), and **A4 landscape detailed PDF** (individual complaints and actions), each downloadable and printable. Contact numbers are excluded from detailed PDFs unless explicitly checked.
- CSV export, complete JSON backups / restore, weekly backup reminders, and PWA offline installation.

## Important clarification about the attached source workbook

The supplied workbook contains `Area Coach` in B1. A prior cell parser could consume a populated cell after a formatted empty cell. v2.2.0 fixes this and reads the actual Area Coach, closure fields, descriptions and other values correctly. The full workbook contains 26 complaint rows: 22 accepted with independently verified coach/outlet matches, 4 excluded as outside the outlet list, 21 resolved and 1 pending. The pending row has a Yes flag but no qualifying directive and the explicit status is Pending. No missing-coach confirmation is required for this workbook. An independent XML check corroborated these counts in the populated portion of the workbook.

Back up and re-import months saved using previous releases; the original data is retained, not silently rewritten.

`5% Feedback.xlsx` was used to guide the types of summaries and categories, not imported as a complaint register. Its transaction-based percentages are not fabricated from complaint counts.

## PHSL monthly workbook compatibility (v2.4.0)

Tested all six supplied April–September 2026 reports. The importer resolves workbook relationships and reads the named `Master Sheet` or `Master Sheet (2)`, not hidden lookup sheets, summary tables, or pivot data. The established template anchors permit safe positional recovery of overwritten headers in O (Complaint Description), R (Outlet Comment), and U (Close Complaint). Unknown layouts still use ordinary header matching. Filenames containing a month and year preselect the reporting period; choosing a different period requires confirmation. Empty accepted datasets may be saved only after explicit zero-count confirmation.

April's Master Sheet lists 13 complaints at presently Tharanga-assigned outlets under Morris (Matara 8, Embilipitiya 3, Tangalle 1, Akuressa 1). They are excluded under the approved strict mapping; this is an intentional rule, not missing rows. Do not reinterpret historical assignments unless the business rule is changed. Review the exclusions before saving. The April dataset contains 11 accepted complaints under the current rule.

| Month | Accepted | Resolved | Pending |
|---|---:|---:|---:|
| April | 11 | 10 | 1 |
| May | 18 | 14 | 4 |
| June | 27 | 25 | 2 |
| July | 31 | 30 | 1 |
| August | 30 | 25 | 5 |
| September | 15 | 11 | 4 |
| Total | 132 | 115 | 17 |

These are monthly record counts, not necessarily unique complaints across months. Four eligible records have order dates outside their reporting months and remain in the selected snapshot. Earlier imports should be replaced from the source workbook after taking a backup. No source spreadsheets or personal data are distributed in this package.

## Outlet assignments

**Tharanga (6):** Akuressa, Embilipitiya, Matara, Matara 2, Monaragala, Tangalle.

**Morris (8):** Aluthgama, Ambalangoda, Galle, Karapitiya, Megalle, Unawatuna, Welipenna A, Welipenna B.

Outlets outside this list are excluded even when their coach is one of the two selected managers. `Matara 02`, `Matara 2`, and `Matara II` normalize to `Matara 2`; the source spelling `Alutgama` normalizes to `Aluthgama`.

## Running locally

The release uses prebuilt classic JavaScript bundles. No build step is needed for deployment. Use an HTTP server rather than double-clicking index.html for reliable IndexedDB and offline support:

```bash
cd complaints-dashboard
python -m http.server 8765
```

Then open `http://localhost:8765/`.

The first load requires an internet connection when hosted on GitHub Pages. After installation and successful service-worker caching, all core features work offline.

## Publish to GitHub Pages

1. Create a new repository, e.g. `Customer-Complaints-Hub`, and upload **the contents** of the extracted application folder into the repository root (not the ZIP and not the folder around it).
2. Confirm these files are at the root: `index.html`, `hub-2.5.0.js`, `workbook-2.5.0.js`, `styles-2.5.0.css`, `startup-2.5.0.js`, `repair-2.5.0.js`, `update-2.5.0.html`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, `404.html`, and `assets/`.
3. Open **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, `main`, `/ (root)`, then Save.
4. Open `https://USERNAME.github.io/Customer-Complaints-Hub/` after GitHub Pages publishes it. The app uses hash routing and relative asset paths to support the project subpath.
5. On a laptop, import a CSV or Excel file and verify the provisional import review, then save the month. Install as a PWA on Android via browser menu → Install app, or on iPhone via Safari Share → Add to Home Screen.
6. After each update, use **Refresh app** when the update banner appears. Do not delete the site's data while it contains the only copy of your reports.

**Never commit customer complaint spreadsheets, JSON backups, or PDF reports with personal data to a public GitHub repository.** Only app source code belongs in GitHub.

## Using the dashboard

**Import Excel button (fixed in v2.2.0):** Click the red **Import Excel** button at the top of **any** application screen. Your computer/phone's native file chooser opens immediately. Select an `.xlsx` or `.csv` complaint register. The Data Library then displays the filename and allows you to select the reporting month and year. Click **Analyze & review file**, check exclusions and confirm the missing Area Coach warning when applicable, then click **Save complaints**. You can also use **Browse files** or drag a file onto the upload area in Data Library. Selecting the same file again works.

1. **Data library:** choose file, year and month → Analyze & review file. Check accepted, excluded, cross-month repeat, and mismatch counts. For files missing Area Coach, read and tick the explicit warning. Save after review.
2. **Overview:** choose both clusters, a single coach cluster or a specific outlet; select month and channels. Review KPI metrics and follow-ups.
3. **Complaints:** select All, Pending, or Resolved; use the search field selector. Open an individual complaint for complete details and original closure fields. Export a filtered CSV if needed.
4. **Monthly trends:** view snapshot counts and `New unique`. Change the selected month to see outlet and complaint type distributions. Monthly counts are NOT customer feedback percentages or transaction-based complaint rates.
5. **PDF reports:** choose filters, choose status, choose report type. To reveal contact numbers, explicitly tick the detailed-PDF checkbox. Download and print from the device's PDF viewer.
6. **Backups:** download the JSON backup at least once every seven days and before replacing monthly data. Restore from a known, secure JSON backup if needed.

## Data model and rules

- Each reporting month is a snapshot keyed `YYYY-MM`; only normalized complaint records and provenance are saved — **the raw 68 MB Excel file is not copied into IndexedDB**.
- Importing an existing month requires explicit replacement confirmation. Existing data remains unchanged until the new import commits successfully.
- `Area Coach` and `Closure Directive By` are distinct columns serving distinct roles. A manager closure directive cannot be used to establish the row's ownership.
- Reporting period is chosen by the user; Order Date is retained separately. The app warns on mismatches rather than silently reassigning complaints to another month.
- Duplicate identity uses outlet, Order Date, Order Number (if any), and complaint description; fallback includes customer and complaint text when Order Number is blank. Different complaints on the same order can therefore remain distinct.
- Source status, closure directive, close flag, original complaint type, and normalized type remain visible in details.
- Contact numbers and other customer information are retained for authorized staff to use locally. No server-side sync, account access control, remote backups or encryption is provided by this GitHub Pages-only version.
- The PDF generator uses standard offline PDF fonts. Non-Latin-script glyphs may not render in PDFs; CSV export and app views retain the original Unicode text.
- Pending age starts from Order Date because the source may not provide a reliable complaint-received date. It should not be interpreted as the exact duration since the complaint was lodged.

## Privacy / resilience

GitHub Pages provides public access to the **application code**, but the customer data imported into the app is **not automatically uploaded**. Data resides in the local browser's IndexedDB. Browser data can be cleared or evicted, and anyone with access to the unlocked browser profile may see the records. Use a protected work device and keep backups in a secure location. Installing the PWA and making regular backups helps mitigate data eviction; it does not provide encryption or role-based access control.

The app intentionally does not connect to APIs, web analytics, CDNs or remote fonts. A backup is not automatically sent anywhere; the user chooses the download destination.

## Project structure

```text
index.html                Application shell and navigation
app.js                    UI, filters, actions and backup/restore
styles.css                Responsive Pizza Hut-inspired design system
parser-core.js            Coach/outlet rules, closure, duplicate IDs, categories
import-worker.js          Streaming Excel/CSV import and review counts
zip-reader.js             Local Excel ZIP reader, native + fallback decompression
pdf-reports.js            Stand-alone vector PDF creation (no network)
filters.js                Search and service/complaint channel filtering
db.js                     IndexedDB monthly snapshots
sw.js                     Versioned offline shell cache
manifest.webmanifest      PWA metadata
404.html                  GitHub Pages fallback
.nojekyll                  Disable Jekyll processing
assets/                   PNG PWA icons
vendor/                   MIT-licensed local pako fallback
sample/                   Synthetic example CSV files (no real customer data)
tests/                    Automated logic, import and PDF tests
QA_CHECKLIST.md           Verified and unverified test coverage
```

## Tests

Run `node --test tests/*.test.mjs` (requires Node.js 20+). In v2.5.0, **41 automated tests** cover the file picker activation contract, safe file selection, import preview invalidation, drag/drop import races, data filtering, offline asset presence and PDFs. The suite covers manager scopes, missing coach safeguards, closure rules, date parsing, searching, channel filtering, duplicates, CSV imports, PDF integrity and privacy by default.

For the real supplied workbook, run:

```bash
node tests/import-fixture.mjs "/path/to/Mr. Tharanga and Mr,Morris.xlsx" 2026-10
```

This reads the workbook locally without uploading it anywhere. Do not commit the source workbook or test logs containing personal data.

## License notes

The project code is supplied for your operational use. `vendor/pako_inflate.min.js` is a locally vendored fallback from pako 0.2.9, distributed under the MIT license in `vendor/PAKO_LICENSE.txt`. No runtime network services are necessary.

## Updating to v2.5.0 (important)

1. Back up earlier saved data from the old app if you can. Keep the same repository and published site URL.
2. Extract this ZIP, and upload/replace **all files** in the existing repository root, including the versioned bundles, `update-2.5.0.html`, and `sw.js`. Do not upload just index.html. Ensure GitHub Pages has finished publishing.
3. Open the app, choose Data library > Update & repair > Refresh / repair app. Use the provided Return to overview or Data library link to leave this subpage. If the app itself does not start, the standalone update-2.5.0.html recovery page is still available. For local Windows use, close the old launcher, start the new executable and use the same browser and localhost:8765 address; the refresh does not download a new EXE. Do not clear site data.
4. Click **Import Excel**. A native file input covers the visible control. Select the workbook, select the year and month, review, then save. Confirm replacement of an existing month only if intended.
5. Re-import original workbooks for months saved before v2.4 if needed. v2.4 imports do not require re-importing for this visual update.

Do not clear browser site data. That can delete your local complaint history. The database name and version are unchanged.

## Verification and limitations

41/41 Node tests passed. All six supplied monthly workbooks passed native and fallback decompression regression tests; the counts remain 132 accepted, 115 resolved and 17 pending. Browser tests ran the actual release code and real workbook worker with an IndexedDB API stand-in, passing all navigation, filters, imports, PDF outputs and backup. Header cleanup, update subpage navigation and document width passed at 1250, 390 and 320 px. The detailed PDF was rendered and inspected, including long-field continuation. Browser HTTP navigation is administratively blocked in this environment, so real IndexedDB and service worker integration, installed PWA, physical iOS/Android and the Windows executable itself remain unverified. No customer data is packaged.

To rebuild the checked-in classic bundles after editing the modular source, run `node build.mjs`. The build is dependency-free. Browser harness: `HUB_SYNTHETIC=1 python tests/browser-release-qa.py` (requires Python Playwright and Chromium).
