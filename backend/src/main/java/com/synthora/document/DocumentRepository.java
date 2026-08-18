package com.synthora.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByOwnerTypeAndOwnerId(DocumentOwnerType ownerType, UUID ownerId);
    List<Document> findByUploadedBy(UUID uploadedBy);
}
