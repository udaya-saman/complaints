# Customer Complaints Hub v2.9.2

Modern offline-first customer complaints dashboard for GitHub Pages and local Windows use.

## Important: identify the release
The **top-right version label must display v2.9.2**. If you still see the old "No matching complaints were found for these two clusters" warning or an enabled "Save 0 complaints" button, you are running an older release. GitHub source updates do not update a previously downloaded Windows executable.

For **local Windows use**, close the old Complaints Hub window and start the new v2.9.2 portable Windows launcher. It serves the new application at the same `http://localhost:8765` origin. Keep using the same browser so previously saved complaint history remains available. Do not clear browser site data.

For **GitHub Pages**, deploy the versioned files together, then select Data Library > Update & repair. The build does not upload any customer spreadsheets.

## Excel import
The importer searches relevant worksheets for plausible complaint tables and recognizes the real headings rather than an introductory "Outlet" caption. Only one of the 14 approved Outlet names determines whether a complaint is eligible. Minor unambiguous outlet typos are recognized. Missing or contradictory Area Coach values are never rejection criteria. Reporting clusters follow the approved June 2026 handover.

The August 2026 (3) report returned 30 eligible records (25 resolved, five pending) in an isolated browser test. An empty import cannot overwrite saved data.

## Privacy and testing
Customer complaint records are stored in the browser's local IndexedDB and are not published to GitHub. Back up months before replacing reports. All 63 Node tests passed, and desktop/mobile-width browser tests passed using simulated database storage. The Windows binary and physical phones need device-specific acceptance tests.
