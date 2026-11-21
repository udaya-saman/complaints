# v2.9.1 — Accurate complaint table extraction
- Reproduced a zero-record import when an introductory "Outlet" heading was mistaken for the actual table header.
- Added multi-header candidate recognition and quality-weighted worksheet selection.
- Only approved Outlet controls eligibility; Area Coach is not checked.
- Retains flexible minor-column variations, typo-tolerant outlet matching, and existing PDF exports.
- Prevents an empty import from replacing a saved reporting month.
- Tests: 63 automated locally passed; six PHSL months reconcile at 30, 20, 28, 33, 30, 15; original 68 MB workbook has 22; altered June workbook restores 28 vs previously 13.
- Browser flow tested with simulated IndexedDB at desktop and mobile widths; physical iOS/Android and live Pages deployment not fully verified.
