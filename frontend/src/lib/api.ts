import { resolveApiUrl } from "./apiUrl";

export { resolveApiUrl, getApiBaseUrl } from "./apiUrl";

export async function fetchProductDetail(idOrCode: string) {
  const masterRes = await fetch(resolveApiUrl(`/api/v1/public/master-products/${encodeURIComponent(idOrCode)}`), {
    cache: "no-store",
  });

  if (masterRes.ok) {
    const mp = await masterRes.json();
    let primaryImageUrl: string | null = null;
    let images: any[] = [];

    try {
      const imgRes = await fetch(resolveApiUrl(`/api/v1/master-products/${mp.id}/images`), {
        cache: "no-store",
      });
      if (imgRes.ok) {
        images = await imgRes.json();
        const primary = images.find((i: any) => i.isPrimary) || images[0];
        if (primary) {
          primaryImageUrl = primary.imageUrl;
        }
      }
    } catch {
      // Graceful fallback if images cannot be loaded
    }

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
      primaryImageUrl,
      images,
      stock: mp.offeringCount > 0 ? 100 : 0,
      price: 0,
      sellerName: "Master Catalog",
      availabilityStatus: "AVAILABLE",
    };
  }

  // Fallback for legacy ID lookups
  const res = await fetch(resolveApiUrl(`/api/v1/products/${encodeURIComponent(idOrCode)}/detail`), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch product");
  }
  return res.json();
}

export async function fetchProductSuppliers(idOrCode: string) {
  const offeringsRes = await fetch(resolveApiUrl(`/api/v1/public/master-products/${encodeURIComponent(idOrCode)}/offerings`), {
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
      supplierName: o.supplierName,
      supplierLogoUrl: o.supplierLogoUrl,
      supplierVerified: o.supplierVerified,
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
      responseRate: o.responseRate,
      averageResponseTimeSeconds: o.averageResponseTimeSeconds,
      formattedResponseTime: o.formattedResponseTime,
    }));
  }

  const res = await fetch(resolveApiUrl(`/api/v1/products/${encodeURIComponent(idOrCode)}/suppliers`), {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}