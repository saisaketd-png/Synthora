package com.synthora.document;

import java.time.LocalDateTime;
import java.util.UUID;

public class DocumentResponse {
    private UUID id;
    private DocumentOwnerType ownerType;
    private UUID ownerId;
    private DocumentCategory category;
    private String originalFileName;
    private String mimeType;
    private Long fileSize;
    private LocalDateTime createdAt;
    private UUID uploadedBy;

    public DocumentResponse(Document doc) {
        this.id = doc.getId();
        this.ownerType = doc.getOwnerType();
        this.ownerId = doc.getOwnerId();
        this.category = doc.getCategory();
        this.originalFileName = doc.getOriginalFileName();
        this.mimeType = doc.getMimeType();
        this.fileSize = doc.getFileSize();
        this.createdAt = doc.getCreatedAt();
        this.uploadedBy = doc.getUploadedBy();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public DocumentOwnerType getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(DocumentOwnerType ownerType) {
        this.ownerType = ownerType;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public DocumentCategory getCategory() {
        return category;
    }

    public void setCategory(DocumentCategory category) {
        this.category = category;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(UUID uploadedBy) {
        this.uploadedBy = uploadedBy;
    }
}
