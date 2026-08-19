"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupplierOrders } from "@/features/order/api/getSupplierOrders";
import { confirmOrder } from "@/features/order/api/confirmOrder";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { ShipOrderModal } from "@/features/order/components/ShipOrderModal";
import { RejectOrderModal } from "@/features/order/components/RejectOrderModal";
import { 
  ShipmentResponse, 
  ShipOrderRequest, 
  getShipment, 
  startProcessingSupplierOrder, 
  shipSupplierOrder, 
  markOrderDeliveredSupplier,
  rejectSupplierOrder 
} from "@/features/order/api/fulfillment";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";
import { useToast } from "@/shared/context/ToastContext";

export default function SupplierOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<PurchaseOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fulfillment State
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const toast = useToast();

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const orders = await getSupplierOrders();
      const matching = orders.find((o) => o.id === orderId);
      if (!matching) {
        throw new Error("Order not found or unauthorized");
      }
      setOrder(matching);
      
      if (matching.status === "SHIPPED" || matching.status === "DELIVERED") {
        await loadShipment(matching.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const loadShipment = async (id: string) => {
    try {
      setShipmentLoading(true);
      const data = await getShipment(id);
      setShipment(data);
    } catch (err) {
      console.error("Failed to load shipment details:", err);
    } finally {
      setShipmentLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleConfirm = async () => {
    if (!order) return;
    try {
      setConfirming(true);
      const updated = await confirmOrder(order.id);
      setOrder(updated);
      toast.success("Purchase order confirmed.");
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
      toast.success("Order moved to active processing.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start processing";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async (reason: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await rejectSupplierOrder(order.id, reason);
      setOrder(updated);
      setShowRejectModal(false);
      toast.success("Order rejected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject order");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipOrder = async (data: ShipOrderRequest) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await shipSupplierOrder(order.id, data);
      setOrder(updated);
      await loadShipment(order.id);
      setShowShipModal(false);
      toast.success("Order marked as shipped. Tracking details recorded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ship order");
      throw err;
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to mark delivered";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const getSemanticStatusClass = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "text-teal-600";
      case "PLACED": return "text-orange-500";
      case "CANCELLED": return "text-red-700";
      case "PROCESSING": return "text-blue-600";
      case "SHIPPED": return "text-indigo-600";
      case "DELIVERED": return "text-green-600";
      default: return "text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center bg-white">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
          LOADING ORDER DOCUMENT...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto bg-white min-h-screen">
        <div className="border-l-[3px] border-orange-500 pl-4 py-1 mb-8">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">System Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">{error || "Order not found"}</p>
        </div>
        <Link
          href="/dashboard/supplier/orders"
          className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
        >
          ← BACK TO FULFILLMENT REGISTER
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
      <div className="max-w-[1024px] mx-auto px-6 lg:px-12 py-10">

        {/* =========================================
            1. DOCUMENT HEADER
            ========================================= */}
        <header className="border-t-[3px] border-[#0A192F] pt-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-2xl">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                SUPPLIER OPERATIONS / PURCHASE ORDER
              </span>
              <h1 className="text-4xl lg:text-5xl font-mono font-bold text-[#0A192F] tracking-tighter mb-2">
                {order.poNumber}
              </h1>
            </div>
            
            <div className="shrink-0 flex flex-col md:items-end gap-1 md:pl-4 py-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                STATUS
              </span>
              <span className={`text-sm font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>
        </header>

        {/* =========================================
            2. DOCUMENT META BAND
            ========================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center border-y border-slate-200 py-3 mb-12 gap-y-4 gap-x-8">
          <div className="flex-1 sm:border-r border-slate-200 sm:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">PO NUMBER</span>
            <span className="font-mono text-xs font-semibold text-[#0A192F]">{order.poNumber}</span>
          </div>
          <div className="flex-1 sm:border-r border-slate-200 sm:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">ORDER DATE</span>
            <span className="font-mono text-xs font-semibold text-[#0A192F]">
              {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 sm:border-r border-slate-200 sm:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">RFQ REFERENCE</span>
            <span className="font-mono text-xs font-semibold text-[#0A192F]">
              {`RFQ-${order.rfqId.substring(0, 8).toUpperCase()}`}
            </span>
          </div>
          <div className="flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">BUYER</span>
            <span className="text-xs font-bold text-[#0A192F] truncate block">
              Synthora Organization
            </span>
          </div>
        </div>

        {/* =========================================
            3. ACTION / FULFILLMENT CONTROL BLOCK
            ========================================= */}
        {order.status === "PLACED" && (
          <section className="mb-12 border-l-[3px] border-orange-500 bg-orange-50/30 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-2">
                  ACTION REQUIRED
                </span>
                <p className="text-sm font-medium text-slate-800">
                  Confirm this purchase order to acknowledge the procurement commitment and lock the fulfillment schedule, or reject if unable to fulfill.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={confirming || actionLoading}
                  className="px-4 py-3 bg-white border border-red-300 hover:border-red-600 text-red-600 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  REJECT ORDER
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirming || actionLoading}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {confirming ? "CONFIRMING..." : "CONFIRM PURCHASE ORDER"}
                </button>
              </div>
            </div>
          </section>
        )}

        {order.status === "CONFIRMED" && (
          <section className="mb-12 border-l-[3px] border-teal-500 bg-teal-50/30 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-700 mb-2">
                  CONFIRMED & READY FOR PROCESSING
                </span>
                <p className="text-sm font-medium text-slate-800">
                  Begin manufacturing, compounding, or lot reservation to move this purchase order to active processing.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-3 bg-white border border-red-300 hover:border-red-600 text-red-600 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  REJECT ORDER
                </button>
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "STARTING..." : "START PROCESSING"}
                </button>
              </div>
            </div>
          </section>
        )}

        {order.status === "PROCESSING" && (
          <section className="mb-12 border-l-[3px] border-blue-500 bg-blue-50/30 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">
                  ACTIVE FULFILLMENT / READY TO SHIP
                </span>
                <p className="text-sm font-medium text-slate-800">
                  Dispatch material lot and record logistics carrier and tracking metadata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShipModal(true)}
                disabled={actionLoading}
                className="shrink-0 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                MARK AS SHIPPED
              </button>
            </div>
          </section>
        )}

        {order.status === "SHIPPED" && (
          <section className="mb-12 border-l-[3px] border-indigo-500 bg-indigo-50/30 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-2">
                  DISPATCHED / IN TRANSIT
                </span>
                <p className="text-sm font-medium text-slate-800">
                  Material has been dispatched. You can mark as delivered or await buyer receipt confirmation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleMarkDelivered}
                disabled={actionLoading}
                className="shrink-0 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {actionLoading ? "UPDATING..." : "MARK AS DELIVERED"}
              </button>
            </div>
          </section>
        )}

        {order.status === "REJECTED" && (
          <section className="mb-12 border-l-[3px] border-red-600 bg-red-50 p-6 md:p-8">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">
              PURCHASE ORDER REJECTED
            </span>
            <p className="text-sm font-bold text-slate-900 mb-2">
              This order was rejected before fulfillment operations began.
            </p>
            {order.rejectionReason && (
              <div className="bg-white border border-red-200 p-4 mt-2">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">REASON</span>
                <p className="text-xs font-mono text-slate-800 italic">"{order.rejectionReason}"</p>
              </div>
            )}
          </section>
        )}

        <div className="space-y-16">
          
          {/* =========================================
              01 / ORDERED MATERIAL
              ========================================= */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
              <span className="text-slate-300">01 /</span> ORDERED MATERIAL
              <div className="h-px bg-slate-200 flex-1 ml-4" />
            </h2>

            <div className="border-b-[2px] border-[#0A192F] pb-4 mb-4">
              <h3 className="text-2xl font-bold text-[#0A192F] tracking-tight">
                {order.productName || "Specialty Chemical Raw Material"}
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">QUANTITY</span>
                <span className="font-mono text-lg font-bold text-[#0A192F]">
                  {order.quantity.toLocaleString()} {order.unit.toUpperCase()}
                </span>
              </div>
            </div>
          </section>

          {/* =========================================
              02 / COMMERCIAL TERMS
              ========================================= */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
              <span className="text-slate-300">02 /</span> COMMERCIAL TERMS
              <div className="h-px bg-slate-200 flex-1 ml-4" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 border-b border-slate-200 mb-6">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">UNIT PRICE</span>
                <span className="font-mono text-[11px] font-bold text-[#0A192F]">
                  {order.currency} {order.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CURRENCY</span>
                <span className="font-mono text-[11px] font-bold text-[#0A192F]">{order.currency}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">LEAD TIME</span>
                <span className="font-mono text-[11px] font-bold text-[#0A192F]">
                  {order.agreedLeadTimeDays ? `${order.agreedLeadTimeDays} DAYS` : "STANDARD"}
                </span>
              </div>
            </div>

            {/* COMMERCIAL VALUE HIGHLIGHT */}
            <div className="bg-slate-50 p-6 flex flex-col md:flex-row md:items-end justify-between border-l-[3px] border-[#0A192F]">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  TOTAL ORDER VALUE
                </span>
              </div>
              <div className="mt-2 md:mt-0 text-right">
                <span className="font-mono text-3xl font-bold text-[#0A192F] tracking-tighter block">
                  {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </section>

          {/* =========================================
                </h3>
                <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">
                  {order.billingContact}
                </p>
                {order.notes && (
                  <div className="border-l-[2px] border-slate-300 pl-4 py-1 mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">SPECIAL NOTES</p>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                      "{order.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =========================================
              04 / COMMERCIAL DOCUMENTS
              ========================================= */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
              <span className="text-slate-300">04 /</span> COMMERCIAL DOCUMENTS
              <div className="h-px bg-slate-200 flex-1 ml-4" />
            </h2>
            <div className="bg-white border border-slate-200 shadow-sm">
              <GenericDocumentManager
                title="Purchase Order Documents"
                description="Upload invoices and other commercial documents for the buyer."
                allowedCategories={[
                  { value: "PURCHASE_ORDER", label: "Purchase Order" },
                  { value: "TECHNICAL_SPECIFICATION", label: "Technical Specification" },
                  { value: "CERTIFICATION", label: "Certification" },
                  { value: "INVOICE", label: "Invoice" }
                ]}
                ownerType="PURCHASE_ORDER"
                ownerId={order.id}
                canUpload={true}
                canDelete={true}
              />
            </div>
          </section>

          {/* =========================================
              05 / SHIPMENT DOCUMENTS
              ========================================= */}
          {(order.status === "SHIPPED" || order.status === "DELIVERED") && shipment && (
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">05 /</span> SHIPMENT DOCUMENTS
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>
              <div className="bg-white border border-slate-200 shadow-sm">
                <GenericDocumentManager
                  title="Shipment Documents"
                  description="Upload packing lists and tracking proofs for this shipment."
                  allowedCategories={[
                    { value: "PACKING_LIST", label: "Packing List" },
                    { value: "DELIVERY_CONFIRMATION", label: "Delivery Confirmation" },
                    { value: "CERTIFICATION", label: "Certification" },
                    { value: "SHIPPING_DOCUMENT", label: "Shipping Document" }
                  ]}
                  ownerType="SHIPMENT"
                  ownerId={shipment.id}
                  canUpload={true}
                  canDelete={true}
                />
              </div>
            </section>
          )}

          {/* =========================================
              06 / FULFILLMENT STATUS
              ========================================= */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
              <span className="text-slate-300">06 /</span> FULFILLMENT STATUS
              <div className="h-px bg-slate-200 flex-1 ml-4" />
            </h2>

            <div className="border-l border-slate-200 ml-1 space-y-6">
              
              {order.confirmedAt && (
                <div className="relative pl-5">
                  <div className="absolute w-2 h-2 rounded-full bg-teal-500 -left-[4.5px] top-1" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F]">ORDER CONFIRMED</p>
                  <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                    {new Date(order.confirmedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                  </p>
                </div>
              )}
              
              <div className="relative pl-5">
                <div className={`absolute w-2 h-2 rounded-full -left-[4.5px] top-1 ${!order.confirmedAt ? "bg-blue-600" : "bg-slate-300"}`} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">ORDER ISSUED</p>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                  {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                </p>
              </div>

            </div>
          </section>

        </div>

        {/* =========================================
            DOCUMENT FOOTER & TRACEABILITY
            ========================================= */}
        <footer className="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 w-full md:w-auto">
            
            <Link
              href="/dashboard/supplier/orders"
              className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
            >
              ← BACK TO REGISTER
            </Link>

            <div className="hidden md:block w-px h-6 bg-slate-200" />

            <div>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                PROCUREMENT ORIGIN
              </span>
              <Link
                href={`/dashboard/supplier/rfqs/${order.rfqId}`}
                className="font-mono text-[11px] text-blue-600 hover:text-blue-800 transition-colors font-semibold"
              >
                {`RFQ-${order.rfqId.substring(0, 8).toUpperCase()}`} ↗
              </Link>
            </div>
          </div>
          
          <span className={`text-[10px] font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
            {order.status}
          </span>
        </footer>

      </div>

      {showShipModal && (
        <ShipOrderModal
          orderId={order.id}
          poNumber={order.poNumber}
          onClose={() => setShowShipModal(false)}
          onSubmit={handleShipOrder}
        />
      )}

      <RejectOrderModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectOrder}
        poNumber={order.poNumber}
      />
    </div>
  );
}
