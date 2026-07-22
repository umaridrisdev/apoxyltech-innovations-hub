# ApoxylTech Innovations Hub — Phase 1 MVP Specification
**Version 1.0 — Trimmed for Real-World Delivery**

---

## 1. Purpose of This Document

Every previous document (SRS, Blueprint, Roadmap, DDS, Enterprise Architecture) describes the **full vision** for ApoxylTech — a 14-domain, ~100-table, 250–400-endpoint platform. That vision is not wrong, but it is not a Phase 1.

This document defines what actually gets built **first**: the smallest version of ApoxylTech that is real, deployable, usable by real clients, and capable of proving the business before more is built on top of it.

**Rule for this document: if a feature isn't required to launch and get the first real client using the platform, it's Phase 2+.**

---

## 2. What Phase 1 Is (and Isn't)

**Phase 1 answers one question:** *Can ApoxylTech present itself professionally online, let a client log in, and track one project with them — securely and reliably?*

It does **not** try to answer:
- Can we teach courses? (Academy → Phase 3)
- Can we handle tickets at scale? (Support → Phase 2, simplified)
- Can we run a SaaS product line? (Products/ERP → Phase 4+)
- Can we support multiple organizations? (Multi-tenancy → Phase 2+, schema allows for it later but nothing forces it now)
- Can we do research, hackathons, AI tooling? (Later milestones — not needed to launch)

If it's not in Section 4 below, it is explicitly **out of scope** for Phase 1.

---

## 3. Explicit Assumptions (previously missing)

| Assumption | Value | Why it matters |
|---|---|---|
| Team size | 1–3 engineers | Determines how much architecture ceremony is affordable |
| Timeline | 6–8 weeks to launch | Anchors scope; adjust if your real team/timeline differs |
| Users at launch | 0 clients → first 1–5 real clients | No need to engineer for scale yet |
| Backend framework | **FastAPI** (pick one now — SRS left this open) | Removes a lingering "either/or" decision |
| Hosting budget | Assume low-cost / single-region | No need for multi-region, Kubernetes, or HA clustering yet |
| Compliance | Nigeria Data Protection Regulation (NDPR) applies from day one if collecting client PII | Not mentioned in prior docs; relevant given target market |

---

## 4. Phase 1 Scope

### 4.1 Public Website
Home, About, Services, Portfolio, Blog, Contact. Contact/inquiry form stores a lead and sends an email notification. Basic SEO. Cut: Products, Academy, Innovation Lab, Careers pages.

### 4.2 Authentication
Register, login, logout, forgot/reset password, email verification. Cut: MFA, OAuth (Phase 2). Argon2 hashing, rate-limited login, secure session cookies.

### 4.3 User Roles (trimmed from 10+ to 3)
Admin (full access), Client (own projects/documents only), Guest (public site only). Permission-based checks underneath (`project.read`, `project.update`, etc.) so more roles can be added later without a rewrite.

### 4.4 Client Portal (minimal)
Dashboard (list of own projects), Project detail (status, read-only milestones, file upload/download), Profile (name/email/password). Cut: invoicing/payments, notifications, support tickets.

### 4.5 Admin Console (minimal)
Manage users, manage clients/projects, view leads. Cut: analytics dashboards, security event monitoring, CMS beyond basic blog.

### 4.6 Basic CMS (blog only)
Create/edit/publish/list/categorize blog posts. Cut: Pages/Menus/Testimonials/Partners/FAQs/Case Studies as dynamic CMS entities — static pages for Phase 1.

---

## 5. Trimmed Data Model (Phase 1 only)

4 domains, ~14 tables (down from 14 domains / ~100 tables):

- **Identity & Access:** users, roles, permissions, user_roles, role_permissions, refresh_tokens, email_verifications, password_resets
- **Client Management:** clients, client_documents
- **Projects (simplified):** projects, milestones, project_files
- **Website CMS (minimal):** blog_posts, leads

All other domains (Finance, Support, Academy, Research, Innovation Lab, Notifications, Analytics, most of System) are deferred, not deleted.

---

## 6. Trimmed API Surface (~25–30 endpoints)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/users/me
PATCH  /api/users/me

GET    /api/clients            (admin)
GET    /api/clients/{id}       (admin)

GET    /api/projects           (client: own only, admin: all)
GET    /api/projects/{id}
POST   /api/projects           (admin)
PATCH  /api/projects/{id}      (admin)

POST   /api/projects/{id}/files
GET    /api/projects/{id}/files

GET    /api/blog
GET    /api/blog/{slug}
POST   /api/blog                (admin)
PATCH  /api/blog/{id}           (admin)

POST   /api/leads               (public contact form)
GET    /api/leads               (admin)
```

---

## 7–10. NFRs, Tech Stack, Roadmap, Summary

See the full six-document set for complete detail; the load-bearing decisions
are: FastAPI + Next.js + TypeScript + Tailwind + PostgreSQL, Argon2 + JWT
auth, audit fields (`created_at`/`updated_at`/`deleted_at`) on every table,
Sentry for error tracking, single-region container hosting, and a phased
roadmap (Phase 2: tickets/invoicing/OAuth/MFA/notifications; Phase 3:
Academy; Phase 4+: SaaS products, cybersecurity platform, AI assistant).
