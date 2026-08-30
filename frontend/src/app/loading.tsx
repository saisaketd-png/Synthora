export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-20 px-4">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6" />
      <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
        Loading KemKendra Marketplace...
      </h2>
      <p className="text-sm text-[#475569] mt-2">
        Fetching verified product listings and regulatory data.
      </p>
    </div>
  );
}
