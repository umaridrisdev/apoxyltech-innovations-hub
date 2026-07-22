# Data Dictionary — placeholder

The full `ApoxylTech_Phase1_Data_Dictionary.md` (column-level types,
nullability, validation rules, security classifications, business rules,
retention notes for all 14 Phase 1 tables) was produced in an earlier
session but wasn't available as a file in this one — only referenced in
the handoff notes.

Drop the actual file in this folder to replace this placeholder. Until
then, the models in `backend/app/models/` carry the security-classification
comments I could infer directly (password_hash, verification/reset tokens
as restricted) — if the real data dictionary marks other fields as
sensitive/restricted (e.g. a billing address on `clients`), those need the
same treatment: excluded from list-view response schemas, present only
where strictly necessary.
