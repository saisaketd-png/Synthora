package com.synthora.document;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.document.storage.StorageService;
import com.synthora.product.ProductService;
import com.synthora.notification.events.DocumentUploadedEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final ProductService productService;
    private final ApplicationEventPublisher eventPublisher;
    private final long maxFileSize;

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "image/png",
            "image/jpeg"
    );

    private static final Set<String> REJECTED_EXTENSIONS = Set.of(
            ".exe", ".bat", ".cmd", ".sh", ".ps1", ".jar", ".class"
    );

    public DocumentService(DocumentRepository documentRepository,
                           StorageService storageService,
                           ProductService productService,
                           ApplicationEventPublisher eventPublisher,
                           @Value("${synthora.documents.max-file-size:10485760}") long maxFileSize) {
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.productService = productService;
        this.eventPublisher = eventPublisher;
        this.maxFileSize = maxFileSize;
    }

    @Transactional
    public DocumentResponse uploadDocument(DocumentUploadRequest request, UUID uploadedBy) {
        MultipartFile file = request.getFile();
        
        if (request.getOwnerType() == DocumentOwnerType.PRODUCT) {
            Set<DocumentCategory> allowedProductCategories = Set.of(
                DocumentCategory.COA,
                DocumentCategory.MSDS,
                DocumentCategory.TECHNICAL_SPECIFICATION,
                DocumentCategory.CERTIFICATION
            );
            if (!allowedProductCategories.contains(request.getCategory())) {
                throw new IllegalArgumentException("Invalid category for PRODUCT");
            }
        } else if (request.getOwnerType() == DocumentOwnerType.RFQ) {
            Set<DocumentCategory> allowedRfqCategories = Set.of(
                DocumentCategory.TECHNICAL_SPECIFICATION,
                DocumentCategory.CERTIFICATION
            );
            if (!allowedRfqCategories.contains(request.getCategory())) {
                throw new IllegalArgumentException("Invalid category for RFQ");
            }
        } else if (request.getOwnerType() == DocumentOwnerType.QUOTATION) {
            Set<DocumentCategory> allowedQuotationCategories = Set.of(
                DocumentCategory.TECHNICAL_SPECIFICATION,
                DocumentCategory.CERTIFICATION,
                DocumentCategory.QUOTATION_ATTACHMENT
            );
            if (!allowedQuotationCategories.contains(request.getCategory())) {
                throw new IllegalArgumentException("Invalid category for QUOTATION");
            }
        } else if (request.getOwnerType() == DocumentOwnerType.PURCHASE_ORDER) {
            Set<DocumentCategory> allowedPOCategories = Set.of(
                DocumentCategory.PURCHASE_ORDER,
                DocumentCategory.TECHNICAL_SPECIFICATION,
                DocumentCategory.CERTIFICATION,
                DocumentCategory.INVOICE
            );
            if (!allowedPOCategories.contains(request.getCategory())) {
                throw new IllegalArgumentException("Invalid category for PURCHASE_ORDER");
            }
        } else if (request.getOwnerType() == DocumentOwnerType.SHIPMENT) {
            Set<DocumentCategory> allowedShipmentCategories = Set.of(
                DocumentCategory.PACKING_LIST,
                DocumentCategory.DELIVERY_CONFIRMATION,
                DocumentCategory.CERTIFICATION,
                DocumentCategory.SHIPPING_DOCUMENT
            );
            if (!allowedShipmentCategories.contains(request.getCategory())) {
                throw new IllegalArgumentException("Invalid category for SHIPMENT");
            }
        }
        
        validateFile(file);
        
        String originalFileName = normalizeFileName(file.getOriginalFilename());
        String extension = getExtension(originalFileName);
        String storageKey = "documents/" + UUID.randomUUID().toString() + extension;
        
        // 1. Store physical file
        try {
            storageService.store(storageKey, file.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException("Failed to read upload stream", e);
        }

        // 2. Persist Database Metadata
        Document doc = new Document();
        doc.setOwnerType(request.getOwnerType());
        doc.setOwnerId(request.getOwnerId());
        doc.setCategory(request.getCategory());
        doc.setOriginalFileName(originalFileName);
        doc.setStorageKey(storageKey);
        doc.setMimeType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setUploadedBy(uploadedBy);
        
        try {
            doc = documentRepository.saveAndFlush(doc);
        } catch (Exception ex) {
            // Rollback storage if database fails
            storageService.delete(storageKey);
            throw ex; // Let global handler or transaction manage it
        }

        if (doc.getOwnerType() == DocumentOwnerType.PRODUCT) {
            productService.updateDocumentAvailability(doc.getOwnerId(), doc.getCategory(), true);
        }

        eventPublisher.publishEvent(new DocumentUploadedEvent(
                doc.getId(),
                doc.getOwnerType(),
                doc.getOwnerId(),
                doc.getCategory(),
                doc.getUploadedBy()
        ));

        return new DocumentResponse(doc);
    }

    public DocumentResponse getDocument(UUID id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return new DocumentResponse(doc);
    }

    public List<DocumentResponse> getDocumentsByOwner(DocumentOwnerType ownerType, UUID ownerId) {
        return documentRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
                .stream()
                .map(DocumentResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(UUID id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        // 1. Delete from DB first
        documentRepository.delete(doc);
        documentRepository.flush();
        
        if (doc.getOwnerType() == DocumentOwnerType.PRODUCT) {
            boolean hasRemaining = documentRepository.findByOwnerTypeAndOwnerId(DocumentOwnerType.PRODUCT, doc.getOwnerId())
                    .stream()
                    .anyMatch(d -> d.getCategory() == doc.getCategory());
            if (!hasRemaining) {
                productService.updateDocumentAvailability(doc.getOwnerId(), doc.getCategory(), false);
            }
        }
        
        // 2. Delete physical storage
        try {
            if (storageService.exists(doc.getStorageKey())) {
                storageService.delete(doc.getStorageKey());
            }
        } catch (Exception e) {
            // The prompt says: "If storage deletion fails: do not silently delete database metadata - return an appropriate server error"
            // However, because we are in @Transactional, throwing an exception here will rollback the database delete.
            // This satisfies the requirement "do not leave the system believing a file was deleted when storage deletion failed"
            throw new IllegalStateException("Failed to delete physical file", e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("Document exceeds maximum allowed size of " + (maxFileSize / 1048576) + " MB");
        }

        String mimeType = file.getContentType();
        if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException("Unsupported document type");
        }

        String originalName = file.getOriginalFilename();
        if (StringUtils.hasText(originalName)) {
            String lowerName = originalName.toLowerCase();
            if (REJECTED_EXTENSIONS.stream().anyMatch(lowerName::endsWith)) {
                throw new IllegalArgumentException("Unsupported document type");
            }
        }
    }

    private String normalizeFileName(String filename) {
        if (!StringUtils.hasText(filename)) {
            return "unknown_file";
        }
        
        // Strip path components
        String normalized = StringUtils.cleanPath(filename);
        if (normalized.contains("/")) {
            normalized = normalized.substring(normalized.lastIndexOf("/") + 1);
        }
        
        // Remove control characters
        normalized = normalized.replaceAll("[\\p{Cntrl}]", "");
        
        if (normalized.length() > 255) {
            normalized = normalized.substring(normalized.length() - 255);
        }
        
        if (!StringUtils.hasText(normalized)) {
            return "unknown_file";
        }
        
        return normalized;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    public Resource downloadDocument(UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return storageService.loadAsResource(document.getStorageKey());
    }
}
