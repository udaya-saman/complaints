# Customer Complaints Hub v2.8.0

## Updated import behavior
Upload an Excel .xlsx, .xlsm, or CSV file. The importer looks for the complaint register among workbook tabs, including renamed and duplicate Master Sheets. Modified optional column labels will not cause automatic rejection. It requires enough usable values to recognize an outlet and complaint description or type. Completely missing complaint data cannot be invented.

Import selection and reporting month are independent; the selected month takes precedence over the filename. Existing monthly snapshots are preserved until you explicitly confirm a replacement.

Historical Area Coach rules still apply: Morris owns all 14 approved outlets before June 2026, followed by Morris's eight and Tharanga's six beginning June. Missing coach values are provisionally accepted only after user confirmation. Other coaches and unapproved outlets remain excluded.

### Privacy
Customer records remain on your device. Do not upload customer spreadsheets to this public GitHub repository.

### Verification
The six source workbooks from April-September 2026 are covered by native and fallback decompression regression tests. Synthetic variants include renamed headers, nonstandard worksheets, multiple Master Sheets and missing coach columns. Import, search, charts and PDF behavior are also tested.

### Running
Upload the repository root to GitHub Pages, or use a local HTTP server for desktop testing. See test scripts in `tests/`.
