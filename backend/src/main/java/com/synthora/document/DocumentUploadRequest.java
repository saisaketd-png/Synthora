package com.synthora.document;

import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public class DocumentUploadRequest {

    @NotNull(message = "File is required")
    private MultipartFile file;

    @NotNull(message = "ownerType is required")
    private DocumentOwnerType ownerType;

    @NotNull(message = "ownerId is required")
    private UUID ownerId;

    @NotNull(message = "Document category is required")
    private DocumentCategory category;

    public MultipartFile getFile() {
        return file;
    }

    public void setFile(MultipartFile file) {
        this.file = file;
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
}
