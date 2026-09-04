package com.kemkendra.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entity representing persistent sequence values for human-readable master product codes.
 * e.g., Prefix "API" with next_value = 1 will generate "API-00001".
 */
@Entity
@Table(name = "master_product_code_sequences")
public class MasterProductCodeSequence {

    @Id
    @Column(name = "prefix", length = 20, nullable = false)
    private String prefix;

    @Column(name = "next_value", nullable = false)
    private Long nextValue;

    public MasterProductCodeSequence() {
    }

    public MasterProductCodeSequence(String prefix, Long nextValue) {
        this.prefix = prefix;
        this.nextValue = nextValue;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public Long getNextValue() {
        return nextValue;
    }

    public void setNextValue(Long nextValue) {
        this.nextValue = nextValue;
    }
}
