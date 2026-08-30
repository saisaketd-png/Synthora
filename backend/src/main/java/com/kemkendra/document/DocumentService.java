package com.kemkendra.document;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.document.storage.StorageService;
import com.kemkendra.product.ProductService;
import com.kemkendra.notification.events.DocumentUploadedEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final FileSecurityValidator fileSecurityValidator;
    private final long maxFileSize;

    public DocumentService(DocumentRepository documentRepository,
                           StorageService storageService,
                           ProductService productService,
                           ApplicationEventPublisher eventPublisher,
                           FileSecurityValidator fileSecurityValidator,
                           @Value("${kemkendra.documents.max-file-size:10485760}") long maxFileSize) {
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.productService = productService;
        this.eventPublisher = eventPublisher;
        this.fileSecurityValidator = fileSecurityValidator;
        this.maxFileSize = maxFileSize;
    }

    @Transactional
    public DocumentResponse uploadDocument(DocumentUploadRequest request, UUID uploadedBy) {
        MultipartFile file = request.getFile();
        
        if (request.getOwnerType() == DocumentOwnerType.PRODUCT || request.getOwnerType() == DocumentOwnerType.MASTER_PRODUCT || request.getOwnerType() == DocumentOwnerType.SUPPLIER_OFFERING) {
            Set<DocumentCategory> allowedProductCategories = Set.of(
                DocumentCategory.COA,
                DocumentCategory.MSDS,
                DocumentCategory.TECHNICAL_SPECIFICATION,
                DocumentCategory.CERTIFICATION
            );
            if (!allowedProductCategories.contains(request.getCategory())) {
                throw new IllegalArgumentException("Invalid category for " + request.getOwnerType());
            }
        } else if (request.getOwnerType() == DocumentOwnerType.SUPPLIER) {
            Set<DocumentCategory> allowedSupplierCategories = Set.of(
                DocumentCategory.CERTIFICATION,
                DocumentCategory.TECHNICAL_SPECIFICATION
            );
            if (!allowedSupplierCategories.contains(request.getCategory())) {
                throw new IllegalArgumentException("Invalid category for SUPPLIER");
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
        
        // Deep binary inspection & signature validation
        FileSecurityValidator.ValidatedFileInfo validated = fileSecurityValidator.validate(file, maxFileSize);
        
        String storageKey = "documents/" + UUID.randomUUID() + validated.safeExtension();
        
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
        doc.setOriginalFileName(validated.safeOriginalFilename());
        doc.setStorageKey(storageKey);
        doc.setMimeType(validated.validatedMimeType());
        doc.setFileSize(validated.fileSize());
        doc.setUploadedBy(uploadedBy);
        
        try {
            doc = documentRepository.saveAndFlush(doc);
        } catch (Exception ex) {
            // Rollback storage if database fails
            storageService.delete(storageKey);
            throw ex;
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
            throw new IllegalStateException("Failed to delete physical file", e);
        }
    }

    public Resource downloadDocument(UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!storageService.exists(document.getStorageKey())) {
            throw new ResourceNotFoundException("Document file not found on storage");
        }
        return storageService.loadAsResource(document.getStorageKey());
    }
}
