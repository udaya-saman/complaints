# Approval register — version 2.1.0

**Approved and incorporated**

1. Excel import review, with coach/outlet exclusions, missing-data flags and explicit confirmations.
2. Cross-month and same-file duplicate detection, without losing month-end status snapshots.
3. Weekly backup reminder and JSON backup/restore with explicit replacement confirmation.
4. Pending aging categories based on Order Date (clearly labeled as an approximation).
5. Complaint category normalization for consistently grouped reports.
6. A4 portrait management PDF with charts and statistics, plus A4 landscape detailed complaint PDF.

**Deferred; not implemented**

- Shared manager accounts and centralized cross-device sync: GitHub Pages alone has no secure backend.
- Automated follow-up actions, WhatsApp notifications or contacting customers: user did not authorize sending messages.
- Five-percent transaction-based complaint rates: accurate transaction counts are not available from the complaint register.
- Automated access PIN/security login: cannot offer strong protection without a supported identity/backend solution.

**Documented assumptions**

- Reporting month is chosen at import; it need not equal every complaint's Order Date month.
- Pending aging uses Order Date because the supplied report does not provide a reliably identified complaint lodgement timestamp.
- An absent Area Coach column triggers an explicitly confirmed outlet-assignment fallback, not an inferred coach identity.
