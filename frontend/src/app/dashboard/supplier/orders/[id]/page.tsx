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
} from "@/features/order/api/fulfillment";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";
import { useToast } from "@/shared/context/ToastContext";
import {
  ProcurementBreadcrumb,
  ProcurementHero,
  CommercialMetricRibbon,
  WorkflowStepper,
  ShipmentTrackingCard,
} from "@/shared/components/procurement/ProcurementUI";
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
                className="h-11 px-4 border border-[#DFE1E6] hover:border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming || actionLoading}
                className="h-11 px-6 bg-[#00875A] hover:bg-[#006644] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{confirming ? "Confirming..." : "Confirm & Accept PO"}</span>
              </button>
            </div>
          ) : order.status === "CONFIRMED" ? (
            <button
              type="button"
              onClick={handleStartProcessing}
              disabled={actionLoading}
              className="h-11 px-6 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{actionLoading ? "Updating..." : "Start Batch Processing"}</span>
            </button>
          ) : order.status === "PROCESSING" ? (
            <button
              type="button"
              onClick={() => setShowShipModal(true)}
              disabled={actionLoading}
              className="h-11 px-6 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch Consignment →</span>
            </button>
          ) : order.status === "SHIPPED" ? (
            <button
              type="button"
              onClick={handleMarkDelivered}
              disabled={actionLoading}
              className="h-11 px-6 bg-[#00875A] hover:bg-[#006644] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionLoading ? "Updating..." : "Mark Delivered"}</span>
            </button>
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

      {/* 5. 2-Column Order Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 Cols): Logistics, Immutable Terms, Documents */}
        <div className="lg:col-span-8 space-y-6">
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
          <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFE1E6] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#0052CC]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#091E42]">
                  Buyer Shipping Address & Logistics Notes
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#006644] bg-[#E3FCEF] px-2 py-0.5 rounded uppercase">
                Binding Order
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#FAFBFC] rounded-xl border border-[#DFE1E6] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
                  Delivery / Consignment Destination
                </span>
                <p className="font-medium text-[#172B4D] leading-relaxed whitespace-pre-wrap">
                  {order.shippingAddress}
                </p>
              </div>

              <div className="p-4 bg-[#FAFBFC] rounded-xl border border-[#DFE1E6] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block">
                  Billing & Accounts Contact
                </span>
                <p className="font-medium text-[#172B4D] leading-relaxed whitespace-pre-wrap">
                  {order.billingContact}
                </p>
              </div>
            </div>

            {order.notes && (
              <div className="p-4 bg-[#FAFBFC] rounded-xl border border-[#DFE1E6] text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6C84] block mb-1">
                  Buyer Instructions & Receiving Remarks
                </span>
                <p className="text-[#172B4D] italic">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Document Vault */}
          <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 sm:p-6 shadow-xs">
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
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-3">
              Fulfillment Milestones
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#5E6C84]">Placed Date</span>
                <span className="font-mono font-bold text-[#091E42]">
                  {new Date(order.placedAt).toLocaleDateString("en-GB")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5E6C84]">Confirmed Date</span>
                <span className="font-mono font-bold text-[#091E42]">
                  {order.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString("en-GB") : "Pending"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5E6C84]">Dispatched Date</span>
                <span className="font-mono font-bold text-[#091E42]">
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
                className="w-full h-11 bg-[#00875A] hover:bg-[#006644] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{confirming ? "Confirming..." : "Confirm & Accept PO"}</span>
              </button>
            )}

            {order.status === "CONFIRMED" && (
              <button
                type="button"
                onClick={handleStartProcessing}
                disabled={actionLoading}
                className="w-full h-11 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>{actionLoading ? "Updating..." : "Start Batch Processing"}</span>
              </button>
            )}

            {order.status === "PROCESSING" && (
              <button
                type="button"
                onClick={() => setShowShipModal(true)}
                className="w-full h-11 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>Dispatch Consignment</span>
              </button>
            )}
          </div>

          {/* Sourcing Reference */}
          <div className="bg-white border border-[#DFE1E6] rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-2">
              Sourcing Reference
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-[#5E6C84]">RFQ Reference</span>
              <Link
                href={`/dashboard/supplier/rfqs/${order.rfqId}`}
                className="font-mono font-bold text-[#0052CC] hover:underline"
              >
                RFQ-{order.rfqId.substring(0, 8).toUpperCase()} →
              </Link>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5E6C84]">Chemical Grade</span>
              <span className="font-bold text-[#091E42] uppercase">{order.unit} Bulk Supply</span>
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
    </div>
  );
}
