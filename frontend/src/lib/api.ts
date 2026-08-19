const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

export async function fetchProductDetail(idOrCode: string) {
  const masterRes = await fetch(`${API_BASE}/api/v1/public/master-products/${encodeURIComponent(idOrCode)}`, { cache: "no-store" });
  if (masterRes.ok) {
    const mp = await masterRes.json();
    return {
      id: mp.id,
      productCode: mp.masterProductCode,
      name: mp.name,
      casNumber: mp.casNumber,
      molecularFormula: mp.molecularFormula,
      category: mp.category,
      description: mp.description,
      status: mp.status,
      offeringCount: mp.offeringCount || 0,
      stock: mp.offeringCount > 0 ? 100 : 0,
      price: 0,
      sellerName: "Master Catalog",
      availabilityStatus: "AVAILABLE",
    };
  }

  // Legacy fallback for historical legacy IDs
  const res = await fetch(`${API_BASE}/api/v1/products/${encodeURIComponent(idOrCode)}/detail`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch product");
  }
  return res.json();
}

export async function fetchProductSuppliers(idOrCode: string) {
  const offeringsRes = await fetch(`${API_BASE}/api/v1/public/master-products/${encodeURIComponent(idOrCode)}/offerings`, {
    cache: "no-store",
  });
  if (offeringsRes.ok) {
    const offerings = await offeringsRes.json();
    return offerings.map((o: any) => ({
      id: o.id,
      supplierOfferingId: o.id,
      masterProductId: o.masterProductId,
      supplierId: o.supplierId,
      name: o.supplierName,
      price: o.price,
      currency: o.currency,
      stock: o.stock,
      purity: o.purity ? `${o.purity}%` : null,
      grade: o.grade,
      moq: o.moqKg ? `${o.moqKg} kg` : null,
      moqKg: o.moqKg,
      packaging: o.packaging,
      leadTimeDays: o.leadTimeDays,
      leadTime: o.leadTimeDays ? `${o.leadTimeDays} days` : null,
      coaAvailable: o.coaAvailable,
      msdsAvailable: o.msdsAvailable,
      exportReady: o.exportReady,
      availabilityStatus: o.availabilityStatus,
      moderationStatus: o.moderationStatus,
    }));
  }

  const res = await fetch(`${API_BASE}/api/v1/products/${encodeURIComponent(idOrCode)}/suppliers`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}