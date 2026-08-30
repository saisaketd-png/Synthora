# Company Engineering Specification

Version: 1.0

Status: Active

Last Updated: August 2026

---

# 1. Purpose

The Company module represents every business organization operating on KemKendra.

A Company is the primary commercial entity within the platform.

All supplier listings, subscriptions, verification records and commercial activities belong to a Company rather than an individual user.

---

# 2. Scope

This module includes:

- Company Registration
- Company Profile
- Company Membership
- Company Address
- Company Documents
- Company Verification
- Company Status
- Company Profile Management

This module excludes:

- Authentication
- Product Listings
- RFQs
- Subscription Billing
- Reviews

---

# 3. Responsibilities

The Company module is responsible for:

Creating companies.

Managing company profiles.

Managing company ownership.

Managing company documents.

Managing verification workflows.

Managing company visibility.

Maintaining company status.

Supporting future multi-user companies.

---

# 4. Business Rules

A Company represents a legal business entity.

A Company may have multiple users in the future.

The MVP supports one Owner per Company.

A User may create a Company.

Future versions may allow invitation-based membership.

Companies own:

- Supplier Listings
- Documents
- Subscription
- Reviews
- Commercial Activity

Deleting a User must never automatically delete a Company.

Company deletion should be soft-delete only.

---

# 5. Company Lifecycle

Guest

↓

Register User

↓

Create Company

↓

Complete Company Profile

↓

Upload Verification Documents

↓

Submit Verification

↓

Under Review

↓

Verified

↓

Can Publish Listings

---

# 6. Database Entities

Company

CompanyMember

CompanyAddress

CompanyDocument

VerificationCase

---

# 7. Relationships

Company

↓

CompanyMember

↓

User

Company

↓

SupplierListing

Company

↓

Subscription

Company

↓

VerificationCase

Company

↓

Review

Company

↓

AuditLog

---

# 8. Company Profile

The Company profile should include:

Company Name

Legal Name

Company Description

Business Type

Year Established

GST Number

IEC Number (Optional)

Website

Email

Phone

Address

City

State

Country

Pincode

Business Categories

Industries Served

Company Logo

Company Banner

Social Links (Future)

---

# 9. Company Verification

Verification is performed by Administrators.

Verification requires:

Legal Business Name

GST (where applicable)

Supporting Documents

Verification Status

Possible statuses:

Draft

Submitted

Under Review

Needs Changes

Approved

Rejected

Suspended

---

# 10. Company Documents

Supported document types:

GST Certificate

PAN

IEC

ISO Certificate

GMP Certificate

Company Profile

Other Supporting Documents

Each document includes:

Type

Status

Upload Date

Review Notes

Visibility

Version

---

# 11. Membership Rules

MVP

One Owner

Future

Owner

Administrator

Sales Manager

Procurement Manager

Employee

Viewer

Membership invitations are future functionality.

---

# 12. API Requirements

Support:

Create Company

Update Company

Get Company

Upload Documents

Submit Verification

View Verification Status

Update Company Profile

View Public Company Profile

---

# 13. Validation Rules

Company Name required.

Company Name length limits.

GST format validation.

Email validation.

Phone validation.

Address validation.

Required verification documents enforced.

Business Type required.

---

# 14. Security Rules

Only Company Owners may edit the Company.

Guests can only view public information.

Sensitive documents require authentication.

Verification documents are never publicly accessible.

Soft-deleted companies cannot log in or create listings.

---

# 15. Error Handling

Duplicate Company Name (where applicable).

Invalid GST.

Missing mandatory documents.

Verification already submitted.

Unauthorized update.

Suspended Company.

Archived Company.

Provide meaningful business-friendly messages.

---

# 16. Notifications

Company Created.

Verification Submitted.

Verification Approved.

Verification Rejected.

Additional Information Requested.

Company Suspended.

---

# 17. Future Expansion

Multiple Company Members.

Company Invitations.

Multiple Warehouses.

Multiple Branches.

Multiple Verification Levels.

Company Teams.

Department Management.

International Compliance Documents.

---

# 18. Acceptance Criteria

A Company Owner can:

Create a Company.

Edit Company Profile.

Upload Verification Documents.

Submit Verification.

Track Verification Status.

View Company Profile.

Administrators can:

Review Companies.

Approve Verification.

Reject Verification.

Request Additional Information.

Suspend Companies.

Every Company maintains a complete audit history.