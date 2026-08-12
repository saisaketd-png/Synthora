import { getProducts } from "@/features/products/api/getProducts";

export default async function HomePage() {
  const data = await getProducts();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">
          Synthora Marketplace
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.content.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {product.name}
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                {product.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-blue-700">
                  ₹{product.price}
                </span>

                <span className="text-sm text-gray-500">
                  Stock: {product.stock}
                </span>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Seller: {product.sellerName}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Category: {product.category}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}