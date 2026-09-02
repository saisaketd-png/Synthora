package com.kemkendra.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByOwnerTypeAndOwnerId(DocumentOwnerType ownerType, UUID ownerId);
    List<Document> findByOwnerTypeAndOwnerIdAndIsActiveTrue(DocumentOwnerType ownerType, UUID ownerId);
    List<Document> findByDocumentGroupIdOrderByVersionDesc(UUID documentGroupId);
    Optional<Document> findTopByDocumentGroupIdOrderByVersionDesc(UUID documentGroupId);
    Optional<Document> findByDocumentGroupIdAndIsActiveTrue(UUID documentGroupId);
    List<Document> findByOwnerTypeAndOwnerIdAndCategoryAndIsActiveTrue(DocumentOwnerType ownerType, UUID ownerId, DocumentCategory category);
    List<Document> findByUploadedBy(UUID uploadedBy);
}
