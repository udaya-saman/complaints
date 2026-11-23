# Customer Complaints Hub v2.9.3
A mobile-friendly, offline-first reporting application for GitHub Pages.

**June import repair:** A second extraction path now recognizes the PHSL complaint register using independently checked cell positions. It is used when the generic importer misses records. It is not dependent on the Area Coach name. Only one of the 14 approved outlets determines complaint eligibility; a near match is only accepted when unambiguous.

To recover records missed in prior uploads, back up your browser data and reimport the source Excel workbook. An empty report never overwrites a saved month.

All six source workbooks were tested using both the native and fallback ZIP readers. The complete counts (April through September) were 30, 20, 28, 33, 30 and 15. The original June file returned 28 records. A synthetic altered June report with most headers renamed also returned 28; the old reader returned 13.

Use only the GitHub repository for releases. All source, versioned offline scripts and tests must be updated together. The top bar shows v2.9.3.
