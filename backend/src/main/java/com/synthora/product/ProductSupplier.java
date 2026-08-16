    package com.synthora.product;

    import jakarta.persistence.*;
    import java.math.BigDecimal;
    import java.time.LocalDateTime;

    @Entity
    @Table(name = "product_suppliers")
    public class ProductSupplier {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "product_id")
        private Product product;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "supplier_id")
        private Supplier supplier;

        private String purity;

        private String grade;

        @Column(name = "moq_kg")
        private BigDecimal moqKg;

        private String packaging;

        @Column(name = "lead_time_days")
        private Integer leadTimeDays;

        @Column(name = "coa_available")
        private Boolean coaAvailable;

        @Column(name = "msds_available")
        private Boolean msdsAvailable;

        @Column(name = "created_at")
        private LocalDateTime createdAt;

        public Long getId() { return id; }
        public Product getProduct() { return product; }
        public Supplier getSupplier() { return supplier; }
        public String getPurity() { return purity; }
        public String getGrade() { return grade; }
        public BigDecimal getMoqKg() { return moqKg; }
        public String getPackaging() { return packaging; }
        public Integer getLeadTimeDays() { return leadTimeDays; }
        public Boolean getCoaAvailable() { return coaAvailable; }
        public Boolean getMsdsAvailable() { return msdsAvailable; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }