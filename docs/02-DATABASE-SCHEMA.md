# Database Schema – Construction Quotation Studio (V1.0)

Database: **PostgreSQL**  
ORM: **Prisma**  
Strategy: Soft-delete on all major tables. UUID primary keys. Timestamps on everything.

---

## Entity Relationship Overview

```
Company Settings (1)
    │
    ├── Admin User (1 in V1)
    │
    ├── Customers ──────────────────────┐
    │                                    │
    ├── Cost Library                     │
    │   ├── Categories                   │
    │   ├── Items                        │
    │   │   └── Item Rate Profiles       │
    │   └── Brands                       │
    │                                    │
    ├── Measurement Templates            │
    │   └── Measurement Entries          │
    │                                    │
    └── Quotations ─────────────────────┘
        ├── Quotation Items
        │   └── Quotation Item Rates
        ├── Quotation Versions
        ├── Client Access
        └── Client Selections
```

---

## Tables

### 1. `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(150) | NOT NULL |
| role | ENUM('admin') | NOT NULL, default 'admin' |
| is_active | BOOLEAN | default TRUE |
| last_login_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 2. `company_settings`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| company_name | VARCHAR(255) | NOT NULL |
| company_email | VARCHAR(255) | nullable |
| company_phone | VARCHAR(50) | nullable |
| company_address | TEXT | nullable |
| logo_url | VARCHAR(500) | nullable |
| stamp_url | VARCHAR(500) | nullable |
| signature_url | VARCHAR(500) | nullable |
| default_currency | VARCHAR(10) | NOT NULL, default 'PKR' |
| default_tax_percent | DECIMAL(5,2) | default 0 |
| default_expiry_days | INTEGER | default 15 |
| terms_and_conditions | TEXT | nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 3. `currencies`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| code | VARCHAR(10) | UNIQUE, NOT NULL (e.g., PKR, USD, AED) |
| symbol | VARCHAR(10) | NOT NULL (e.g., ₨, $, د.إ) |
| name | VARCHAR(100) | NOT NULL |
| is_active | BOOLEAN | default TRUE |
| created_at | TIMESTAMP | default NOW |

---

### 4. `categories`

Primary categories for organizing cost library items (e.g., Painting, Flooring, Electrical, Plumbing).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(150) | NOT NULL |
| description | TEXT | nullable |
| sort_order | INTEGER | default 0 |
| is_active | BOOLEAN | default TRUE |
| deleted_at | TIMESTAMP | nullable (soft-delete) |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 5. `rate_tiers`

Defines pricing tiers (Economical, Average, Good, Premium).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL (e.g., Economical) |
| description | TEXT | nullable |
| sort_order | INTEGER | default 0 |
| is_active | BOOLEAN | default TRUE |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 6. `brands`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL |
| description | TEXT | nullable |
| rate_tier_id | UUID | FK → rate_tiers.id, NOT NULL |
| is_active | BOOLEAN | default TRUE |
| deleted_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 7. `units`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(50) | NOT NULL (e.g., sq.ft, rft, nos, kg) |
| full_name | VARCHAR(100) | nullable (e.g., Square Feet) |
| created_at | TIMESTAMP | default NOW |

---

### 8. `items` (Cost Library)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | nullable |
| category_id | UUID | FK → categories.id, NOT NULL |
| unit_id | UUID | FK → units.id, NOT NULL |
| is_active | BOOLEAN | default TRUE |
| deleted_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 9. `item_rates`

Each item can have multiple rates (one per tier + brand).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| item_id | UUID | FK → items.id, NOT NULL |
| rate_tier_id | UUID | FK → rate_tiers.id, NOT NULL |
| brand_id | UUID | FK → brands.id, nullable |
| rate | DECIMAL(12,2) | NOT NULL |
| is_active | BOOLEAN | default TRUE |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

**Unique constraint:** (item_id, rate_tier_id) — one rate per tier per item.

