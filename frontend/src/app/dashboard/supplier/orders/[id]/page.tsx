"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
import { confirmOrder } from "@/features/order/api/confirmOrder";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { ShipOrderModal } from "@/features/order/components/ShipOrderModal";
import { RejectOrderModal } from "@/features/order/components/RejectOrderModal";
import {
  ShipmentResponse,
  getShipment,
  startProcessingSupplierOrder,
  shipSupplierOrder,
  markOrderDeliveredSupplier,
  rejectSupplierOrder,
  completeOrder,
} from "@/features/order/api/fulfillment";
import { CompleteOrderModal } from "@/features/order/components/CompleteOrderModal";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";
import { useToast } from "@/shared/context/ToastContext";
import {
  ProcurementBreadcrumb,
  ProcurementHero,
  CommercialMetricRibbon,
  WorkflowStepper,
  ShipmentTrackingCard,
} from "@/shared/components/procurement/ProcurementUI";
import { TransactionTimeline } from "@/shared/components/procurement/TransactionTimeline";
import {
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  FileCheck2,
  Package,
  Play,
  Send,
  XCircle,
} from "lucide-react";

export default function SupplierOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<PurchaseOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fulfillment State
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const toast = useToast();

  const loadOrder = useCallback(async (silent = false) => {
    if (!orderId) return;
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const orders = await getSupplierOrders();
      const matching = orders.find((o) => o.id === orderId);
      if (!matching) {
        throw new Error("Order not found or access unauthorized.");
      }
      setOrder(matching);

      if (matching.status === "SHIPPED" || matching.status === "DELIVERED") {
        getShipment(matching.id)
          .then((s) => setShipment(s))
          .catch(() => {});
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder(false);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadOrder(true);
      }
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadOrder(true);
      }
    };

    const handleWindowFocus = () => {
      loadOrder(true);
    };

    const handleOrderUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ orderId?: string }>;
      if (!customEvt.detail?.orderId || customEvt.detail.orderId === orderId) {
        loadOrder(true);
      }
    };

    const handleNotificationsUpdate = () => {
      loadOrder(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("order-updated", handleOrderUpdate);
    window.addEventListener("notifications-updated", handleNotificationsUpdate);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("order-updated", handleOrderUpdate);
      window.removeEventListener("notifications-updated", handleNotificationsUpdate);
    };
  }, [loadOrder, orderId]);

  const handleConfirm = async () => {
    if (!order) return;
    try {
      setConfirming(true);
      const updated = await confirmOrder(order.id);
      setOrder(updated);
      toast.success("Purchase order confirmed successfully.");
      await loadOrder(true);
      window.dispatchEvent(new CustomEvent("order-updated", { detail: { orderId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to confirm order";
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const handleStartProcessing = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await startProcessingSupplierOrder(order.id);
      setOrder(updated);
      toast.success("Order status updated to processing.");
      await loadOrder(true);
      window.dispatchEvent(new CustomEvent("order-updated", { detail: { orderId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start processing";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipSuccess = async (trackingData: { carrier: string; trackingNumber: string }) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await shipSupplierOrder(order.id, trackingData);
      setOrder(updated);
      setShowShipModal(false);
      toast.success("Order marked as dispatched.");
      await loadOrder(true);
      window.dispatchEvent(new CustomEvent("order-updated", { detail: { orderId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch order";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await markOrderDeliveredSupplier(order.id);
      setOrder(updated);
      toast.success("Order marked as delivered.");
      await loadOrder(true);
      window.dispatchEvent(new CustomEvent("order-updated", { detail: { orderId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update delivery";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await completeOrder(order.id);
      setOrder(updated);
      setShowCompleteModal(false);
      toast.success("Purchase order marked as completed & settled.");
      await loadOrder(true);
      window.dispatchEvent(new CustomEvent("order-updated", { detail: { orderId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to complete purchase order";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await rejectSupplierOrder(order.id, reason);
      setOrder(updated);
      setShowRejectModal(false);
      toast.success("Purchase order rejected.");
      await loadOrder(true);
      window.dispatchEvent(new CustomEvent("order-updated", { detail: { orderId } }));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reject order";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1560px] mx-auto p-8 min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono font-bold text-[#5E6C84] uppercase tracking-wider">
          Loading Supplier Order Desk...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-[1560px] mx-auto p-8">
        <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-[#091E42]">Order Unavailable</h2>
          <p className="text-xs text-[#5E6C84]">{error || "Order record could not be retrieved."}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/dashboard/supplier/orders"
              className="px-4 py-2 border border-[#DFE1E6] text-xs font-bold rounded-xl"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isDeliveredOrShipped = order.status === "SHIPPED" || order.status === "DELIVERED";

  return (
    <div className="max-w-[1560px] mx-auto space-y-6 pb-20">
      {/* 1. Breadcrumb Navigation */}
      <ProcurementBreadcrumb
        items={[
          { label: "Supplier Desk", href: "/dashboard/supplier" },
          { label: "Fulfillment Orders", href: "/dashboard/supplier/orders" },
          { label: order.poNumber },
        ]}
      />

      {/* 2. Primary PO Hero */}
      <ProcurementHero
        eyebrow="SUPPLIER FULFILLMENT DESK"
        referenceNumber={order.poNumber}
        title={order.productName || "Specialty Chemical Material"}
        subtitle={`Linked to RFQ Reference: RFQ-${order.rfqId.substring(0, 8).toUpperCase()}`}
        status={order.status}
        date={new Date(order.placedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        counterpartLabel="Purchasing Organization"
        counterpartName="Verified Enterprise Buyer"
        primaryAction={
          order.status === "PLACED" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={confirming || actionLoading}
                className="h-8 px-3 border border-[#E4E4E7] hover:border-rose-300 text-[#DC2626] hover:bg-[#FEF2F2] text-xs font-medium rounded-[6px] transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming || actionLoading}
                className="h-8 px-3.5 bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] text-white text-xs font-medium rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{confirming ? "Confirming..." : "Confirm & Accept PO"}</span>
              </button>
            </div>
          ) : order.status === "CONFIRMED" ? (
            <button
              type="button"
              onClick={handleStartProcessing}
              disabled={actionLoading}
              className="h-8 px-3.5 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{actionLoading ? "Updating..." : "Start Batch Processing"}</span>
            </button>
          ) : order.status === "PROCESSING" ? (
            <button
              type="button"
              onClick={() => setShowShipModal(true)}
              disabled={actionLoading}
              className="h-8 px-3.5 bg-[#0052CC] hover:bg-[#0747A6] active:bg-[#003884] text-white text-xs font-medium rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Dispatch Consignment →</span>
            </button>
          ) : order.status === "SHIPPED" ? (
            <button
              type="button"
              onClick={handleMarkDelivered}
              disabled={actionLoading}
              className="h-8 px-3.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{actionLoading ? "Updating..." : "Mark Delivered"}</span>
            </button>
          ) : order.status === "DELIVERED" ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] text-[#059669] text-xs font-medium rounded-[4px] font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Delivered</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModal(true)}
                disabled={actionLoading}
                className="h-8 px-3.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium rounded-[6px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Order</span>
              </button>
            </div>
          ) : order.status === "COMPLETED" ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] text-[#059669] text-xs font-medium rounded-[4px] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Order Completed & Settled</span>
            </div>
          ) : null
        }
      />

      {/* 3. Financial Commercial Ribbon */}
      <CommercialMetricRibbon
        metrics={[
          {
            label: "Gross Contract Value",
            value: `${order.currency} ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtext: "Receivable commercial amount",
            highlight: true,
          },
          {
            label: "Order Volume",
            value: `${order.quantity.toLocaleString()} ${order.unit.toUpperCase()}`,
            subtext: "Production consignment",
          },
          {
            label: "Contracted Unit Price",
            value: `${order.currency} ${order.unitPrice.toFixed(2)}`,
            subtext: `Per ${order.unit.toUpperCase()}`,
          },
          {
            label: "Committed Lead Time",
            value: order.agreedLeadTimeDays ? `${order.agreedLeadTimeDays} Days` : "Standard",
            subtext: "Agreed fulfillment SLA",
          },
          {
            label: "Order Placement Date",
            value: new Date(order.placedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
            subtext: "PO issuance date",
          },
        ]}
      />

      {/* 4. Workflow Lifecycle Stepper */}
      <WorkflowStepper currentStatus={order.status} />

      {/* 4b. Unified End-to-End Transaction Timeline */}
      <TransactionTimeline
        order={order}
        shipment={shipment}
        userRole="SUPPLIER"
      />

      {/* 5. 2-Column Order Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left (8 Cols): Logistics, Immutable Terms, Documents */}
        <div className="lg:col-span-8 space-y-5">
          {/* Shipment Tracking Card (if dispatched) */}
          {shipment && isDeliveredOrShipped && (
            <ShipmentTrackingCard
              carrier={shipment.carrier}
              trackingNumber={shipment.trackingNumber}
              shippedAt={shipment.shippedAt}
              estimatedDeliveryDate={shipment.estimatedDeliveryDate}
              status={order.status}
            />
          )}

          {/* Immutable Contract Snapshot */}
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 shadow-tactile-card space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2.5">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#0052CC]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono">
                  Buyer Shipping Address & Logistics Instructions
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-[#059669] bg-[#ECFDF5] border border-[rgba(5,150,105,0.2)] px-2 py-0.5 rounded-[4px] uppercase">
                Binding Order
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAFAFA] rounded-[6px] border border-[#E4E4E7] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] font-mono block">
                  Delivery Destination
                </span>
                <p className="text-xs text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                  {order.shippingAddress}
                </p>
              </div>

              <div className="p-3 bg-[#FAFAFA] rounded-[6px] border border-[#E4E4E7] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] font-mono block">
                  Billing & Accounts Contact
                </span>
                <p className="text-xs text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                  {order.billingContact}
                </p>
              </div>
            </div>

            {order.notes && (
              <div className="p-3 bg-[#FAFAFA] rounded-[6px] border border-[#E4E4E7] text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] font-mono block mb-0.5">
                  Buyer Instructions & Receiving Remarks
                </span>
                <p className="text-xs text-[#475569] italic">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Document Vault */}
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-5 shadow-tactile-card">
            <GenericDocumentManager
              title="Official Order & Compliance Documents"
              description="Upload commercial invoices, certificates of analysis (COA), test certificates, and dispatch waybills for the buyer."
              ownerType="PURCHASE_ORDER"
              ownerId={order.id}
              canUpload={true}
              canDelete={true}
              allowedCategories={[
                { value: "INVOICE", label: "Commercial Invoice" },
                { value: "WAYBILL", label: "Bill of Lading / Waybill" },
                { value: "PACKING_SLIP", label: "Packing Slip / Delivery Receipt" },
                { value: "COA", label: "Certificate of Analysis (COA)" },
              ]}
              emptyMessage="No documents attached to this purchase order."
            />
          </div>
        </div>

        {/* Right Sidebar (4 Cols): Operational Actions & Milestones */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-tactile-card space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono border-b border-[#E4E4E7] pb-2">
              Fulfillment Milestones
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Placed Date</span>
                <span className="font-mono font-medium text-[#0F172A]">
                  {new Date(order.placedAt).toLocaleDateString("en-GB")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Confirmed Date</span>
                <span className="font-mono font-medium text-[#0F172A]">
                  {order.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString("en-GB") : "Pending"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Dispatched Date</span>
                <span className="font-mono font-medium text-[#0F172A]">
                  {order.shippedAt ? new Date(order.shippedAt).toLocaleDateString("en-GB") : "Pending"}
                </span>
              </div>
            </div>

            {/* Contextual Action Button */}
            {order.status === "PLACED" && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full h-8 bg-[#059669] hover:bg-[#047857] text-white font-medium text-xs rounded-[6px] transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{confirming ? "Confirming..." : "Confirm & Accept PO"}</span>
              </button>
            )}

            {order.status === "CONFIRMED" && (
              <button
                type="button"
                onClick={handleStartProcessing}
                disabled={actionLoading}
                className="w-full h-8 bg-[#0052CC] hover:bg-[#0747A6] text-white font-medium text-xs rounded-[6px] transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{actionLoading ? "Updating..." : "Start Batch Processing"}</span>
              </button>
            )}

            {order.status === "PROCESSING" && (
              <button
                type="button"
                onClick={() => setShowShipModal(true)}
                disabled={actionLoading}
                className="w-full h-8 bg-[#0052CC] hover:bg-[#0747A6] text-white font-medium text-xs rounded-[6px] transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Dispatch Consignment</span>
              </button>
            )}
          </div>

          {/* Sourcing Reference */}
          <div className="bg-white border border-[#E4E4E7] rounded-[8px] p-4 shadow-tactile-card space-y-2.5 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A] font-mono border-b border-[#E4E4E7] pb-2">
              Sourcing Reference
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">RFQ Reference</span>
              <Link
                href={`/dashboard/supplier/rfqs/${order.rfqId}`}
                className="font-mono font-medium text-[#0052CC] hover:underline"
              >
                RFQ-{order.rfqId.substring(0, 8).toUpperCase()} →
              </Link>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Chemical Spec</span>
              <span className="font-medium text-[#0F172A] uppercase">{order.unit} Consignment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showShipModal && (
        <ShipOrderModal
          orderId={order.id}
          poNumber={order.poNumber}
          onClose={() => setShowShipModal(false)}
          onSubmit={async (data) => {
            await handleShipSuccess({ carrier: data.carrier, trackingNumber: data.trackingNumber });
          }}
        />
      )}

      {showRejectModal && (
        <RejectOrderModal
          isOpen={showRejectModal}
          poNumber={order.poNumber}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleRejectConfirm}
        />
      )}

      {/* Complete Order Modal */}
      {order && (
        <CompleteOrderModal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          onConfirm={handleCompleteOrder}
          poNumber={order.poNumber}
          counterpartLabel="Buyer Organization"
          counterpartName="Verified Enterprise Buyer"
          productName={order.productName}
          quantity={order.quantity}
          unit={order.unit}
          totalAmount={order.totalAmount}
          currency={order.currency}
        />
      )}
    </div>
  );
}
