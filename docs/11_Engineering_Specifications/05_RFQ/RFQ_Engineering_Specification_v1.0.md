# RFQ Engineering Specification

Version: 1.0

Status: Active

Last Updated: August 2026

---

# 1. Purpose

The RFQ (Request for Quotation) module enables buyers to request quotations from suppliers through a structured procurement workflow.

The RFQ system is the primary communication channel between buyers and suppliers on Synthora.

The objective is to replace unstructured communication with a professional and traceable procurement process.

---

# 2. Scope

This module includes:

- RFQ Creation
- RFQ Lifecycle
- Supplier Quotations
- RFQ Conversation
- Attachments
- RFQ Status Tracking
- Quote Expiry
- Buyer & Supplier Notifications

This module excludes:

- Payments
- Purchase Orders
- Logistics
- Contracts
- ERP Integration

---

# 3. Responsibilities

The RFQ module is responsible for:

Receiving procurement requests.

Connecting buyers with suppliers.

Supporting negotiations.

Tracking RFQ progress.

Maintaining complete communication history.

Recording quotation history.

---

# 4. Core Business Rules

One RFQ belongs to:

One Buyer

↓

One Company

↓

One Supplier Listing

↓

One Master Product

Every RFQ creates one procurement thread.

Business communication remains inside Synthora.

Deals are finalized outside Synthora during the MVP.

---

# 5. RFQ Lifecycle

Draft

↓

Submitted

↓

Viewed

↓

Quotation Sent

↓

Negotiation

↓

Accepted

↓

Closed

Alternative End States

Rejected

Expired

Cancelled

Archived

Every status transition should be recorded.

---

# 6. Database Entities

RFQ

Quotation

RFQMessage

RFQAttachment

RFQStatusHistory

---

# 7. Relationships

Buyer

↓

RFQ

↓

Supplier Listing

↓

Master Product

↓

Quotation

↓

Conversation

↓

Attachments

↓

Status History

---

# 8. Buyer Workflow

Search Product

↓

Select Supplier

↓

Open Supplier Listing

↓

Click "Request Quotation"

↓

Complete RFQ Form

↓

Attach Files (Optional)

↓

Submit

↓

Receive Updates

↓

Review Quotation

↓

Negotiate

↓

Accept or Close

---

# 9. RFQ Information

Required

Master Product

Supplier Listing

Required Quantity

Unit

Optional

Required Delivery City

Required Delivery State

Required By Date

Buyer Message

Attachments

Every RFQ automatically stores:

Buyer

Company

Submission Date

Current Status

---

# 10. Supplier Workflow

Receive Notification

↓

Open RFQ

↓

Review Requirements

↓

Reply

↓

Send Quotation

↓

Continue Discussion

↓

RFQ Closed

Suppliers should never modify the original RFQ.

They only respond to it.

---

# 11. Quotation

A quotation includes:

Unit Price

Currency

Minimum Order Quantity

Lead Time

Validity / Expiry Date

Packaging Information

Commercial Notes

Attachments (Optional)

Suppliers may submit revised quotations.

Previous quotations remain in history.

---

# 12. Conversation

Every RFQ contains a conversation thread.

Messages support:

Plain Text

Attachments

Timestamps

Sender Information

Messages cannot be edited after sending.

Messages should not be deleted.

---

# 13. Attachments

Supported examples:

Purchase Specification

Drawing

Technical Requirement

Tender Document

Image

PDF

Spreadsheet

Rules

Virus scan (future)

File validation

File size limits

Supported formats only

---

# 14. Quote Expiry

Every quotation has an expiry date.

Expired quotations remain visible.

Expired quotations cannot be accepted.

Suppliers may issue a revised quotation.

---

# 15. Status History

Every status transition is recorded.

Examples

Submitted

Viewed

Quotation Sent

Buyer Replied

Supplier Replied

Accepted

Closed

Rejected

Cancelled

History cannot be modified.

---

# 16. Validation Rules

Quantity required.

Quantity must be greater than zero.

Supplier Listing required.

Master Product required.

Required By Date cannot be in the past.

Quote Expiry must be after quotation creation.

Attachment validation required.

---

# 17. Security Rules

Only participants can access an RFQ.

Buyers access their own RFQs.

Suppliers access RFQs sent to their Company.

Administrators have controlled access.

RFQs are never publicly accessible.

---

# 18. Error Handling

Invalid quantity.

Supplier unavailable.

Listing unavailable.

Expired quotation.

Unauthorized access.

Invalid attachment.

Meaningful business-friendly responses only.

---

# 19. Notifications

RFQ Submitted.

RFQ Viewed.

Quotation Received.

New Message.

Quotation Revised.

Quotation Expired.

RFQ Closed.

Notifications support:

In-App

Email

Users may receive both channels simultaneously.

---

# 20. Future Expansion

Multi-Supplier RFQs.

Purchase Orders.

Negotiation Analytics.

ERP Integration.

Contract Management.

Digital Signatures.

AI-assisted quotation comparison.

---

# 21. Acceptance Criteria

Buyers can:

Create RFQs.

Upload attachments.

Track RFQ status.

Receive quotations.

Negotiate.

Close RFQs.

Suppliers can:

Receive RFQs.

Send quotations.

Upload attachments.

Reply to buyers.

Issue revised quotations.

Administrators can:

Monitor RFQs.

Investigate disputes.

Review communication history.

Every RFQ maintains a complete, immutable procurement history.