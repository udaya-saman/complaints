# v2.9.2 — Verifiable August import and portable Windows launcher
- The exact user-supplied August 2026 (3).xlsx workbook returned **30 approved-outlet complaints**, **25 resolved and 5 pending**, both through the standalone worker and in Chromium browser workflows at desktop (1250 px) and mobile (390 px) viewports.
- The screenshot showed the old "No matching complaints were found for these two clusters" string and an enabled "Save 0 complaints" button; neither exists in the corrected release.
- Show v2.9.2 visibly in the top bar and import screen to distinguish old local launchers or cached versions.
- Keep candidate-based Excel extraction, outlet-only validation, historical clusters, search, PDFs and locally stored monthly snapshots unchanged.
- A zero-record preview cannot save or replace any previously stored month.
- Cache preloads versioned assets and retires previous app-shell caches on activation; never clears IndexedDB.
- A separate Windows portable release is available with a new embedded executable for localhost:8765; close all old launchers before opening it. Keep the same browser to preserve same-origin data.
- 63 automated Node tests passed locally. All six supplied monthly workbooks were imported (30,20,28,33,30,15 in calendar order), and the exact August browser import/save/detail PDF flow passed at desktop and phone widths using a browser storage stand-in.
- Windows EXE itself was cross-compiled and the embedded local HTTP server was tested natively on Linux; the executable has not been tested on physical Windows.
