package com.synthora.seo;

import com.synthora.product.MasterProduct;
import com.synthora.product.MasterProductRepository;
import com.synthora.product.SupplierOfferingRepository;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/sitemap.xml")
public class SitemapController {

    private final MasterProductRepository masterProductRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;

    public SitemapController(MasterProductRepository masterProductRepository, SupplierOfferingRepository supplierOfferingRepository) {
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
    }

    @GetMapping(produces = MediaType.APPLICATION_XML_VALUE)
    public String getSitemapXml() {
        List<MasterProduct> activeProducts = masterProductRepository.findByStatus("ACTIVE");

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Static routes
        xml.append("  <url><loc>https://synthora.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n");
        xml.append("  <url><loc>https://synthora.com/products</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n");
        xml.append("  <url><loc>https://synthora.com/categories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n");

        // Canonical active master products with eligible offerings only
        for (MasterProduct mp : activeProducts) {
            long count = supplierOfferingRepository.countByMasterProductIdAndAvailabilityStatusAndModerationStatus(mp.getId(), "AVAILABLE", "APPROVED");
            if (count > 0) {
                xml.append("  <url>\n");
                xml.append("    <loc>https://synthora.com/products/").append(mp.getMasterProductCode()).append("</loc>\n");
                xml.append("    <changefreq>daily</changefreq>\n");
                xml.append("    <priority>0.8</priority>\n");
                xml.append("  </url>\n");
            }
        }

        xml.append("</urlset>");
        return xml.toString();
    }
}
