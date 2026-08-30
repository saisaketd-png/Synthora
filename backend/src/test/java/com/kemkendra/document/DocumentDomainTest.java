package com.kemkendra.document;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class DocumentDomainTest {

    @Autowired
    private DocumentRepository documentRepository;

    @BeforeEach
    public void setup() {
        documentRepository.deleteAll();
    }

    @Test
    public void testDocumentPersistenceAndRetrieval() {
        UUID ownerId = UUID.randomUUID();
        UUID uploadedBy = UUID.randomUUID();

        Document doc = new Document();
        doc.setOwnerType(DocumentOwnerType.PRODUCT);
        doc.setOwnerId(ownerId);
        doc.setCategory(DocumentCategory.COA);
        doc.setOriginalFileName("test_coa.pdf");
        doc.setStorageKey("s3://bucket/test_coa.pdf");
        doc.setMimeType("application/pdf");
        doc.setFileSize(1024L);
        doc.setUploadedBy(uploadedBy);

        Document saved = documentRepository.save(doc);

        assertNotNull(saved.getId());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());

        Document fetched = documentRepository.findById(saved.getId()).orElse(null);
        assertNotNull(fetched);
        assertEquals("test_coa.pdf", fetched.getOriginalFileName());
    }

    @Test
    public void testDocumentMetadataFields() {
        UUID ownerId = UUID.randomUUID();
        UUID uploadedBy = UUID.randomUUID();

        Document doc = new Document();
        doc.setOwnerType(DocumentOwnerType.RFQ);
        doc.setOwnerId(ownerId);
        doc.setCategory(DocumentCategory.TECHNICAL_SPECIFICATION);
        doc.setOriginalFileName("specs.docx");
        doc.setStorageKey("s3://bucket/specs.docx");
        doc.setMimeType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        doc.setFileSize(2048L);
        doc.setUploadedBy(uploadedBy);

        Document saved = documentRepository.save(doc);

        assertEquals(DocumentOwnerType.RFQ, saved.getOwnerType());
        assertEquals(ownerId, saved.getOwnerId());
        assertEquals(DocumentCategory.TECHNICAL_SPECIFICATION, saved.getCategory());
        assertEquals("specs.docx", saved.getOriginalFileName());
        assertEquals("s3://bucket/specs.docx", saved.getStorageKey());
        assertEquals("application/vnd.openxmlformats-officedocument.wordprocessingml.document", saved.getMimeType());
        assertEquals(2048L, saved.getFileSize());
        assertEquals(uploadedBy, saved.getUploadedBy());
    }

    @Test
    public void testDocumentsCanBeQueriedByOwner() {
        UUID ownerId = UUID.randomUUID();
        UUID uploadedBy = UUID.randomUUID();

        Document doc1 = new Document();
        doc1.setOwnerType(DocumentOwnerType.PURCHASE_ORDER);
        doc1.setOwnerId(ownerId);
        doc1.setCategory(DocumentCategory.INVOICE);
        doc1.setOriginalFileName("inv1.pdf");
        doc1.setStorageKey("s3://bucket/inv1.pdf");
        doc1.setMimeType("application/pdf");
        doc1.setFileSize(100L);
        doc1.setUploadedBy(uploadedBy);
        documentRepository.save(doc1);

        Document doc2 = new Document();
        doc2.setOwnerType(DocumentOwnerType.PURCHASE_ORDER);
        doc2.setOwnerId(ownerId);
        doc2.setCategory(DocumentCategory.PACKING_LIST);
        doc2.setOriginalFileName("pack1.pdf");
        doc2.setStorageKey("s3://bucket/pack1.pdf");
        doc2.setMimeType("application/pdf");
        doc2.setFileSize(150L);
        doc2.setUploadedBy(uploadedBy);
        documentRepository.save(doc2);

        List<Document> docs = documentRepository.findByOwnerTypeAndOwnerId(DocumentOwnerType.PURCHASE_ORDER, ownerId);
        assertEquals(2, docs.size());
    }

    @Test
    public void testDifferentOwnerTypesCanSafelyReferenceSameOwnerUUID() {
        UUID sharedId = UUID.randomUUID();
        UUID uploadedBy = UUID.randomUUID();

        Document docProduct = new Document();
        docProduct.setOwnerType(DocumentOwnerType.PRODUCT);
        docProduct.setOwnerId(sharedId);
        docProduct.setCategory(DocumentCategory.MSDS);
        docProduct.setOriginalFileName("msds.pdf");
        docProduct.setStorageKey("s3://bucket/msds.pdf");
        docProduct.setMimeType("application/pdf");
        docProduct.setFileSize(100L);
        docProduct.setUploadedBy(uploadedBy);
        documentRepository.save(docProduct);

        Document docRfq = new Document();
        docRfq.setOwnerType(DocumentOwnerType.RFQ);
        docRfq.setOwnerId(sharedId);
        docRfq.setCategory(DocumentCategory.TECHNICAL_SPECIFICATION);
        docRfq.setOriginalFileName("spec.pdf");
        docRfq.setStorageKey("s3://bucket/spec.pdf");
        docRfq.setMimeType("application/pdf");
        docRfq.setFileSize(200L);
        docRfq.setUploadedBy(uploadedBy);
        documentRepository.save(docRfq);

        List<Document> productDocs = documentRepository.findByOwnerTypeAndOwnerId(DocumentOwnerType.PRODUCT, sharedId);
        assertEquals(1, productDocs.size());
        assertEquals(DocumentCategory.MSDS, productDocs.get(0).getCategory());

        List<Document> rfqDocs = documentRepository.findByOwnerTypeAndOwnerId(DocumentOwnerType.RFQ, sharedId);
        assertEquals(1, rfqDocs.size());
        assertEquals(DocumentCategory.TECHNICAL_SPECIFICATION, rfqDocs.get(0).getCategory());
    }

    @Test
    public void testDuplicateStorageKeyRejected() {
        UUID ownerId = UUID.randomUUID();
        UUID uploadedBy = UUID.randomUUID();

        Document doc1 = new Document();
        doc1.setOwnerType(DocumentOwnerType.PRODUCT);
        doc1.setOwnerId(ownerId);
        doc1.setCategory(DocumentCategory.COA);
        doc1.setOriginalFileName("doc1.pdf");
        doc1.setStorageKey("s3://bucket/DUPLICATE_KEY");
        doc1.setMimeType("application/pdf");
        doc1.setFileSize(100L);
        doc1.setUploadedBy(uploadedBy);
        documentRepository.saveAndFlush(doc1);

        Document doc2 = new Document();
        doc2.setOwnerType(DocumentOwnerType.PRODUCT);
        doc2.setOwnerId(ownerId);
        doc2.setCategory(DocumentCategory.COA);
        doc2.setOriginalFileName("doc2.pdf");
        doc2.setStorageKey("s3://bucket/DUPLICATE_KEY");
        doc2.setMimeType("application/pdf");
        doc2.setFileSize(100L);
        doc2.setUploadedBy(uploadedBy);

        assertThrows(DataIntegrityViolationException.class, () -> {
            documentRepository.saveAndFlush(doc2);
        });
    }

    @Test
    public void testRequiredFieldsCannotBeNull() {
        Document doc = new Document();
        assertThrows(DataIntegrityViolationException.class, () -> {
            documentRepository.saveAndFlush(doc);
        });
    }
}
