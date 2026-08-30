package com.kemkendra.admin.analytics;

import com.kemkendra.admin.analytics.dto.*;
import com.kemkendra.notification.Notification;
import com.kemkendra.notification.NotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class AdminAnalyticsService {

    private final AdminAnalyticsRepository analyticsRepository;
    private final NotificationRepository notificationRepository;

    public AdminAnalyticsService(AdminAnalyticsRepository analyticsRepository,
                                 NotificationRepository notificationRepository) {
        this.analyticsRepository = analyticsRepository;
        this.notificationRepository = notificationRepository;
    }

    public AdminAnalyticsOverviewResponse getOverview(String period, String fromStr, String toStr) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        long periodDays;

        if ("7d".equalsIgnoreCase(period)) {
            periodDays = 7;
            startDate = endDate.minusDays(6);
        } else if ("90d".equalsIgnoreCase(period)) {
            periodDays = 90;
            startDate = endDate.minusDays(89);
        } else if ("12m".equalsIgnoreCase(period)) {
            periodDays = 365;
            startDate = endDate.minusDays(364);
        } else if ("custom".equalsIgnoreCase(period) || (fromStr != null && toStr != null)) {
            period = "custom";
            startDate = LocalDate.parse(fromStr, DateTimeFormatter.ISO_LOCAL_DATE);
            endDate = LocalDate.parse(toStr, DateTimeFormatter.ISO_LOCAL_DATE);
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("Start date cannot be after end date");
            }
            periodDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        } else {
            // Default 30d
            period = "30d";
            periodDays = 30;
            startDate = endDate.minusDays(29);
        }

        LocalDate prevEndDate = startDate.minusDays(1);
        LocalDate prevStartDate = prevEndDate.minusDays(periodDays - 1);

        LocalDateTime currentStartLdt = startDate.atStartOfDay();
        LocalDateTime currentEndLdt = endDate.atTime(LocalTime.MAX);
        Instant currentStartInst = currentStartLdt.toInstant(ZoneOffset.UTC);
        Instant currentEndInst = currentEndLdt.toInstant(ZoneOffset.UTC);

        LocalDateTime prevStartLdt = prevStartDate.atStartOfDay();
        LocalDateTime prevEndLdt = prevEndDate.atTime(LocalTime.MAX);
        Instant prevStartInst = prevStartLdt.toInstant(ZoneOffset.UTC);
        Instant prevEndInst = prevEndLdt.toInstant(ZoneOffset.UTC);

        // 1. User Metrics
        long totalUsers = analyticsRepository.countTotalUsers();
        long totalBuyers = analyticsRepository.countUsersByRole("USER");
        long totalSuppliersInUsers = analyticsRepository.countUsersByRole("SUPPLIER");
        long activeUsers = analyticsRepository.countUsersByStatus("ACTIVE");
        long suspendedUsers = analyticsRepository.countUsersByStatus("SUSPENDED");
        long pendingUsers = analyticsRepository.countUsersByStatus("PENDING");
        long unverifiedUsers = analyticsRepository.countUnverifiedEmailUsers();
        long periodUserRegs = analyticsRepository.countUserRegistrationsBetween(currentStartInst, currentEndInst);
        long prevUserRegs = analyticsRepository.countUserRegistrationsBetween(prevStartInst, prevEndInst);
        Double userGrowth = calculateGrowthPercentage(periodUserRegs, prevUserRegs);

        UserAnalyticsDto usersDto = new UserAnalyticsDto(
                totalUsers,
                totalBuyers,
                totalSuppliersInUsers,
                activeUsers,
                suspendedUsers,
                pendingUsers,
                unverifiedUsers,
                periodUserRegs,
                prevUserRegs,
                userGrowth
        );

        // 2. Supplier Metrics
        long totalSuppliers = analyticsRepository.countTotalSuppliers();
        long pendingSuppliers = analyticsRepository.countSuppliersByVerificationStatus("PENDING");
        long underReviewSuppliers = analyticsRepository.countSuppliersByVerificationStatus("UNDER_REVIEW");
        long infoRequiredSuppliers = analyticsRepository.countSuppliersByVerificationStatus("INFORMATION_REQUIRED");
        long verifiedSuppliers = analyticsRepository.countSuppliersByVerificationStatus("VERIFIED");
        long rejectedSuppliers = analyticsRepository.countSuppliersByVerificationStatus("REJECTED");
        long suspendedSuppliers = analyticsRepository.countSuppliersByVerificationStatus("SUSPENDED");
        long draftSuppliers = analyticsRepository.countSuppliersByVerificationStatus("DRAFT");
        long periodSupplierRegs = analyticsRepository.countSupplierRegistrationsBetween(currentStartLdt, currentEndLdt);

        SupplierAnalyticsDto suppliersDto = new SupplierAnalyticsDto(
                totalSuppliers,
                pendingSuppliers,
                underReviewSuppliers,
                infoRequiredSuppliers,
                verifiedSuppliers,
                rejectedSuppliers,
                suspendedSuppliers,
                draftSuppliers,
                periodSupplierRegs
        );

        // 3. Marketplace (RFQ & Quotation) Metrics
        long totalRfqs = analyticsRepository.countTotalRfqs();
        long openRfqs = analyticsRepository.countOpenRfqs();
        long acceptedRfqs = analyticsRepository.countRfqsByStatus("ACCEPTED");
        long rejectedRfqs = analyticsRepository.countRfqsByStatus("REJECTED");
        long closedRfqs = analyticsRepository.countRfqsByStatus("CLOSED");
        long cancelledRfqs = analyticsRepository.countRfqsByStatus("CANCELLED");
        long periodRfqs = analyticsRepository.countRfqsBetween(currentStartLdt, currentEndLdt);

        long totalQuotations = analyticsRepository.countTotalQuotations();
        long periodQuotations = analyticsRepository.countQuotationsBetween(currentStartLdt, currentEndLdt);
        long acceptedQuotations = analyticsRepository.countAcceptedQuotations();
        long rejectedQuotations = analyticsRepository.countRfqsByStatus("REJECTED");

        MarketplaceAnalyticsDto marketplaceDto = new MarketplaceAnalyticsDto(
                totalRfqs,
                openRfqs,
                acceptedRfqs,
                rejectedRfqs,
                closedRfqs,
                cancelledRfqs,
                periodRfqs,
                totalQuotations,
                periodQuotations,
                acceptedQuotations,
                rejectedQuotations
        );

        // 4. Order Metrics
        long totalOrders = analyticsRepository.countTotalOrders();
        long periodOrders = analyticsRepository.countOrdersBetween(currentStartLdt, currentEndLdt);
        long placedOrders = analyticsRepository.countOrdersByStatus("PLACED");
        long confirmedOrders = analyticsRepository.countOrdersByStatus("CONFIRMED");
        long processingOrders = analyticsRepository.countOrdersByStatus("PROCESSING");
        long shippedOrders = analyticsRepository.countOrdersByStatus("SHIPPED");
        long deliveredOrders = analyticsRepository.countOrdersByStatus("DELIVERED");
        long completedOrders = analyticsRepository.countOrdersByStatus("COMPLETED");
        long cancelledOrders = analyticsRepository.countOrdersByStatus("CANCELLED");
        long rejectedOrders = analyticsRepository.countOrdersByStatus("REJECTED");

        OrderAnalyticsDto ordersDto = new OrderAnalyticsDto(
                totalOrders,
                periodOrders,
                placedOrders,
                confirmedOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                completedOrders,
                cancelledOrders,
                rejectedOrders
        );

        // 5. Commercial Metrics (GMV)
        BigDecimal totalGmv = analyticsRepository.sumTotalGmv().setScale(2, RoundingMode.HALF_UP);
        BigDecimal periodGmv = analyticsRepository.sumPeriodGmv(currentStartLdt, currentEndLdt).setScale(2, RoundingMode.HALF_UP);
        BigDecimal prevGmv = analyticsRepository.sumPeriodGmv(prevStartLdt, prevEndLdt).setScale(2, RoundingMode.HALF_UP);
        Double gmvGrowth = calculateGmvGrowthPercentage(periodGmv, prevGmv);
        BigDecimal averageOrderValue = analyticsRepository.averageOrderValue().setScale(2, RoundingMode.HALF_UP);

        Double rfqToQuoteConversion = calculateConversionRate(totalQuotations, totalRfqs);
        Double quoteToOrderConversion = calculateConversionRate(totalOrders, totalQuotations);
        Double rfqToOrderConversion = calculateConversionRate(totalOrders, totalRfqs);

        CommercialAnalyticsDto commercialDto = new CommercialAnalyticsDto(
                totalGmv,
                periodGmv,
                prevGmv,
                gmvGrowth,
                averageOrderValue,
                rfqToQuoteConversion,
                quoteToOrderConversion,
                rfqToOrderConversion
        );

        // 6. Shipment Metrics
        long totalShipments = analyticsRepository.countTotalShipments();
        long activeShipments = analyticsRepository.countActiveShipments();
        long deliveredShipments = analyticsRepository.countDeliveredShipments();
        long delayedShipments = analyticsRepository.countDelayedShipments();

        ShipmentAnalyticsDto shipmentsDto = new ShipmentAnalyticsDto(
                totalShipments,
                activeShipments,
                deliveredShipments,
                delayedShipments
        );

        // 7. Funnel Calculation
        MarketplaceFunnelDto funnelDto = buildMarketplaceFunnel(totalRfqs, totalQuotations, acceptedQuotations, totalOrders, completedOrders);

        // 8. Trends Calculation
        AnalyticsTrendsDto trendsDto = buildTrends(startDate, endDate, currentStartInst, currentEndInst, currentStartLdt, currentEndLdt);

        // 9. Operational Action Center Counters
        List<ActionCenterCounterDto> actionCenter = buildActionCenter(pendingSuppliers, suspendedUsers, openRfqs, activeShipments, delayedShipments);

        // 10. Recent Platform Activity
        List<RecentActivityDto> recentActivity = buildRecentActivity();

        return new AdminAnalyticsOverviewResponse(
                period,
                startDate.toString(),
                endDate.toString(),
                prevStartDate.toString(),
                prevEndDate.toString(),
                usersDto,
                suppliersDto,
                marketplaceDto,
                ordersDto,
                commercialDto,
                shipmentsDto,
                funnelDto,
                trendsDto,
                actionCenter,
                recentActivity
        );
    }

    private MarketplaceFunnelDto buildMarketplaceFunnel(long rfqs, long quotes, long accepted, long orders, long completed) {
        List<FunnelStageDto> stages = new ArrayList<>();

        double rfqConv = 100.0;
        stages.add(new FunnelStageDto("RFQS_CREATED", "RFQs Created", rfqs, rfqConv, 0.0));

        double quoteConv = calculateConversionRate(quotes, rfqs);
        double quoteDrop = Math.max(0.0, 100.0 - quoteConv);
        stages.add(new FunnelStageDto("QUOTATIONS_SUBMITTED", "Quotations Submitted", quotes, quoteConv, quoteDrop));

        double acceptConv = calculateConversionRate(accepted, quotes);
        double acceptDrop = Math.max(0.0, 100.0 - acceptConv);
        stages.add(new FunnelStageDto("QUOTATIONS_ACCEPTED", "Quotations Accepted", accepted, acceptConv, acceptDrop));

        double orderConv = calculateConversionRate(orders, accepted);
        double orderDrop = Math.max(0.0, 100.0 - orderConv);
        stages.add(new FunnelStageDto("ORDERS_PLACED", "Purchase Orders Placed", orders, orderConv, orderDrop));

        double compConv = calculateConversionRate(completed, orders);
        double compDrop = Math.max(0.0, 100.0 - compConv);
        stages.add(new FunnelStageDto("ORDERS_COMPLETED", "Orders Completed", completed, compConv, compDrop));

        double overallConversion = calculateConversionRate(completed, rfqs);

        return new MarketplaceFunnelDto(stages, overallConversion);
    }

    private AnalyticsTrendsDto buildTrends(LocalDate start, LocalDate end, Instant startInst, Instant endInst, LocalDateTime startLdt, LocalDateTime endLdt) {
        Map<LocalDate, Long> userTrendsMap = analyticsRepository.getUserRegistrationTrends(startInst, endInst);
        Map<LocalDate, Long> rfqTrendsMap = analyticsRepository.getRfqTrends(startLdt, endLdt);
        Map<LocalDate, Long> quoteTrendsMap = analyticsRepository.getQuotationTrends(startLdt, endLdt);
        Map<LocalDate, Long> orderTrendsMap = analyticsRepository.getOrderTrends(startLdt, endLdt);
        Map<LocalDate, BigDecimal> gmvTrendsMap = analyticsRepository.getGmvTrends(startLdt, endLdt);

        List<DataPointDto> userRegList = new ArrayList<>();
        List<DataPointDto> rfqList = new ArrayList<>();
        List<DataPointDto> quoteList = new ArrayList<>();
        List<DataPointDto> orderList = new ArrayList<>();
        List<DataPointDto> gmvList = new ArrayList<>();

        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            String dateStr = cursor.toString();
            userRegList.add(new DataPointDto(dateStr, userTrendsMap.getOrDefault(cursor, 0L).doubleValue()));
            rfqList.add(new DataPointDto(dateStr, rfqTrendsMap.getOrDefault(cursor, 0L).doubleValue()));
            quoteList.add(new DataPointDto(dateStr, quoteTrendsMap.getOrDefault(cursor, 0L).doubleValue()));
            orderList.add(new DataPointDto(dateStr, orderTrendsMap.getOrDefault(cursor, 0L).doubleValue()));
            BigDecimal gmv = gmvTrendsMap.getOrDefault(cursor, BigDecimal.ZERO);
            gmvList.add(new DataPointDto(dateStr, gmv.doubleValue()));

            cursor = cursor.plusDays(1);
        }

        return new AnalyticsTrendsDto(userRegList, rfqList, quoteList, orderList, gmvList);
    }

    private List<ActionCenterCounterDto> buildActionCenter(long pendingSuppliers, long suspendedUsers, long openRfqs, long activeShipments, long delayedShipments) {
        List<ActionCenterCounterDto> list = new ArrayList<>();

        long pendingAppeals = analyticsRepository.countAppealsByStatus("SUBMITTED");
        long infoReqAppeals = analyticsRepository.countAppealsByStatus("INFORMATION_REQUIRED");

        if (pendingAppeals > 0) {
            list.add(new ActionCenterCounterDto(
                    "act-appeal-pending",
                    "ACCOUNT_GOVERNANCE",
                    "HIGH",
                    "Pending Suspension Appeals",
                    "Formal account appeals awaiting initial administrative review",
                    pendingAppeals,
                    "/dashboard/admin/account-governance"
            ));
        }

        if (infoReqAppeals > 0) {
            list.add(new ActionCenterCounterDto(
                    "act-appeal-info",
                    "ACCOUNT_GOVERNANCE",
                    "MEDIUM",
                    "Appeals Awaiting User Response",
                    "Appeals in information required status pending user submission",
                    infoReqAppeals,
                    "/dashboard/admin/account-governance"
            ));
        }

        if (pendingSuppliers > 0) {
            list.add(new ActionCenterCounterDto(
                    "act-sup",
                    "SUPPLIER_VERIFICATION",
                    "HIGH",
                    "Suppliers Awaiting Verification",
                    "Supplier accounts pending compliance and credential review",
                    pendingSuppliers,
                    "/dashboard/admin/suppliers"
            ));
        }

        if (suspendedUsers > 0) {
            list.add(new ActionCenterCounterDto(
                    "act-susp",
                    "USER_GOVERNANCE",
                    "MEDIUM",
                    "Suspended User Accounts",
                    "Users currently suspended from platform operations",
                    suspendedUsers,
                    "/dashboard/admin/account-governance"
            ));
        }

        if (openRfqs > 0) {
            list.add(new ActionCenterCounterDto(
                    "act-rfq",
                    "MARKETPLACE_ACTIVITY",
                    "LOW",
                    "Active Open RFQs",
                    "Requests for quotation currently open for supplier bidding",
                    openRfqs,
                    "/dashboard/admin/transactions/rfqs"
            ));
        }

        if (delayedShipments > 0) {
            list.add(new ActionCenterCounterDto(
                    "act-ship-delayed",
                    "OPERATIONS_LOGISTICS",
                    "HIGH",
                    "Delayed Active Shipments",
                    "Shipments past estimated delivery date requiring operational follow-up",
                    delayedShipments,
                    "/dashboard/admin/transactions/orders"
            ));
        } else if (activeShipments > 0) {
            list.add(new ActionCenterCounterDto(
                    "act-ship-active",
                    "OPERATIONS_LOGISTICS",
                    "LOW",
                    "Active In-Transit Shipments",
                    "Orders currently in processing or in transit",
                    activeShipments,
                    "/dashboard/admin/transactions/orders"
            ));
        }

        return list;
    }

    private List<RecentActivityDto> buildRecentActivity() {
        List<RecentActivityDto> list = new ArrayList<>();

        try {
            List<Notification> notifications = notificationRepository.findAll(
                    PageRequest.of(0, 15, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent();

            for (Notification n : notifications) {
                String link = resolveEntityLink(n.getEntityType() != null ? n.getEntityType().name() : null, n.getEntityId());
                list.add(new RecentActivityDto(
                        n.getId().toString(),
                        n.getType() != null ? n.getType().name() : "SYSTEM_EVENT",
                        n.getTitle(),
                        n.getMessage(),
                        n.getEntityType() != null ? n.getEntityType().name() : "NOTIFICATION",
                        n.getEntityId() != null ? n.getEntityId().toString() : null,
                        "System",
                        "PLATFORM",
                        n.getCreatedAt(),
                        link
                ));
            }
        } catch (Exception e) {
            // Graceful fallback if notifications table is empty
        }

        return list;
    }

    private String resolveEntityLink(String entityType, UUID entityId) {
        if (entityType == null || entityId == null) {
            return null;
        }
        return switch (entityType) {
            case "RFQ" -> "/dashboard/admin/transactions/rfqs";
            case "PURCHASE_ORDER", "ORDER" -> "/dashboard/admin/transactions/orders";
            case "SUPPLIER" -> "/dashboard/admin/suppliers";
            case "USER" -> "/dashboard/admin/users";
            case "ACCOUNT_SUSPENSION", "ACCOUNT_SUSPENSION_APPEAL" -> "/dashboard/admin/account-governance";
            default -> null;
        };
    }

    public static Double calculateGrowthPercentage(long current, long previous) {
        if (previous == 0) {
            return null;
        }
        double change = ((double) current - (double) previous) / (double) previous * 100.0;
        return Math.round(change * 10.0) / 10.0;
    }

    public static Double calculateGmvGrowthPercentage(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        BigDecimal diff = current.subtract(previous);
        BigDecimal pct = diff.divide(previous, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        return pct.setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    public static Double calculateConversionRate(long numerator, long denominator) {
        if (denominator == 0) {
            return 0.0;
        }
        double rate = ((double) numerator / (double) denominator) * 100.0;
        return Math.round(rate * 10.0) / 10.0;
    }
}
