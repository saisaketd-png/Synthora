"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBuyerOrder } from "@/features/order/api/getBuyerOrder";
import { PurchaseOrderResponse } from "@/features/order/api/createOrder";
import { ShipmentResponse, getShipment, confirmReceiptBuyer } from "@/features/order/api/fulfillment";
import { GenericDocumentManager } from "@/features/documents/components/GenericDocumentManager";
import { getSupplierPublicProfile } from "@/features/suppliers/api";
import { useToast } from "@/shared/context/ToastContext";

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<PurchaseOrderResponse | null>(null);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  const toast = useToast();
  const [shipmentLoading, setShipmentLoading] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getBuyerOrder(orderId);
        setOrder(data);

        // Resolve supplier name non-blocking
        getSupplierPublicProfile(data.supplierId)
          .then((s) => { if (s?.name) setSupplierName(s.name); })
          .catch(() => {});

        if (data.status === "SHIPPED" || data.status === "DELIVERED") {
          loadShipment(data.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load purchase order");
      } finally {
        setLoading(false);
      }
    }

    async function loadShipment(id: string) {
      try {
        setShipmentLoading(true);
        const data = await getShipment(id);
        setShipment(data);
      } catch (err) {
        console.error("Failed to load shipment details:", err);
      } finally {
        setShipmentLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  const handleConfirmReceipt = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await confirmReceiptBuyer(order.id);
      setOrder(updated);
      toast.success("Delivery confirmed. Purchase order closed.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to confirm receipt";
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
      case "REJECTED": return "text-red-600";
      case "PROCESSING": return "text-blue-600";
      case "SHIPPED": return "text-indigo-600";
      case "DELIVERED": return "text-green-600";
      default: return "text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center bg-white">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          LOADING COMMERCIAL DOCUMENT...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto bg-white min-h-[50vh]">
        <div className="border-l-[3px] border-orange-500 pl-4 py-1 mb-8">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">System Error</p>
          <p className="text-sm font-mono text-slate-700 mt-2">{error || "PURCHASE ORDER NOT FOUND"}</p>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] hover:text-blue-600 transition-colors"
        >
          ← RETURN TO REGISTER
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">

        {/* =========================================
            DOCUMENT HEADER
            ========================================= */}
        <header className="border-t-[3px] border-[#0A192F] pt-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-3xl">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                BUYER PROCUREMENT / PURCHASE ORDER
              </span>
              <h1 className="text-4xl lg:text-5xl font-mono font-bold text-[#0A192F] tracking-tighter mb-4">
                {order.poNumber}
              </h1>
              <Link
                href="/dashboard/orders"
                className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#0A192F] transition-colors"
              >
                ← ORDER REGISTER
              </Link>
            </div>
            
            <div className="shrink-0 flex flex-col md:items-end gap-1 md:pl-4 py-1">
              <span className={`text-lg font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
                {order.status}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                PURCHASE ORDER STATUS
              </span>
            </div>
          </div>
        </header>

        {/* =========================================
            DOCUMENT META BAND
            ========================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center border-y border-slate-200 py-4 mb-12 gap-y-6 gap-x-8">
          <div className="flex-1 lg:border-r border-slate-200 lg:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">PO NUMBER</span>
            <span className="font-mono text-sm font-bold text-[#0A192F]">{order.poNumber}</span>
          </div>
          <div className="flex-1 lg:border-r border-slate-200 lg:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">RFQ REFERENCE</span>
            <span className="font-mono text-sm font-bold text-[#0A192F]">
              {`RFQ-${order.rfqId.substring(0, 8).toUpperCase()}`}
            </span>
          </div>
          <div className="flex-1 lg:border-r border-slate-200 lg:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">ORDER DATE</span>
            <span className="font-mono text-sm font-semibold text-[#0A192F]">
              {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 lg:border-r border-slate-200 lg:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">SUPPLIER</span>
            <span className="text-sm font-semibold text-[#0A192F] truncate block">
              {supplierName || `Supplier #${order.supplierId}`}
            </span>
          </div>
          <div className="flex-1 lg:border-r border-slate-200 lg:pr-6">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">BUYER</span>
            <span className="text-sm font-semibold text-[#0A192F] truncate block">
              {/* BuyerName is not actually returned by API for orders, using static facade */}
              Synthora Organization
            </span>
          </div>
          <div className="flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">STATUS</span>
            <span className={`text-sm font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* =========================================
            MAIN COMPOSITION (70/30 SPLIT)
            ========================================= */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* LEFT COLUMN (70%) */}
          <div className="lg:w-[70%] space-y-16">
            
            {/* 01 / ORDERED MATERIAL */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">01 /</span> ORDERED MATERIAL
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              <div className="border-b-[2px] border-[#0A192F] pb-4 mb-6">
                <h3 className="text-3xl font-bold text-[#0A192F] tracking-tight">
                  {order.productName || "Specialty Chemical Raw Material"}
                </h3>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-12">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">QUANTITY</span>
                  <span className="font-mono text-2xl font-bold text-[#0A192F]">
                    {order.quantity.toLocaleString()} {order.unit.toUpperCase()}
                  </span>
                </div>
              </div>
            </section>

            {/* 02 / COMMERCIAL TERMS */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">02 /</span> COMMERCIAL TERMS
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              <div className="flex flex-col">
                <div className="flex justify-between py-4 border-b border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">UNIT PRICE</span>
                  <span className="font-mono text-sm font-semibold text-[#0A192F]">
                    {order.currency} {order.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                </div>
                <div className="flex justify-between py-4 border-b border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">CURRENCY</span>
                  <span className="font-mono text-sm font-semibold text-[#0A192F]">{order.currency}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">LEAD TIME</span>
                  <span className="font-mono text-sm font-semibold text-[#0A192F]">
                    {order.agreedLeadTimeDays ? `${order.agreedLeadTimeDays} DAYS` : "STANDARD"}
                  </span>
                </div>
                <div className="flex justify-between py-4 border-b border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">ORDER DATE</span>
                  <span className="font-mono text-sm font-semibold text-[#0A192F]">
                    {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between py-6 mt-4 border-y-[3px] border-[#0A192F]">
                  <span className="text-sm font-bold uppercase tracking-widest text-[#0A192F] self-end mb-1">TOTAL VALUE</span>
                  <span className="font-mono text-4xl font-bold text-[#0A192F] tracking-tighter">
                    {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </section>

            {/* 03 / SUPPLIER */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">03 /</span> SUPPLIER
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              <div className="border-l-[2px] border-slate-200 pl-6 py-2">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">SUPPLIER RECORD</span>
                <p className="text-2xl font-bold text-[#0A192F] mb-1">
                  {supplierName || `Supplier #${order.supplierId}`}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600">
                  VERIFIED COMMERCIAL PARTNER
                </p>
              </div>
            </section>

            {/* 04 / DELIVERY & BILLING */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">04 /</span> DELIVERY & BILLING
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mb-4">
                    SHIPPING ADDRESS
                  </h3>
                  <p className="text-sm font-medium text-slate-800 whitespace-pre-line leading-relaxed">
                    {order.shippingAddress}
                  </p>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mb-4">
                    BILLING CONTACT
                  </h3>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {order.billingContact}
                  </p>
                </div>
              </div>

              {order.notes && (
                <div className="mt-12 pt-6 border-t border-slate-200">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                    ORDER NOTES
                  </h3>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-2 border-slate-300 pl-4">
                    "{order.notes}"
                  </p>
                </div>
              )}
            </section>

            {/* 05 / FULFILLMENT STATUS */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">05 /</span> FULFILLMENT STATUS
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>

              <div className="bg-slate-50 border border-slate-200 p-6 md:p-8">
                {(order.status === "PLACED" || order.status === "CONFIRMED" || order.status === "PROCESSING") && (
                  <div className="text-center py-4">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      CURRENT FULFILLMENT STAGE
                    </span>
                    <span className={`text-sm font-bold uppercase tracking-widest ${getSemanticStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="text-sm font-medium text-slate-600 mt-4 max-w-lg mx-auto">
                      {order.status === "PLACED" && "Awaiting supplier confirmation before fulfillment operations begin."}
                      {order.status === "CONFIRMED" && "The supplier has confirmed the order and will begin processing shortly."}
                      {order.status === "PROCESSING" && "The supplier is currently processing and preparing this order for shipment."}
                    </p>
                  </div>
                )}

                {(order.status === "SHIPPED" || order.status === "DELIVERED") && shipment && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">CARRIER</span>
                        <span className="text-sm font-bold text-[#0A192F]">{shipment.carrier}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">TRACKING NUMBER</span>
                        <span className="text-sm font-mono font-medium text-indigo-700">{shipment.trackingNumber}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">SHIPPED AT</span>
                        <span className="text-sm font-mono text-slate-600">
                          {new Date(shipment.shippedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">EST. DELIVERY</span>
                        <span className="text-sm font-mono text-slate-600">
                          {shipment.estimatedDeliveryDate 
                            ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
                            : "PENDING"}
                        </span>
                      </div>
                    </div>

                    {order.status === "SHIPPED" && (
                      <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-50/50 p-4 -mx-2">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                            ACTION REQUIRED ON RECEIPT
                          </span>
                          <p className="text-xs font-medium text-slate-700">
                            Once this shipment has arrived at your receiving facility and verified, confirm receipt to complete the procurement order.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleConfirmReceipt}
                          disabled={actionLoading}
                          className="shrink-0 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50"
                        >
                          {actionLoading ? "CONFIRMING..." : "CONFIRM RECEIPT"}
                        </button>
                      </div>
                    )}

                    {order.status === "DELIVERED" && (
                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-green-600 mb-1">
                          DELIVERED & COMPLETED
                        </span>
                        <p className="text-sm font-medium text-slate-600">
                          This shipment has been received and verified. The purchase order fulfillment lifecycle is complete.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {order.status === "REJECTED" && (
                  <div className="border-l-4 border-red-600 bg-red-50 p-6 -m-2">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">
                      ORDER REJECTED BY SUPPLIER
                    </span>
                    <p className="text-sm font-bold text-slate-900 mb-2">
                      The supplier was unable to fulfill this purchase order and rejected it prior to fulfillment operations.
                    </p>
                    {order.rejectionReason && (
                      <div className="bg-white border border-red-200 p-4 mt-3">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                          REJECTION REASON
                        </span>
                        <p className="text-xs font-mono text-slate-800 italic">
                          "{order.rejectionReason}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(order.status === "SHIPPED" || order.status === "DELIVERED") && shipmentLoading && (
                  <div className="text-center py-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">
                      LOADING LOGISTICS DATA...
                    </span>
                  </div>
                )}

                {order.status === "CANCELLED" && (
                  <div className="text-center py-4">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      ORDER CANCELLED
                    </span>
                    <p className="text-sm font-medium text-slate-600">
                      No fulfillment operations will be performed for this order.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 06 / COMMERCIAL DOCUMENTS */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                <span className="text-slate-300">06 /</span> COMMERCIAL DOCUMENTS
                <div className="h-px bg-slate-200 flex-1 ml-4" />
              </h2>
              <div className="bg-white border border-slate-200 shadow-sm">
                <GenericDocumentManager
                  title="Purchase Order Documents"
                  description="Upload and manage commercial documents related to this purchase order."
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

            {/* 07 / SHIPMENT DOCUMENTS */}
            {(order.status === "SHIPPED" || order.status === "DELIVERED") && shipment && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-4">
                  <span className="text-slate-300">07 /</span> SHIPMENT DOCUMENTS
                  <div className="h-px bg-slate-200 flex-1 ml-4" />
                </h2>
                <div className="bg-white border border-slate-200 shadow-sm">
                  <GenericDocumentManager
                    title="Shipment Documents"
                    description="Documents attached to the fulfillment of this order."
                    allowedCategories={[
                      { value: "PACKING_LIST", label: "Packing List" },
                      { value: "DELIVERY_CONFIRMATION", label: "Delivery Confirmation" },
                      { value: "CERTIFICATION", label: "Certification" },
                      { value: "SHIPPING_DOCUMENT", label: "Shipping Document" }
                    ]}
                    ownerType="SHIPMENT"
                    ownerId={shipment.id}
                    canUpload={false}
                    canDelete={false}
                  />
                </div>
              </section>
            )}

          </div>


          {/* RIGHT COLUMN: CONTEXT RAIL (30%) */}
          <div className="lg:w-[30%] lg:border-l border-slate-200 lg:pl-12 pt-16 lg:pt-0">
            
            <div className="sticky top-12 space-y-16">
              
              {/* 05 / PROCUREMENT TRACE */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mb-6">
                  PROCUREMENT TRACE
                </h3>
                
                <div className="relative border-l border-slate-200 ml-1 space-y-8 pb-4">
                  
                  {order.deliveredAt && (
                    <div className="relative pl-6">
                      <div className="absolute w-2 h-2 rounded-full bg-green-500 -left-[4.5px] top-1.5" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">ORDER DELIVERED</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-1">
                        {new Date(order.deliveredAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                      </p>
                    </div>
                  )}

                  {order.shippedAt && (
                    <div className="relative pl-6">
                      <div className="absolute w-2 h-2 rounded-full bg-indigo-500 -left-[4.5px] top-1.5" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">ORDER SHIPPED</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-1">
                        {new Date(order.shippedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                      </p>
                    </div>
                  )}

                  {order.processingAt && (
                    <div className="relative pl-6">
                      <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[4.5px] top-1.5" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">PROCESSING STARTED</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-1">
                        {new Date(order.processingAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                      </p>
                    </div>
                  )}

                  {order.rejectedAt && (
                    <div className="relative pl-6">
                      <div className="absolute w-2 h-2 rounded-full bg-red-600 -left-[4.5px] top-1.5" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">ORDER REJECTED</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-1">
                        {new Date(order.rejectedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                      </p>
                    </div>
                  )}

                  {order.confirmedAt && (
                    <div className="relative pl-6">
                      <div className="absolute w-2 h-2 rounded-full bg-teal-500 -left-[4.5px] top-1.5" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F]">ORDER CONFIRMED</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-1">
                        {new Date(order.confirmedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                      </p>
                    </div>
                  )}
                  
                  <div className="relative pl-6">
                    <div className={`absolute w-2 h-2 rounded-full -left-[4.5px] top-1.5 ${!order.confirmedAt && !order.rejectedAt ? "bg-orange-500" : "bg-slate-300"}`} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">PURCHASE ORDER ISSUED</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-1">
                      {new Date(order.placedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </p>
                    <p className="font-mono text-xs font-semibold text-[#0A192F] mt-2">
                      {order.poNumber}
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute w-2 h-2 rounded-full bg-slate-300 -left-[4.5px] top-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">QUOTATION ACCEPTED</p>
                    <p className="font-mono text-xs font-semibold text-slate-600 mt-2">
                      {`QTN-${order.quotationId.substring(0, 8).toUpperCase()}`}
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute w-2 h-2 rounded-full bg-slate-300 -left-[4.5px] top-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">ORIGINATING INQUIRY</p>
                    <p className="font-mono text-xs font-semibold text-slate-600 mt-2">
                      {`RFQ-${order.rfqId.substring(0, 8).toUpperCase()}`}
                    </p>
                  </div>

                </div>
              </section>

              {/* ACTION AREA */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mb-6">
                  AVAILABLE ACTIONS
                </h3>
                <div className="space-y-4">
                  <Link
                    href={`/dashboard/rfqs/${order.rfqId}`}
                    className="block w-full text-center py-3 bg-[#0A192F] hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    VIEW RFQ DOSSIER →
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    className="block w-full text-center py-3 border border-slate-200 text-[#0A192F] hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    RETURN TO ORDERS
                  </Link>
                </div>
              </section>

            </div>
          </div>

        </div>

        {/* =========================================
            DOCUMENT FOOTER
            ========================================= */}
        <footer className="mt-24 pt-8 border-t-[2px] border-[#0A192F] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-2">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-[#0A192F]">
              SYNTHORA PROCUREMENT RECORD
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Generated from accepted procurement workflow.
            </span>
          </div>
          
          <div className="flex flex-col md:items-end gap-2 text-left md:text-right">
            <span className="font-mono text-[11px] font-bold text-slate-600">{order.poNumber}</span>
            <Link
              href="/dashboard/orders"
              className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← BACK TO PURCHASE ORDERS
            </Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