---

### 10. `customers`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL |
| email | VARCHAR(255) | nullable |
| phone | VARCHAR(50) | nullable |
| address | TEXT | nullable |
| company | VARCHAR(200) | nullable |
| notes | TEXT | nullable |
| deleted_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 11. `quotations`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| reference_number | VARCHAR(50) | UNIQUE, auto-generated |
| title | VARCHAR(255) | NOT NULL |
| customer_id | UUID | FK → customers.id, nullable |
| customer_name | VARCHAR(200) | NOT NULL (snapshot) |
| customer_email | VARCHAR(255) | nullable |
| customer_phone | VARCHAR(50) | nullable |
| customer_address | TEXT | nullable |
| currency_id | UUID | FK → currencies.id, NOT NULL |
| status | ENUM | NOT NULL, default 'draft' |
| discount_type | ENUM('percentage','fixed') | nullable |
| discount_value | DECIMAL(12,2) | default 0 |
| tax_percent | DECIMAL(5,2) | default 0 |
| tax_application | ENUM('on_total','on_line_items','none') | default 'on_total' |
| subtotal | DECIMAL(14,2) | default 0 |
| discount_amount | DECIMAL(14,2) | default 0 |
| tax_amount | DECIMAL(14,2) | default 0 |
| grand_total | DECIMAL(14,2) | default 0 |
| notes | TEXT | nullable |
| terms_and_conditions | TEXT | nullable |
| expiry_days | INTEGER | NOT NULL, default 15 |
| published_at | TIMESTAMP | nullable |
| expires_at | TIMESTAMP | nullable |
| submitted_at | TIMESTAMP | nullable |
| approved_at | TIMESTAMP | nullable |
| rejected_at | TIMESTAMP | nullable |
| current_version | INTEGER | default 0 |
| deleted_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

**Status ENUM values:** `draft`, `published`, `client_viewed`, `client_submitted`, `approved`, `rejected`, `expired`, `archived`

---

### 12. `quotation_items`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| quotation_id | UUID | FK → quotations.id, NOT NULL |
| item_id | UUID | FK → items.id, nullable (null if manually added) |
| title | VARCHAR(255) | NOT NULL (snapshot) |
| description | TEXT | nullable |
| unit_name | VARCHAR(50) | NOT NULL (snapshot) |
| quantity | DECIMAL(12,3) | NOT NULL, default 1 |
| sort_order | INTEGER | default 0 |
| is_selected | BOOLEAN | default TRUE (client can deselect) |
| measurement_entry_id | UUID | FK → measurement_entries.id, nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 13. `quotation_item_rates`

Stores which rate tiers are shown to the client for each item.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| quotation_item_id | UUID | FK → quotation_items.id, NOT NULL |
| rate_tier_id | UUID | FK → rate_tiers.id, NOT NULL |
| brand_id | UUID | FK → brands.id, nullable |
| brand_name | VARCHAR(200) | nullable (snapshot) |
| rate | DECIMAL(12,2) | NOT NULL (snapshot at time of adding) |
| is_selected | BOOLEAN | default FALSE (client selects one) |
| created_at | TIMESTAMP | default NOW |

---

### 14. `quotation_versions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| quotation_id | UUID | FK → quotations.id, NOT NULL |
| version_number | INTEGER | NOT NULL |
| snapshot_data | JSONB | NOT NULL (full quotation state) |
| published_by | UUID | FK → users.id |
| published_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | default NOW |

**Unique constraint:** (quotation_id, version_number)

---

### 15. `client_access`

Per-quotation client credentials.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| quotation_id | UUID | FK → quotations.id, UNIQUE |
| access_code | VARCHAR(20) | UNIQUE, NOT NULL (the "ID") |
| password_hash | VARCHAR(255) | NOT NULL |
| is_locked | BOOLEAN | default FALSE |
| is_enabled | BOOLEAN | default TRUE |
| first_accessed_at | TIMESTAMP | nullable |
| last_accessed_at | TIMESTAMP | nullable |
| access_count | INTEGER | default 0 |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 16. `client_selections`

