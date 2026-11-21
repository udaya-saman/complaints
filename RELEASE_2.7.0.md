# Customer Complaints Hub v2.7.0
## Historical Area Coach assignments
- Reporting periods before June 2026: Morris managed all fourteen approved outlets.
- From June 2026: Tharanga manages Akuressa, Embilipitiya, Matara, Matara 2, Monaragala, and Tangalle. Morris manages the other eight outlets.
- The reporting month drives eligibility; order dates outside that month do not change who managed the cluster.
- Old April/May reports should be **re-imported** from source so previously excluded complaints can be recovered. Back up local records first.
- May 2026 contains six records assigned to Tharanga that conflict with the supplied pre-June Morris policy; these remain excluded for audit, not silently reassigned.
## PDF from complaint popup
Every View details popup now offers Download PDF for exactly that record, including customer contact details and all source closure/action fields. Handle PDFs privately.
## UI
Retains v2.6 font 105%, charcoal/red outlet/cluster switch, date-first labels, gray order numbers and simplified import review.
## Local/offline
All scripts and style assets self-hosted. Versioned service worker; no customer data is committed to GitHub. Local data storage remains unchanged.