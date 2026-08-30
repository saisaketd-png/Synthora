package com.kemkendra.document;

import com.kemkendra.identity.User;
import java.util.UUID;

public interface DocumentAuthorizationService {
    boolean canAccessDocument(DocumentOwnerType type, UUID ownerId, User authenticatedUser);
    boolean canUploadDocument(DocumentOwnerType type, UUID ownerId, User authenticatedUser);
    boolean canDeleteDocument(DocumentResponse document, User authenticatedUser);
}
