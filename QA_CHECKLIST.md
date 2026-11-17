# Quality assurance and release status — v2.4.0

## Automated checks (PASS — 37 tests)

- [x] 14 approved outlets, exact cluster membership (6 Tharanga + 8 Morris)
- [x] Coach aliases allow `Mr. Tharanga` / `Mr. Morris` without partial-name false matches
- [x] Other coaches are excluded even if their outlet is approved
- [x] Conflicting coach/outlet combinations are excluded and counted
- [x] Unknown outlets are excluded and counted
- [x] Coachless files produce provisional data and require UI acknowledgment before saving
- [x] Closure directive + Yes overrides conflicting Pending source status
- [x] Nonqualifying closure directives do not override explicit Pending
- [x] Date parsing and order-date aging
- [x] Search by customer name, local/`+94` phone number, order number and order date
- [x] Service Channel + Complaint Channel filtering can be combined
- [x] Category normalization and identity-based duplicate checks
- [x] CSV import with other coaches, mismatches, duplicates and no matching rows
- [x] PDF reports create valid PDF-1.4 files with portrait/landscape A4 page sizes
- [x] Generated PDF pages are readable in `pdfinfo` and `pdftotext`
- [x] PDF contact numbers hidden by default and included only on explicit request
- [x] Actual 68 MB supplied workbook re-imported in Node's native streaming environment (v2.2.0): 22 verified eligible rows / 4 excluded / 21 resolved / 1 pending / 0 duplicates
- [x] Top bar is a real native Import Excel trigger, not just a navigation link
- [x] Root-level picker survives page re-renders; same-file reselection works
- [x] Selecting a file updates the Data Library and clears previous import approval
- [x] Switching reporting period immediately removes stale import reviews
- [x] Invalid, zero-length and oversized files produce user-friendly errors
- [x] Drag/drop cannot replace a file in the middle of parsing
- [x] Persisted/backup records are rechecked against coach/outlet eligibility
- [x] App JS passes Node syntax validation; no CDN/runtime external library calls
- [x] GitHub Pages subpath-relative paths, manifest and service worker cache list

## PHSL v2.4 regression checks (PASS)

- [x] All six real workbooks: expected source sheet, accepted and excluded counts, coach/outlet checks and closure results, on both native and fallback decompression paths.
- [x] Independent workbook XML comparison: all 132 accepted source rows, 16 mapped fields each (with newline normalization), and closure classification.
- [x] Actual original 68 MB workbook: 22 accepted, 21 resolved, 1 pending, 4 excluded.
- [x] Six-month Chromium browser flow: actual native file selection and worker parsing, review, simulated persistence, desktop and mobile-width navigation, historical month selection, status and channel filters, four search fields, outlet alias, both PDF formats and six-month backup.
- [x] Header restoration requires all known PHSL anchors; generic lookup-sheet headers rejected; April historical mismatch excluded and flagged.
- [x] Pako fallback works without native DecompressionStream on all six supplied monthly workbooks.

## Needs real-device and manual acceptance before sensitive live use

- [ ] Desktop Chrome: upload full workbook in actual browser, verify coach-aware preview, save, reopen and search
- [ ] Desktop Firefox: review UX, printer margins, exports and storage
- [ ] Desktop Edge: test IndexedDB backup / restore and navigation
- [ ] iPhone Safari: upload `.xlsx`, native pako fallback, offline launch, PDF download and Home Screen installation
- [ ] Android Chrome and Samsung Internet: upload/export/restore, installed PWA, back navigation
- [ ] 320px / 390px mobile viewport visual review and 200% text scaling
- [ ] Keyboard-only navigation, focus management and VoiceOver/TalkBack testing
- [ ] Offline after first successful load: airplane mode, kill and relaunch, all key routes
- [ ] Update ready service worker prompt tested on live GitHub Pages URL
- [ ] Browser-storage quota, data eviction and backup recovery tests on actual devices
- [x] Full-workbook import with a genuine Area Coach column containing OTHER coaches (isolated Chromium with simulated storage)
- [ ] Inspect actual PDF rendering and non-Latin text; current PDF writer uses standard English/Latin fonts and substitutes unsupported characters. Original Unicode is preserved in the app and backups.
- [ ] Real production privacy approval and protected device/browser profile policy

**Earlier v2.3.0 browser checks:** Real release JavaScript and real dedicated Worker (blob transport, actual workbook). The five tabs, filters, search, summary PDF and saved month were checked at desktop and phone widths. Expanded synthetic CSV test covers both PDFs, two-month history, backup generation and storage failure/retry. Browser storage is an IndexedDB API stand-in; website navigation is blocked by administrative policy. Actual GitHub Pages integration, OS downloads, real IndexedDB/service worker and physical phones remain unverified. No repository deployment performed.

## Definition of Done for launch

1. Verify that the original workbook requires no missing-coach confirmation; test a separate workbook with the coach column absent.
2. Complete desktop and mobile smoke tests on representative devices.
3. Confirm customer information may be stored on the intended work devices.
4. Take a secure backup after the first real report is saved.
5. Test a complete offline restart and print both PDF formats.

## v2.5.0 regression
41/41 Node tests; six workbooks (both decompressors); all navigation, search, filters, PDF and backup; no horizontal document overflow at 1250, 390, 320 px and integrated update route navigation. PDF rendered and long continuation retained. Windows executable and actual browser persistence/service-worker remain to be tested.
