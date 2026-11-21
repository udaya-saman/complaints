# Customer Complaints Hub v2.9.1
Offline-first complaint dashboard for GitHub Pages. Customer data stays in the local device's browser.

## Corrected Excel extraction
The importer scans workbook sheets and plausible header rows rather than selecting the first "Outlet" caption. It scores the complaint-related columns and retained eligible rows, preferring the actual complaint register over summary tabs and introductory headings. A workbook with renamed columns or multiple Master Sheet variants can still be read when it contains recognizable complaint data.

**Only approved Outlet names determine eligibility.** Area Coach is retained solely as source metadata; it never excludes a complaint. Small, unambiguous outlet-name typos can be corrected. Historical cluster membership is assigned from the outlet and reporting month (Morris covers all fourteen outlets before June 2026, then the six-outlet transfer to Tharanga takes effect).

An empty preview cannot overwrite a saved month. Existing imported data and backups are not erased by updating the application.

## Verified sources and limitations
All six supplied April–September 2026 workbooks were reprocessed with the revised extractor: 30, 20, 28, 33, 30, and 15 eligible complaint records. The 68 MB example imported 22 records. A deliberately altered June workbook with added misleading preheader rows returned 28 valid records; the previous extractor had returned only 13 from a secondary sheet. New automated tests cover misleading headers and typo-tolerant outlet recognition.

The local automated suite passed 63/63 tests. The application also completed a Chromium UI workflow with the original workbook at desktop and mobile viewport sizes using simulated local storage. Physical-device testing and live GitHub Pages behavior have not been verified.

## Updating
Commit the entire release including `index.html`, `sw.js`, `hub-2.9.1.js`, and `workbook-2.9.1.js`; mixing versioned files can cause an old importer to load. Use Data Library > Update & repair to refresh cached application files. Do not clear site data; this can delete saved complaint records.

For months affected by old import behavior, export a JSON backup, then re-import the original workbook.