Tracks what the client selected/deselected before submission.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| quotation_id | UUID | FK → quotations.id, NOT NULL |
| quotation_item_id | UUID | FK → quotation_items.id, NOT NULL |
| quotation_item_rate_id | UUID | FK → quotation_item_rates.id, nullable |
| is_item_selected | BOOLEAN | NOT NULL |
| selected_at | TIMESTAMP | default NOW |

---

### 17. `measurement_templates`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL (e.g., "3-Bed Apartment") |
| description | TEXT | nullable |
| project_reference | VARCHAR(200) | nullable |
| deleted_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 18. `measurement_entries`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| template_id | UUID | FK → measurement_templates.id, NOT NULL |
| room_name | VARCHAR(150) | NOT NULL (e.g., Master Bedroom) |
| measurement_type | ENUM('area','volume','length','perimeter','weight','custom') | NOT NULL |
| length | DECIMAL(10,3) | nullable |
| width | DECIMAL(10,3) | nullable |
| height | DECIMAL(10,3) | nullable |
| quantity | INTEGER | default 1 (e.g., 4 walls) |
| deduction | DECIMAL(10,3) | default 0 (for doors/windows) |
| computed_value | DECIMAL(12,3) | NOT NULL (final calculated value) |
| unit_name | VARCHAR(50) | NOT NULL |
| notes | TEXT | nullable |
| created_at | TIMESTAMP | default NOW |
| updated_at | TIMESTAMP | auto-update |

---

### 19. `audit_logs`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | nullable (null for client actions) |
| actor_type | ENUM('admin','client','system') | NOT NULL |
| action | VARCHAR(50) | NOT NULL (e.g., 'create', 'update', 'delete', 'publish', 'login', 'select', 'submit') |
| entity_type | VARCHAR(50) | NOT NULL (e.g., 'quotation', 'item', 'customer') |
| entity_id | UUID | NOT NULL |
| old_value | JSONB | nullable |
| new_value | JSONB | nullable |
| metadata | JSONB | nullable (IP, browser, etc.) |
| created_at | TIMESTAMP | default NOW |

**NO soft-delete. NO update. Append-only.**

---

### 20. `notifications`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| type | VARCHAR(50) | NOT NULL (e.g., 'client_submitted', 'quotation_expired') |
| title | VARCHAR(255) | NOT NULL |
| message | TEXT | nullable |
| entity_type | VARCHAR(50) | nullable |
| entity_id | UUID | nullable |
| is_read | BOOLEAN | default FALSE |
| email_sent | BOOLEAN | default FALSE |
| created_at | TIMESTAMP | default NOW |

---

### 21. `backups`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| filename | VARCHAR(255) | NOT NULL |
| file_path | VARCHAR(500) | NOT NULL |
| file_size_bytes | BIGINT | NOT NULL |
| trigger_type | ENUM('auto','manual') | NOT NULL |
| status | ENUM('completed','failed','in_progress') | NOT NULL |
| created_at | TIMESTAMP | default NOW |

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_items_category ON items(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_item_rates_item ON item_rates(item_id);
CREATE INDEX idx_quotations_status ON quotations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX idx_client_access_code ON client_access(access_code);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
```

---

## Key Relationships Summary

- `items` → belongs to `categories`, has one `unit`
- `item_rates` → belongs to `items`, belongs to `rate_tiers`, optionally linked to `brands`
- `quotations` → belongs to `customers`, has many `quotation_items`, has many `quotation_versions`
- `quotation_items` → belongs to `quotations`, has many `quotation_item_rates`
- `client_access` → one-to-one with `quotations`
- `measurement_entries` → belongs to `measurement_templates`
- `quotation_items` → optionally linked to `measurement_entries`
