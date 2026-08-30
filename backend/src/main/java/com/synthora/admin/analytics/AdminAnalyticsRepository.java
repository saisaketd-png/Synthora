package com.synthora.admin.analytics;

import com.synthora.admin.analytics.dto.DataPointDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Repository
public class AdminAnalyticsRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminAnalyticsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ==========================================
    // USER METRICS
    // ==========================================

    public long countTotalUsers() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL", Long.class);
        return count != null ? count : 0L;
    }

    public long countUsersByRole(String role) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE role = ? AND deleted_at IS NULL",
                Long.class,
                role
        );
        return count != null ? count : 0L;
    }

    public long countUsersByStatus(String status) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE status = ? AND deleted_at IS NULL",
                Long.class,
                status
        );
        return count != null ? count : 0L;
    }

    public long countUnverifiedEmailUsers() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email_verified_at IS NULL AND deleted_at IS NULL",
                Long.class
        );
        return count != null ? count : 0L;
    }

    public long countUserRegistrationsBetween(Instant from, Instant to) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at < ? AND deleted_at IS NULL",
                Long.class,
                Timestamp.from(from),
                Timestamp.from(to)
        );
        return count != null ? count : 0L;
    }

    // ==========================================
    // SUPPLIER METRICS
    // ==========================================

    public long countTotalSuppliers() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM suppliers", Long.class);
        return count != null ? count : 0L;
    }

    public long countSuppliersByVerificationStatus(String status) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM suppliers WHERE verification_status = ?",
                Long.class,
                status
        );
        return count != null ? count : 0L;
    }

    public long countSupplierRegistrationsBetween(LocalDateTime from, LocalDateTime to) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM suppliers WHERE created_at >= ? AND created_at < ?",
                Long.class,
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
        return count != null ? count : 0L;
    }

    // ==========================================
    // RFQ METRICS
    // ==========================================

    public long countTotalRfqs() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM rfqs", Long.class);
        return count != null ? count : 0L;
    }

    public long countOpenRfqs() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM rfqs WHERE status IN ('PENDING', 'CONTACTED', 'QUOTED', 'COUNTERED')",
                Long.class
        );
        return count != null ? count : 0L;
    }

    public long countRfqsByStatus(String status) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM rfqs WHERE status = ?",
                Long.class,
                status
        );
        return count != null ? count : 0L;
    }

    public long countRfqsBetween(LocalDateTime from, LocalDateTime to) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM rfqs WHERE created_at >= ? AND created_at < ?",
                Long.class,
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
        return count != null ? count : 0L;
    }

    // ==========================================
    // QUOTATION METRICS
    // ==========================================

    public long countTotalQuotations() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM quotations", Long.class);
        return count != null ? count : 0L;
    }

    public long countQuotationsBetween(LocalDateTime from, LocalDateTime to) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM quotations WHERE created_at >= ? AND created_at < ?",
                Long.class,
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
        return count != null ? count : 0L;
    }

    public long countAcceptedQuotations() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT accepted_quotation_id) FROM rfqs WHERE accepted_quotation_id IS NOT NULL",
                Long.class
        );
        return count != null ? count : 0L;
    }

    // ==========================================
    // ORDER METRICS & GMV
    // ==========================================

    public long countTotalOrders() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM purchase_orders", Long.class);
        return count != null ? count : 0L;
    }

    public long countOrdersBetween(LocalDateTime from, LocalDateTime to) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM purchase_orders WHERE created_at >= ? AND created_at < ?",
                Long.class,
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
        return count != null ? count : 0L;
    }

    public long countOrdersByStatus(String status) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM purchase_orders WHERE status = ?",
                Long.class,
                status
        );
        return count != null ? count : 0L;
    }

    public BigDecimal sumTotalGmv() {
        BigDecimal sum = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE status NOT IN ('CANCELLED', 'REJECTED')",
                BigDecimal.class
        );
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public BigDecimal sumPeriodGmv(LocalDateTime from, LocalDateTime to) {
        BigDecimal sum = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE created_at >= ? AND created_at < ? AND status NOT IN ('CANCELLED', 'REJECTED')",
                BigDecimal.class,
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public BigDecimal averageOrderValue() {
        BigDecimal avg = jdbcTemplate.queryForObject(
                "SELECT COALESCE(AVG(total_amount), 0) FROM purchase_orders WHERE status NOT IN ('CANCELLED', 'REJECTED')",
                BigDecimal.class
        );
        return avg != null ? avg : BigDecimal.ZERO;
    }

    // ==========================================
    // SHIPMENT METRICS
    // ==========================================

    public long countTotalShipments() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM shipments", Long.class);
        return count != null ? count : 0L;
    }

    public long countActiveShipments() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM shipments s JOIN purchase_orders p ON s.purchase_order_id = p.id WHERE p.status IN ('SHIPPED', 'PROCESSING', 'PLACED', 'CONFIRMED')",
                Long.class
        );
        return count != null ? count : 0L;
    }

    public long countDeliveredShipments() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM shipments s JOIN purchase_orders p ON s.purchase_order_id = p.id WHERE p.status IN ('DELIVERED', 'COMPLETED')",
                Long.class
        );
        return count != null ? count : 0L;
    }

    public long countDelayedShipments() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM shipments s JOIN purchase_orders p ON s.purchase_order_id = p.id WHERE p.status IN ('SHIPPED', 'PROCESSING', 'PLACED', 'CONFIRMED') AND s.estimated_delivery_date < CURRENT_DATE",
                Long.class
        );
        return count != null ? count : 0L;
    }

    // ==========================================
    // TREND AGGREGATION
    // ==========================================

    public Map<LocalDate, Long> getUserRegistrationTrends(Instant from, Instant to) {
        String sql = "SELECT CAST(created_at AS DATE) as d, COUNT(*) as cnt FROM users " +
                "WHERE created_at >= ? AND created_at < ? AND deleted_at IS NULL GROUP BY CAST(created_at AS DATE) ORDER BY d ASC";

        Map<LocalDate, Long> map = new HashMap<>();
        jdbcTemplate.query(sql, ps -> {
            ps.setTimestamp(1, Timestamp.from(from));
            ps.setTimestamp(2, Timestamp.from(to));
        }, rs -> {
            java.sql.Date d = rs.getDate("d");
            if (d != null) {
                map.put(d.toLocalDate(), rs.getLong("cnt"));
            }
        });
        return map;
    }

    public Map<LocalDate, Long> getRfqTrends(LocalDateTime from, LocalDateTime to) {
        String sql = "SELECT CAST(created_at AS DATE) as d, COUNT(*) as cnt FROM rfqs " +
                "WHERE created_at >= ? AND created_at < ? GROUP BY CAST(created_at AS DATE) ORDER BY d ASC";

        Map<LocalDate, Long> map = new HashMap<>();
        jdbcTemplate.query(sql, ps -> {
            ps.setTimestamp(1, Timestamp.valueOf(from));
            ps.setTimestamp(2, Timestamp.valueOf(to));
        }, rs -> {
            java.sql.Date d = rs.getDate("d");
            if (d != null) {
                map.put(d.toLocalDate(), rs.getLong("cnt"));
            }
        });
        return map;
    }

    public Map<LocalDate, Long> getQuotationTrends(LocalDateTime from, LocalDateTime to) {
        String sql = "SELECT CAST(created_at AS DATE) as d, COUNT(*) as cnt FROM quotations " +
                "WHERE created_at >= ? AND created_at < ? GROUP BY CAST(created_at AS DATE) ORDER BY d ASC";

        Map<LocalDate, Long> map = new HashMap<>();
        jdbcTemplate.query(sql, ps -> {
            ps.setTimestamp(1, Timestamp.valueOf(from));
            ps.setTimestamp(2, Timestamp.valueOf(to));
        }, rs -> {
            java.sql.Date d = rs.getDate("d");
            if (d != null) {
                map.put(d.toLocalDate(), rs.getLong("cnt"));
            }
        });
        return map;
    }

    public Map<LocalDate, Long> getOrderTrends(LocalDateTime from, LocalDateTime to) {
        String sql = "SELECT CAST(created_at AS DATE) as d, COUNT(*) as cnt FROM purchase_orders " +
                "WHERE created_at >= ? AND created_at < ? GROUP BY CAST(created_at AS DATE) ORDER BY d ASC";

        Map<LocalDate, Long> map = new HashMap<>();
        jdbcTemplate.query(sql, ps -> {
            ps.setTimestamp(1, Timestamp.valueOf(from));
            ps.setTimestamp(2, Timestamp.valueOf(to));
        }, rs -> {
            java.sql.Date d = rs.getDate("d");
            if (d != null) {
                map.put(d.toLocalDate(), rs.getLong("cnt"));
            }
        });
        return map;
    }

    public Map<LocalDate, BigDecimal> getGmvTrends(LocalDateTime from, LocalDateTime to) {
        String sql = "SELECT CAST(created_at AS DATE) as d, COALESCE(SUM(total_amount), 0) as amt FROM purchase_orders " +
                "WHERE created_at >= ? AND created_at < ? AND status NOT IN ('CANCELLED', 'REJECTED') GROUP BY CAST(created_at AS DATE) ORDER BY d ASC";

        Map<LocalDate, BigDecimal> map = new HashMap<>();
        jdbcTemplate.query(sql, ps -> {
            ps.setTimestamp(1, Timestamp.valueOf(from));
            ps.setTimestamp(2, Timestamp.valueOf(to));
        }, rs -> {
            java.sql.Date d = rs.getDate("d");
            if (d != null) {
                map.put(d.toLocalDate(), rs.getBigDecimal("amt"));
            }
        });
        return map;
    }

    // ==========================================
    // ACCOUNT GOVERNANCE & SUSPENSION METRICS
    // ==========================================

    public long countTotalSuspensions() {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM account_suspensions", Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public long countActiveSuspensions() {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM account_suspensions WHERE reinstated_at IS NULL", Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public long countSuspensionsBetween(Instant from, Instant to) {
        try {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM account_suspensions WHERE suspended_at >= ? AND suspended_at < ?",
                    Long.class,
                    Timestamp.from(from),
                    Timestamp.from(to)
            );
            return count != null ? count : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public long countAppealsByStatus(String status) {
        try {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM account_suspension_appeals WHERE status = ?",
                    Long.class,
                    status
            );
            return count != null ? count : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public long countActiveAppeals() {
        try {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM account_suspension_appeals WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'INFORMATION_REQUIRED')",
                    Long.class
            );
            return count != null ? count : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public long countAppealsBetween(Instant from, Instant to) {
        try {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM account_suspension_appeals WHERE created_at >= ? AND created_at < ?",
                    Long.class,
                    Timestamp.from(from),
                    Timestamp.from(to)
            );
            return count != null ? count : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public long countTotalReinstatements() {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM account_suspensions WHERE reinstated_at IS NOT NULL", Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }
}
