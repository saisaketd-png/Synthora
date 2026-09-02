# Admin Operations & Platform Control Center (Phase 1.13)

## 1. Overview
The **KemKendra Admin Operations & Platform Control Center** provides a centralized, unified operational intelligence and action layer across all platform pillars:
- **Identity & Access Governance**: Real-time user metrics, role assignments, status management, email verification tracking, and legal terms acceptance.
- **Supplier Operations**: Live supplier verification tracking, business classification, export readiness auditing, and editable seller profile synchronization.
- **Master Product Catalog**: Active chemical entities, CAS registry consistency, and multi-dimensional offering moderation.
- **Marketplace Fulfilment**: RFQs, quotations, Purchase Orders, and live freight tracking oversight.
- **Account Governance & Appeals**: Active suspensions, structured appeal determination, and continuous audit trails.

---

## 2. API Architecture

All endpoints are secured under `/api/v1/admin/operations` and require `@PreAuthorize("hasRole('ADMIN')")`.

### 2.1 Control Center Endpoints
| HTTP Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/operations/platform-snapshot` | Returns live PostgreSQL counts across users, suppliers, catalog, marketplace, and governance. |
| `GET` | `/api/v1/admin/operations/attention-queue` | Returns prioritized (HIGH/MEDIUM) action items requiring administrative review. |
| `GET` | `/api/v1/admin/operations/marketplace/quotations` | Paginated and filtered feed of supplier quotations across the platform. |
| `GET` | `/api/v1/admin/operations/marketplace/shipments` | Paginated and filtered feed of active freight and tracking consignments. |
| `GET` | `/api/v1/admin/operations/kpis` | Summary KPIs across master products, suppliers, offerings, and buyer sourcing requests. |
| `GET` | `/api/v1/admin/operations/action-center` | Legacy-compatible action center items. |
| `GET` | `/api/v1/admin/operations/catalog/quality` | 12-dimensional master product quality score matrix. |
| `GET` | `/api/v1/admin/operations/suppliers/quality` | Supplier completeness score and verification progress. |
| `GET` | `/api/v1/admin/operations/offerings/quality` | 15-dimensional supplier offering completeness matrix. |

### 2.2 Enriched Directory Endpoints
| HTTP Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/users/{id}` | Enriched user operational dossier with legal terms, supplier links, suspension state, and activity counts. |
| `GET` | `/api/v1/admin/suppliers/{id}` | Enriched supplier profile with legal company name, GST, active offering portfolio, and marketplace volumes. |

---

## 3. Security & Governance Rules
1. **Zero Client Trust**: All administrative privileges derive strictly from server-validated JWT claims (`ROLE_ADMIN`).
2. **Data Sanitization**: Sensitive authentication credentials, password hashes, and reset tokens are strictly excluded from all response DTOs.
3. **Bounded Pagination**: All paginated listing endpoints enforce $1 \le size \le 100$.
4. **Audit Logging**: Privileged administrative status modifications and actions are bound to `AuditService` entries.

---

## 4. Frontend Route Inventory
- `/dashboard/admin/operations`: Central Platform Control Center and Attention Queue.
- `/dashboard/admin/users`: Searchable and filterable User Directory.
- `/dashboard/admin/users/[userId]`: Comprehensive administrative User Dossier.
- `/dashboard/admin/suppliers`: Searchable Supplier Directory.
- `/dashboard/admin/suppliers/[supplierId]`: Enterprise Supplier Operational Profile.
- `/dashboard/admin/marketplace`: Unified Marketplace Operations Hub (RFQs, Quotations, POs, Shipments).
