package com.kemkendra.admin.taxonomy;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditService;
import com.kemkendra.admin.config.dto.AdminConfigDtos.*;
import com.kemkendra.common.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminTaxonomyService {

    private static final Logger log = LoggerFactory.getLogger(AdminTaxonomyService.class);

    private final CatalogTaxonomyRepository taxonomyRepository;
    private final AuditService auditService;

    public AdminTaxonomyService(CatalogTaxonomyRepository taxonomyRepository, AuditService auditService) {
        this.taxonomyRepository = taxonomyRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public TaxonomiesResponse getAllTaxonomiesGrouped() {
        List<CatalogTaxonomy> all = taxonomyRepository.findAll();
        Map<String, List<CatalogTaxonomyDto>> grouped = all.stream()
                .map(this::toDto)
                .collect(Collectors.groupingBy(CatalogTaxonomyDto::type));

        List<TaxonomyGroupDto> groups = grouped.entrySet().stream()
                .map(e -> new TaxonomyGroupDto(e.getKey(), e.getValue().stream().sorted(Comparator.comparingInt(CatalogTaxonomyDto::displayOrder)).toList()))
                .sorted(Comparator.comparing(TaxonomyGroupDto::type))
                .toList();

        return new TaxonomiesResponse(groups);
    }

    @Transactional(readOnly = true)
    public List<CatalogTaxonomyDto> getTaxonomiesByType(String type, boolean activeOnly) {
        String cleanType = type.trim().toUpperCase();
        List<CatalogTaxonomy> items = activeOnly
                ? taxonomyRepository.findByTypeAndActiveTrueOrderByDisplayOrderAscNameAsc(cleanType)
                : taxonomyRepository.findByTypeOrderByDisplayOrderAscNameAsc(cleanType);

        return items.stream().map(this::toDto).toList();
    }

    @Transactional
    public CatalogTaxonomyDto createTaxonomy(CreateTaxonomyRequest request, String actorEmail) {
        String cleanType = request.type().trim().toUpperCase();
        String cleanCode = request.code().trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_");

        if (taxonomyRepository.existsByTypeAndCode(cleanType, cleanCode)) {
            throw new IllegalArgumentException("Taxonomy item with type '" + cleanType + "' and code '" + cleanCode + "' already exists");
        }

        CatalogTaxonomy taxonomy = new CatalogTaxonomy();
        taxonomy.setType(cleanType);
        taxonomy.setName(request.name().trim());
        taxonomy.setCode(cleanCode);
        taxonomy.setDescription(request.description() != null ? request.description().trim() : null);
        taxonomy.setActive(true);
        taxonomy.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);

        CatalogTaxonomy saved = taxonomyRepository.save(taxonomy);

        auditService.recordByEmail(
                actorEmail,
                AuditAction.TAXONOMY_CREATED,
                com.kemkendra.admin.audit.AuditTargetType.CATALOG_TAXONOMY,
                saved.getId().toString(),
                "Created taxonomy item: " + saved.getType() + "::" + saved.getCode() + " (" + saved.getName() + ")"
        );

        log.info("Taxonomy created: id={}, type={}, code={}, actor={}", saved.getId(), saved.getType(), saved.getCode(), actorEmail);
        return toDto(saved);
    }

    @Transactional
    public CatalogTaxonomyDto updateTaxonomy(UUID id, UpdateTaxonomyRequest request, String actorEmail) {
        CatalogTaxonomy taxonomy = taxonomyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Taxonomy item not found: " + id));

        String oldName = taxonomy.getName();
        taxonomy.setName(request.name().trim());
        if (request.description() != null) {
            taxonomy.setDescription(request.description().trim());
        }
        if (request.displayOrder() != null) {
            taxonomy.setDisplayOrder(request.displayOrder());
        }
        if (request.active() != null) {
            taxonomy.setActive(request.active());
        }

        CatalogTaxonomy saved = taxonomyRepository.save(taxonomy);

        auditService.recordByEmail(
                actorEmail,
                AuditAction.TAXONOMY_UPDATED,
                com.kemkendra.admin.audit.AuditTargetType.CATALOG_TAXONOMY,
                saved.getId().toString(),
                "Updated taxonomy item " + saved.getType() + "::" + saved.getCode()
        );

        return toDto(saved);
    }

    @Transactional
    public CatalogTaxonomyDto setTaxonomyActive(UUID id, boolean active, String actorEmail) {
        CatalogTaxonomy taxonomy = taxonomyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Taxonomy item not found: " + id));

        taxonomy.setActive(active);
        CatalogTaxonomy saved = taxonomyRepository.save(taxonomy);

        AuditAction action = active ? AuditAction.TAXONOMY_ACTIVATED : AuditAction.TAXONOMY_DEACTIVATED;
        auditService.recordByEmail(
                actorEmail,
                action,
                com.kemkendra.admin.audit.AuditTargetType.CATALOG_TAXONOMY,
                saved.getId().toString(),
                (active ? "Activated" : "Deactivated") + " taxonomy item " + saved.getType() + "::" + saved.getCode()
        );

        log.info("Taxonomy active state changed: id={}, active={}, actor={}", id, active, actorEmail);
        return toDto(saved);
    }

    private CatalogTaxonomyDto toDto(CatalogTaxonomy t) {
        return new CatalogTaxonomyDto(
                t.getId(),
                t.getType(),
                t.getName(),
                t.getCode(),
                t.getDescription(),
                t.isActive(),
                t.getDisplayOrder(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
