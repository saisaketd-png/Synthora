export function StatsBand() {
  const stats = [
    { label: "Verified Products", value: "10,000+" },
    { label: "Audited Suppliers", value: "1,200+" },
    { label: "Countries Connected", value: "35+" },
    { label: "Monthly RFQs", value: "250+" },
  ];

  return (
    <section className="bg-blue-600 text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center justify-center ${
                index > 0 ? "pt-6 lg:pt-0" : ""
              }`}
            >
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-teal-500">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wider mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
