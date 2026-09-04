package com.kemkendra.seo;

import com.kemkendra.product.MasterProduct;
import com.kemkendra.product.MasterProductRepository;
import com.kemkendra.product.SupplierOfferingRepository;
import org.springframework.beans.factory.annotation.Value;
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
    private final String baseUrl;

    public SitemapController(
            MasterProductRepository masterProductRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            @Value("${app.base-url:https://kemkendra.online}") String baseUrl) {
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    @GetMapping(produces = MediaType.APPLICATION_XML_VALUE)
    public String getSitemapXml() {
        List<MasterProduct> activeProducts = masterProductRepository.findByStatus("ACTIVE");

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Static routes
        xml.append("  <url><loc>").append(baseUrl).append("/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n");
        xml.append("  <url><loc>").append(baseUrl).append("/products</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n");
        xml.append("  <url><loc>").append(baseUrl).append("/categories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n");
        xml.append("  <url><loc>").append(baseUrl).append("/suppliers</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n");
        xml.append("  <url><loc>").append(baseUrl).append("/industries</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n");
        xml.append("  <url><loc>").append(baseUrl).append("/resources</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n");
        xml.append("  <url><loc>").append(baseUrl).append("/terms</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n");
        xml.append("  <url><loc>").append(baseUrl).append("/privacy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n");
        xml.append("  <url><loc>").append(baseUrl).append("/llms.txt</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n");

        // Canonical active master products with eligible offerings only
        for (MasterProduct mp : activeProducts) {
            long count = supplierOfferingRepository.countByMasterProductIdAndAvailabilityStatusAndModerationStatus(mp.getId(), "AVAILABLE", "APPROVED");
            if (count > 0) {
                xml.append("  <url>\n");
                xml.append("    <loc>").append(baseUrl).append("/products/").append(mp.getMasterProductCode()).append("</loc>\n");
                xml.append("    <changefreq>daily</changefreq>\n");
                xml.append("    <priority>0.8</priority>\n");
                xml.append("  </url>\n");
            }
        }

        xml.append("</urlset>");
        return xml.toString();
    }
}
