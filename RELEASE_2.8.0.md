# v2.8.0 — Flexible Excel import
- Pick the best matching complaint register tab rather than accepting only the first Master Sheet.
- Allow modified/nonstandard heading names and minimal core fields.
- Accept .xlsx, .xlsm and .csv (the filename does not need to match the selected reporting month).
- Allow up to 512 MB file selection, with a 5-minute no-progress timeout. The importer still bounds decompression and memory use.
- Preserve audit safety: exclude unapproved outlets or unrelated Area Coaches, and require confirmation for absent coach data.
- Existing history and PDF reporting are retained.
- Verification: all six PHSL source workbooks, native and fallback decompression, synthetic workbook variants, desktop/mobile-width browser flows, automated tests.
- Source branch: fix/flexible-import-v2-8.
