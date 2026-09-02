package com.kemkendra.document;

import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
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

    private UUID documentGroupId;

    private String documentNumber;

    private String issuingAuthority;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate issueDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate expiryDate;

    private String description;

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

    public UUID getDocumentGroupId() {
        return documentGroupId;
    }

    public void setDocumentGroupId(UUID documentGroupId) {
        this.documentGroupId = documentGroupId;
    }

    public String getDocumentNumber() {
        return documentNumber;
    }

    public void setDocumentNumber(String documentNumber) {
        this.documentNumber = documentNumber;
    }

    public String getIssuingAuthority() {
        return issuingAuthority;
    }

    public void setIssuingAuthority(String issuingAuthority) {
        this.issuingAuthority = issuingAuthority;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
