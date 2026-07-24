# API Contract – Construction Quotation Studio (V1.0)

Base URL: `/api/v1`  
Auth: JWT Bearer Token (admin endpoints)  
Client Auth: Separate access-code/password mechanism  
Format: JSON  
Pagination: `?page=1&limit=20` (default)  
Sorting: `?sortBy=created_at&order=desc`  
Search: `?search=keyword`

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Admin login (email + password) → JWT |
| POST | `/auth/refresh` | Refresh expired token |
| POST | `/auth/logout` | Invalidate token |
| GET | `/auth/me` | Get current admin profile |
| PUT | `/auth/change-password` | Change admin password |

---

## Client Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/client/login` | Client login (access_code + password) → Client JWT |
| GET | `/client/quotation` | Get quotation data for logged-in client |
| PUT | `/client/selections` | Save client item/category selections |
| POST | `/client/submit` | Submit final selections (locks quotation) |
| GET | `/client/pdf` | Download PDF of selected quotation |

---

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Total quotations, items, customers, revenue |
| GET | `/dashboard/recent-quotations` | Last 10 quotations |
| GET | `/dashboard/quotation-status-breakdown` | Count by status |
| GET | `/dashboard/top-items` | Most used items in quotations |
| GET | `/dashboard/monthly-revenue` | Revenue chart data (12 months) |

---

## Cost Library – Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List all categories |
| GET | `/categories/:id` | Get single category |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Soft-delete category |

---

## Cost Library – Rate Tiers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rate-tiers` | List all rate tiers |
| POST | `/rate-tiers` | Create tier |
| PUT | `/rate-tiers/:id` | Update tier |
| DELETE | `/rate-tiers/:id` | Delete tier |

---

## Cost Library – Brands

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/brands` | List all brands (filterable by rate_tier_id) |
| POST | `/brands` | Create brand |
| PUT | `/brands/:id` | Update brand |
| DELETE | `/brands/:id` | Soft-delete brand |

---

## Cost Library – Units

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/units` | List all units |
| POST | `/units` | Create unit |
| PUT | `/units/:id` | Update unit |
| DELETE | `/units/:id` | Delete unit |

---

## Cost Library – Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | List items (paginated, filterable by category, search) |
| GET | `/items/:id` | Get item with all rates |
| POST | `/items` | Create item (with rates) |
| PUT | `/items/:id` | Update item |
| DELETE | `/items/:id` | Soft-delete item |
| POST | `/items/:id/duplicate` | Duplicate item |
| GET | `/items/search?q=keyword` | Quick search for quotation builder |

---

## Cost Library – Item Rates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items/:id/rates` | Get all rates for an item |
| POST | `/items/:id/rates` | Add rate to item |
| PUT | `/items/:id/rates/:rateId` | Update a rate |
| DELETE | `/items/:id/rates/:rateId` | Remove a rate |

---

## Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers (paginated, searchable) |
| GET | `/customers/:id` | Get single customer |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Soft-delete customer |
| GET | `/customers/:id/quotations` | List quotations for a customer |

---

## Quotations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quotations` | List quotations (paginated, filterable by status, customer, date range) |
| GET | `/quotations/:id` | Get full quotation with items and rates |
| POST | `/quotations` | Create new quotation (draft) |
| PUT | `/quotations/:id` | Update quotation details |
| DELETE | `/quotations/:id` | Soft-delete quotation |
| POST | `/quotations/:id/duplicate` | Duplicate quotation |

---

## Quotation Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quotations/:id/items` | List all items in quotation |
| POST | `/quotations/:id/items` | Add item to quotation (from library or manual) |
| PUT | `/quotations/:id/items/:itemId` | Update quotation item (qty, order, etc.) |
| DELETE | `/quotations/:id/items/:itemId` | Remove item from quotation |
| PUT | `/quotations/:id/items/reorder` | Reorder items (batch sort_order update) |

---

## Quotation Item Rates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/quotations/:id/items/:itemId/rates` | Add rate tier to quotation item |
| DELETE | `/quotations/:id/items/:itemId/rates/:rateId` | Remove rate tier from item |

---

## Quotation Actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/quotations/:id/publish` | Publish quotation → generates client credentials, creates version |
| POST | `/quotations/:id/approve` | Approve client submission |
| POST | `/quotations/:id/reject` | Reject client submission |
| POST | `/quotations/:id/archive` | Archive quotation |
| POST | `/quotations/:id/revert/:versionId` | Revert to a previous version (creates new draft) |
| PUT | `/quotations/:id/extend-expiry` | Extend expiry period |
| PUT | `/quotations/:id/client-access` | Enable/disable/reset client access |

---

## Quotation Versions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quotations/:id/versions` | List all versions |
| GET | `/quotations/:id/versions/:versionId` | Get specific version snapshot |

---

## Quotation PDF

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quotations/:id/pdf` | Generate and download PDF |
| GET | `/quotations/:id/pdf/preview` | Preview PDF (returns HTML or base64) |

---

## Measurement Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/measurements` | List all templates |
| GET | `/measurements/:id` | Get template with entries |
| POST | `/measurements` | Create template |
| PUT | `/measurements/:id` | Update template |
| DELETE | `/measurements/:id` | Soft-delete template |

---

## Measurement Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/measurements/:id/entries` | Add entry to template |
| PUT | `/measurements/:id/entries/:entryId` | Update entry |
| DELETE | `/measurements/:id/entries/:entryId` | Delete entry |

---

## Admin Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get all company settings |
| PUT | `/settings` | Update company settings |
| POST | `/settings/logo` | Upload logo |
| POST | `/settings/stamp` | Upload stamp image |
| POST | `/settings/signature` | Upload signature image |
| GET | `/settings/currencies` | List active currencies |
| PUT | `/settings/currencies` | Update active currencies |

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications (paginated, unread first) |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |
| GET | `/notifications/unread-count` | Get unread count |

---

## Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-logs` | List logs (paginated, filterable by entity_type, action, date range) |
| GET | `/audit-logs/entity/:type/:id` | Get all logs for specific entity |

---

## Backups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/backups` | List all backups |
| POST | `/backups/trigger` | Trigger manual backup |
| GET | `/backups/:id/download` | Download backup file |

---

## Common Response Formats

### Success (Single):
```json
{
  "success": true,
  "data": { ... }
}
```

### Success (List):
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be greater than 0",
    "details": [ ... ]
  }
}
```

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 409 | Conflict (duplicate, state conflict) |
| 429 | Rate limited |
| 500 | Server error |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/client/login` | 5 requests per minute per IP |
| `/auth/login` | 10 requests per minute per IP |
| All other endpoints | 100 requests per minute per user |
