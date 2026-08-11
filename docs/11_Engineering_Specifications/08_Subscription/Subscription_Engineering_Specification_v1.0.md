# Subscription Engineering Specification

Version: 1.0

Status: Active

Last Updated: August 2026

---

# 1. Purpose

The Subscription module manages Company subscription plans, feature access and premium marketplace services.

Subscriptions belong to Companies rather than individual Users.

The module enables future monetization without affecting the core marketplace architecture.

---

# 2. Scope

This module includes:

- Subscription Plans
- Company Subscription
- Feature Access
- Sponsored Listings
- Subscription Lifecycle
- Trial Support (Future)
- Billing Readiness

This module excludes:

- Payment Gateway
- Invoice Generation
- Tax Management
- Refunds

---

# 3. Responsibilities

The Subscription module is responsible for:

Managing subscription plans.

Managing company subscriptions.

Controlling premium features.

Managing sponsored listings.

Supporting future billing integration.

---

# 4. Core Business Rules

Subscriptions belong to Companies.

Users inherit subscription benefits from their Company.

One Company may have only one active subscription.

Administrators may manually upgrade or downgrade subscriptions.

The marketplace must remain fully functional without a paid subscription.

---

# 5. Subscription Lifecycle

Free

↓

Premium Upgrade

↓

Active

↓

Renewed

↓

Expired

↓

Grace Period (Future)

↓

Downgraded

↓

Cancelled

Every lifecycle event should be recorded.

---

# 6. Database Entities

SubscriptionPlan

CompanySubscription

SponsoredListing

---

# 7. Relationships

Company

↓

Company Subscription

↓

Subscription Plan

Company

↓

Sponsored Listing

↓

Supplier Listing

---

# 8. Subscription Plans

MVP Plans

Free

Premium (Future)

Enterprise (Future)

Plans define available features.

Plans do not contain business logic.

---

# 9. Free Plan

Initially includes:

Unlimited Listings

Unlimited RFQs

Unlimited Product Requests

Company Profile

Notifications

Search

Standard Support

This may be restricted in future versions.

---

# 10. Premium Features

Future examples:

Sponsored Listings

Priority Search Placement

Analytics Dashboard

Premium Badge

Advanced Company Profile

Lead Insights

Priority Support

Future integrations should not require architecture changes.

---

# 11. Sponsored Listings

Sponsored Listings belong to:

Company

↓

Supplier Listing

Sponsored Listings appear:

At the top of supplier results

Inside Master Product pages

Clearly marked as:

Sponsored

Sponsored listings must never replace Master Products.

Search integrity must be preserved.

---

# 12. Feature Access

Feature access is determined by:

Company Subscription

↓

Feature Availability

↓

Application Permissions

Frontend should not enforce feature restrictions.

Backend is the source of truth.

---

# 13. Plan Changes

Administrators may:

Upgrade Company

Downgrade Company

Grant Promotional Access

Suspend Subscription

These actions should be recorded in the audit log.

---

# 14. Validation Rules

Company required.

Plan required.

Only one active subscription.

Sponsored Listing requires approved Supplier Listing.

Plan activation dates validated.

---

# 15. Security Rules

Only Company Owners may manage subscriptions.

Administrators may override subscriptions.

Subscription information is private.

Payment information is excluded from MVP.

---

# 16. Error Handling

Invalid Plan.

Subscription already active.

Sponsored Listing not eligible.

Unauthorized modification.

Expired subscription.

Meaningful business-friendly responses only.

---

# 17. Notifications

Subscription Activated.

Subscription Renewed.

Subscription Expiring.

Subscription Downgraded.

Sponsored Listing Approved.

Sponsored Listing Expired.

---

# 18. Future Expansion

Online Payments.

Billing Portal.

Invoices.

Coupons.

Trials.

Usage-Based Pricing.

Marketplace Credits.

Partner Plans.

Multi-Year Plans.

---

# 19. Acceptance Criteria

Companies can:

View current subscription.

Upgrade when available.

Access entitled features.

Manage sponsored listings.

Administrators can:

Create plans.

Modify plans.

Assign subscriptions.

Override subscriptions.

Suspend subscriptions.

The application correctly enables or restricts premium features based on the Company's active subscription.