# Customer Complaints Hub v2.9.0

## Outlet-only import policy
Only the approved Outlet name is used for import eligibility. Small spelling errors are matched conservatively. Unknown or ambiguous outlets remain excluded. Matara and Matara 2, or Welipenna A and B, are never silently interchanged.

Area Coach is no longer an import-validation rule. The original source value is preserved as sourceAreaCoach. Reporting clusters are calculated from outlet and reporting month: Morris before June 2026 for all approved outlets; from June onward, Tharanga manages six and Morris the other eight.

Missing complaint description, status, customer contact or other optional data does not block a row. Blank closure fields are treated as Pending.

Older saved snapshots are normalized to outlet-only rules on display. Restore also checks outlets, not source coaches. Previously excluded source records require re-import after you back up the existing local data.

Customer information is stored on the device, never in the public GitHub repository. The offline service worker precaches local application assets.
