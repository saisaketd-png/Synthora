import Link from "next/link";
import { ShieldCheck, Award, MapPin, Clock, ArrowRight } from "lucide-react";
import { EnterpriseTable, Column } from "@/shared/components/EnterpriseTable";
import { SectionHeader } from "@/shared/components/SectionHeader";

interface Supplier {
  id: string;
  name: string;
  country: string;
  yearsInBusiness: number;
  specialties: string[];
  responseRate: string;
  verified: boolean;
  complianceCertificates: string[];
}

const SAMPLE_SUPPLIERS: Supplier[] = [
  {
    id: "seller-101",
    name: "Apex BioPharma Exporters Ltd",
    country: "India",
    yearsInBusiness: 18,
    specialties: ["APIs", "Analgesics", "GMP Synthesis"],
    responseRate: "< 2 Hours",
    verified: true,
    complianceCertificates: ["US-FDA", "EU-GMP", "ISO 9001"],
  },
  {
    id: "seller-102",
    name: "SinoChem Specialty Chemicals Corp",
    country: "China",
    yearsInBusiness: 24,
    specialties: ["Industrial Solvents", "Reagents", "HPLC Grade"],
    responseRate: "< 4 Hours",
    verified: true,
    complianceCertificates: ["ISO 14001", "REACH", "GMP"],
  },
  {
    id: "seller-103",
    name: "EuroPharm Synthetics GmbH",
    country: "Germany",
    yearsInBusiness: 31,
    specialties: ["Intermediates", "Chiral Chemistry", "Custom Synthesis"],
    responseRate: "< 1 Hour",
    verified: true,
    complianceCertificates: ["EU-GMP", "ISO 17025", "FDA Registered"],
  },
  {
    id: "seller-104",
    name: "Vanguard Fine Chem Technologies",
    country: "United States",
    yearsInBusiness: 15,
    specialties: ["Fine Chemicals", "Polymers", "Reagents"],
    responseRate: "< 3 Hours",
    verified: true,
    complianceCertificates: ["ISO 9001", "cGMP", "SOC 2"],
  },
];

export function SupplierSpotlight({ suppliers = SAMPLE_SUPPLIERS }: { suppliers?: Supplier[] }) {
  const columns: Column<Supplier>[] = [
    {
      header: "Supplier Name",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#0F3D91]/5 text-[#0F3D91] font-bold flex items-center justify-center text-sm shrink-0 border border-[#0F3D91]/10">
            {item.name.charAt(0)}
          </div>
          <div>
            <Link
              href={`/suppliers/${item.id}`}
              className="font-bold text-[#0F3D91] hover:underline flex items-center gap-1"
            >
              <span>{item.name}</span>
              {item.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-[#17B5AE] shrink-0" />
              )}
            </Link>
            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {item.country}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {item.yearsInBusiness} Yrs in Business
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Product Specialties",
      cell: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.specialties.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded-sm text-slate-700"
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Certifications",
      cell: (item) => (
        <div className="flex flex-wrap gap-1.5">
          {item.complianceCertificates.map((c) => (
            <span
              key={c}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-[#17B5AE]/10 text-[#17B5AE] rounded-sm flex items-center gap-1 uppercase tracking-wider"
            >
              <Award className="w-3 h-3" />
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Avg RFQ Response",
      cell: (item) => (
        <span className="font-semibold text-slate-900 text-xs">
          {item.responseRate}
        </span>
      ),
    },
    {
      header: "Profile",
      cell: (item) => (
        <Link
          href={`/suppliers/${item.id}`}
          className="px-4 py-1.5 bg-white border border-slate-300 hover:border-[#0F3D91] hover:text-[#0F3D91] text-slate-800 font-bold text-xs rounded-sm transition-colors inline-flex items-center gap-1.5"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Audited Manufacturers"
          title="Featured Verified Suppliers"
          subtitle="Connect with globally certified facilities supporting scale-up from pilot to commercial quantities."
          actionHref="/suppliers"
          actionText={`View All Suppliers (${suppliers.length})`}
        />

        <EnterpriseTable
          columns={columns}
          data={suppliers}
          keyExtractor={(item) => item.id}
          emptyTitle="No Verified Suppliers Found"
          emptyDescription="There are currently no audited suppliers matching your criteria."
        />
      </div>
    </section>
  );
}
