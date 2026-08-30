package com.kemkendra.notification.events;

import com.kemkendra.document.DocumentCategory;
import com.kemkendra.document.DocumentOwnerType;

import java.util.UUID;

/**
 * Fired after a document is successfully uploaded.
 * Recipient: resolved counterparty based on ownerType and ownerId.
 */
public record DocumentUploadedEvent(
        UUID documentId,
        DocumentOwnerType ownerType,
        UUID ownerId,
        DocumentCategory category,
        UUID uploadedBy
) {}
