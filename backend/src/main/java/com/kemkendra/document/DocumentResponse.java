package com.kemkendra.document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class DocumentResponse {
    private UUID id;
    private UUID documentGroupId;
    private DocumentOwnerType ownerType;
    private UUID ownerId;
    private DocumentCategory category;
    private String originalFileName;
    private String mimeType;
    private Long fileSize;
    private UUID uploadedBy;
    private String documentNumber;
    private String issuingAuthority;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String verificationStatus;
    private Integer version;
    private String checksum;
    private String description;
    private Boolean isActive;
    private String expiryStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DocumentResponse() {
    }

    public DocumentResponse(Document doc) {
        this.id = doc.getId();
        this.documentGroupId = doc.getDocumentGroupId() != null ? doc.getDocumentGroupId() : doc.getId();
        this.ownerType = doc.getOwnerType();
        this.ownerId = doc.getOwnerId();
        this.category = doc.getCategory();
        this.originalFileName = doc.getOriginalFileName();
        this.mimeType = doc.getMimeType();
        this.fileSize = doc.getFileSize();
        this.uploadedBy = doc.getUploadedBy();
        this.documentNumber = doc.getDocumentNumber();
        this.issuingAuthority = doc.getIssuingAuthority();
        this.issueDate = doc.getIssueDate();
        this.expiryDate = doc.getExpiryDate();
        this.verificationStatus = doc.getVerificationStatus() != null ? doc.getVerificationStatus() : "ACTIVE";
        this.version = doc.getVersion() != null ? doc.getVersion() : 1;
        this.checksum = doc.getChecksum();
        this.description = doc.getDescription();
        this.isActive = doc.getIsActive() != null ? doc.getIsActive() : true;
        this.expiryStatus = calculateExpiryStatus(doc.getExpiryDate());
        this.createdAt = doc.getCreatedAt();
        this.updatedAt = doc.getUpdatedAt();
    }

    public static String calculateExpiryStatus(LocalDate expiryDate) {
        if (expiryDate == null) {
            return "NO_EXPIRY";
        }
        LocalDate today = LocalDate.now();
        if (expiryDate.isBefore(today)) {
            return "EXPIRED";
        }
        if (expiryDate.isBefore(today.plusDays(30)) || expiryDate.isEqual(today.plusDays(30))) {
            return "EXPIRING_SOON";
        }
        return "VALID";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getDocumentGroupId() { return documentGroupId; }
    public void setDocumentGroupId(UUID documentGroupId) { this.documentGroupId = documentGroupId; }
    public DocumentOwnerType getOwnerType() { return ownerType; }
    public void setOwnerType(DocumentOwnerType ownerType) { this.ownerType = ownerType; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public DocumentCategory getCategory() { return category; }
    public void setCategory(DocumentCategory category) { this.category = category; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public UUID getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(UUID uploadedBy) { this.uploadedBy = uploadedBy; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public String getIssuingAuthority() { return issuingAuthority; }
    public void setIssuingAuthority(String issuingAuthority) { this.issuingAuthority = issuingAuthority; }
    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getChecksum() { return checksum; }
    public void setChecksum(String checksum) { this.checksum = checksum; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getExpiryStatus() { return expiryStatus; }
    public void setExpiryStatus(String expiryStatus) { this.expiryStatus = expiryStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
