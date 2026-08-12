export function ProductSupplierResultsSkeleton() {
  return (
    <div className="w-full flex-1">
      {/* Header Skeleton */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mb-6 flex justify-between items-start animate-pulse">
        <div>
          <div className="h-8 bg-slate-200 rounded-md w-64 mb-3"></div>
          <div className="h-4 bg-slate-200 rounded-md w-48 mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-slate-200 rounded-full w-24"></div>
            <div className="h-6 bg-slate-200 rounded-full w-32"></div>
          </div>
        </div>
        <div className="h-10 bg-slate-200 rounded-full w-40"></div>
      </div>

      {/* Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-pulse flex flex-col md:flex-row gap-6">
            <div className="flex-1 md:w-1/3">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-lg shrink-0"></div>
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-1/2 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 md:w-1/3 grid grid-cols-2 gap-4">
              <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded-md w-2/3"></div>
              <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
            </div>

            <div className="flex-1 md:w-1/3 flex flex-col justify-end gap-3 md:items-end">
              <div className="flex gap-2 w-full justify-start md:justify-end mb-2">
                <div className="h-6 bg-slate-200 rounded-sm w-12"></div>
                <div className="h-6 bg-slate-200 rounded-sm w-12"></div>
              </div>
              <div className="h-10 bg-slate-200 rounded-full w-full md:w-40"></div>
              <div className="h-4 bg-slate-200 rounded-md w-24 mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
