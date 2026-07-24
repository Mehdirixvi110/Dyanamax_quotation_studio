# Business Rules – Construction Quotation Studio (V1.0)

---

## 1. User Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access to all modules. Can create, edit, delete, publish, revert, manage clients, cost library, settings, analytics. |
| **Client** | Can only view ONE assigned quotation via unique ID/password. Can select/deselect items and categories. Can submit selections. Can download PDF. |

### Rules:
- V1 has a single admin account.
- Future: Multiple admins with a Super Admin controlling others.
- Admin cannot restrict another admin (V1).
- Only admin can delete a quotation.
- Client credentials are per-quotation (not per-person). One quotation = one unique ID + password.
- Once a client opens and locks a quotation (submits), it cannot be viewed again unless admin re-enables access.

---

## 2. Quotation Lifecycle

```
[Draft] → [Published] → [Client Viewed] → [Client Submitted] → [Approved / Rejected] → [Archived]
```

| State | Description |
|-------|-------------|
| **Draft** | Admin is building/editing. Not visible to client. |
| **Published** | Client credentials generated. Client can now log in and view. Expiry timer starts. |
| **Client Viewed** | Client has opened the quotation. Logged in audit. |
| **Client Submitted** | Client finalized selections and submitted. Quotation locks for client. |
| **Approved** | Admin accepted the client's selections. |
| **Rejected** | Admin rejected. Can re-publish with changes. |
| **Archived** | Quotation moved to archive. Read-only. |

### Rules:
- A new version is created ONLY when a quotation is published (not on every edit).
- Admin can revert to any previous published version.
- Client cannot see old versions.
- Admin can re-enable client access after lock (manually).

---

## 3. Quotation Expiry

- Every published quotation has an expiry period (set by admin, e.g., 7 days, 15 days, 30 days).
- Expiry period is dynamic and configurable per quotation.
- Admin can extend the expiry period at any time.
- After expiry, the client login link becomes invalid.
- Expired quotations move to "Expired" state but can be re-published.

---

## 4. Pricing & Rate Logic

### Categories:
- Economical
- Average
- Good
- Premium

Each item in the cost library has rates for one or more categories. Each category can have:
- Brand name
- Brand description
- Rate (per unit)

### Dynamic Rate Selection (Quotation Builder):
- Admin picks which categories to show to the client (e.g., only Average + Premium).
- Client sees only the selected categories for each item.
- Client can pick ONE category per item.

### Total Calculation:
- If one category selected by client: `Total = Rate × Quantity`
- If client hasn't selected yet and multiple categories visible: show range `(Min Rate × Qty) – (Max Rate × Qty)`
- Grand Total = Sum of all item totals

### Dynamic Update:
- When client selects/deselects items or changes category, totals update in real-time.

---

## 5. Tax & Discount

### Tax:
- Tax is flat percentage (not per-item in V1).
- Tax can be applied on line-item level OR on grand total (admin chooses).
- Tax is adjustable per quotation.
- Tax can be removed entirely.

### Discount:
- Discount is a flat amount or percentage (admin chooses).
- Applied before tax.
- Visible to client.

### Formula:
```
Subtotal = Sum of all selected items
After Discount = Subtotal - Discount
Tax Amount = After Discount × Tax%
Grand Total = After Discount + Tax Amount
```

---

## 6. Currency

- Multiple currencies supported.
- Admin sets default currency in settings.
- Each quotation can have its own currency (selected at creation).
- Currency symbol shown in PDF and client view.
- No live conversion (V1). Just label/symbol change.

---

## 7. Cost Library Rules

- Every item must have: Title, Description, Unit, at least one category with rate.
- Items can belong to a primary category (e.g., Painting, Flooring, Electrical).
- Items can be duplicated.
- Deleting an item does NOT remove it from existing quotations (soft reference).
- Rate changes in the library do NOT auto-update existing quotations (snapshot at time of adding to quotation).

---

## 8. Customer Management Rules

- Customers can be saved to database for reuse.
- Customer fields: Name, Contact, Email, Address, Company (optional).
- When building a quotation, admin can pick existing customer or enter manually.
- Manual entries can optionally be saved to database.

---

## 9. Measurement Templates (Optional Feature)

- A calculation tool to compute area, volume, length, weight for rooms/spaces.
- Each measurement is saved per project.
- When building a quotation, measurements can be directly selected for relevant items.
  - Example: Paint item → select wall area + ceiling area of rooms.
  - Example: Tiles item → select floor area of rooms.
- This is an OPTIONAL feature — quotation can be built without measurements.
- Measurement templates support: Length, Width, Height, Area (L×W), Volume (L×W×H), Perimeter, custom formulas.

---

## 10. Versioning Rules

- Version is created on every PUBLISH action.
- Version stores: all items, rates, quantities, categories, customer details, tax, discount, selections.
- Admin can view version history.
- Admin can revert to any version (creates a new draft from that version).
- Client never sees versions.

---

## 11. Audit Log

- Every EDIT action is logged (who, what, when, old value, new value).
- Every DELETE action is logged.
- Every PUBLISH action is logged.
- Every CLIENT action is logged (login, view, select, deselect, submit).
- Every ADMIN action is logged (create, edit, delete, approve, reject, revert).
- Audit logs are read-only. Cannot be deleted (even by admin).

---

## 12. Notifications

### In-App:
- Client submits quotation → Admin gets notification.
- Quotation published → Log entry.
- Quotation expired → Admin gets notification.

### Email:
- Client credentials sent via email on publish.
- Client submission confirmation via email.
- Expiry warning to admin (e.g., 2 days before expiry).

---

## 13. Backup & Data Recovery

- Daily automated database backup.
- Admin can trigger manual backup from settings.
- Soft-delete for all major entities (items, quotations, customers). Hard delete only after 30 days.
- Recovery: Admin can restore soft-deleted items within 30 days.

---

## 14. PDF Generation

- One professional template (V1).
- Structure kept dynamic for future multiple templates.
- PDF includes: Company logo, company details, customer details, item table with selected categories, totals, tax, discount, grand total, terms & conditions, signature/stamp image.
- Admin can preview PDF before publishing.

---

## 15. Error Handling & Validation Strategy

### Frontend:
- Inline validation on all forms (using Zod schemas).
- Toast notifications for success/error actions (save, delete, publish).
- Confirmation dialogs for destructive actions (delete, revert).
- Optimistic UI updates with rollback on failure.

### Backend:
- All inputs validated via DTOs (class-validator in NestJS).
- Proper HTTP status codes (400, 401, 403, 404, 500).
- Global exception filter for consistent error responses.
- Rate limiting on client login endpoint.

### State:
- React Query for all server state (caching, refetch, stale management).
- React Hook Form + Zod for form state.
- Zustand for UI-only global state (sidebar open, active modal, theme mode).
- No Redux — unnecessary complexity for this scale.
