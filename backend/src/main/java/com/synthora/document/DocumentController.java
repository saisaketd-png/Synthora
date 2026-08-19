package com.synthora.document;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final DocumentAuthorizationService documentAuthorizationService;

    public DocumentController(
            DocumentService documentService, 
            UserRepository userRepository,
            DocumentAuthorizationService documentAuthorizationService) {
        this.documentService = documentService;
        this.userRepository = userRepository;
        this.documentAuthorizationService = documentAuthorizationService;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("User must be authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    private User getOptionalAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse uploadDocument(
            @Valid @ModelAttribute DocumentUploadRequest request,
            Authentication authentication) {
        
        User user = getAuthenticatedUser(authentication);
        
        if (!documentAuthorizationService.canUploadDocument(request.getOwnerType(), request.getOwnerId(), user)) {
            throw new AccessDeniedException("Not authorized to upload documents for this owner");
        }
        
        return documentService.uploadDocument(request, user.getId());
    }

    @GetMapping("/{id}")
    public DocumentResponse getDocument(@PathVariable UUID id, Authentication authentication) {
        User user = getOptionalAuthenticatedUser(authentication);
        
        DocumentResponse doc = documentService.getDocument(id);
        
        if (!documentAuthorizationService.canAccessDocument(doc.getOwnerType(), doc.getOwnerId(), user)) {
            throw new AccessDeniedException("Not authorized to view this document");
        }
        
        return doc;
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID id, Authentication authentication) {
        User user = getOptionalAuthenticatedUser(authentication);
        
        DocumentResponse doc = documentService.getDocument(id);
        
        if (!documentAuthorizationService.canAccessDocument(doc.getOwnerType(), doc.getOwnerId(), user)) {
            throw new AccessDeniedException("Not authorized to download this document");
        }
        
        Resource resource = documentService.downloadDocument(id);
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFileName().replace("\"", "\\\"") + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-cache, no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header("X-Content-Type-Options", "nosniff")
                .body(resource);
    }

    @GetMapping
    public List<DocumentResponse> getDocumentsByOwner(
            @RequestParam DocumentOwnerType ownerType,
            @RequestParam UUID ownerId,
            Authentication authentication) {
        
        User user = getOptionalAuthenticatedUser(authentication);
        
        if (!documentAuthorizationService.canAccessDocument(ownerType, ownerId, user)) {
            throw new AccessDeniedException("Not authorized to view documents for this owner");
        }
        
        return documentService.getDocumentsByOwner(ownerType, ownerId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDocument(@PathVariable UUID id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        
        DocumentResponse doc = documentService.getDocument(id);
        
        if (!documentAuthorizationService.canDeleteDocument(doc, user)) {
            throw new AccessDeniedException("Not authorized to delete this document");
        }
        
        documentService.deleteDocument(id);
    }
}
