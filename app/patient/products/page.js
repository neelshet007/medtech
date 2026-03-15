"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Loader2, Pill, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function PatientProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [authMessage, setAuthMessage] = useState("");
  const { addToCart, itemCount } = useCart();

  const categories = ["All", "Medicine", "Equipment", "Supplement", "Personal Care"];

  const fetchProducts = useCallback(async (searchQuery = "") => {
    setIsLoading(true);
    let url = `/api/products?category=${category}`;
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearch(event) {
    event.preventDefault();
    fetchProducts(search);
  }

  function handleAddToCart(product) {
    if (!session?.user) {
      setAuthMessage("Please Sign In to add medicines to your cart.");
      return;
    }

    addToCart(product);
    setAuthMessage("");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Pill className="text-teal-600" />
          Medical Pharmacy
        </h1>
        <Link href={session?.user ? "/patient/cart" : "/login"} className="relative p-2 bg-teal-50 rounded-full text-teal-700 hover:bg-teal-100 transition">
          <ShoppingCart size={24} />
          {itemCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {itemCount}
            </span>
          ) : null}
        </Link>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-6">
          {authMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {authMessage}
            </div>
          ) : null}

          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search medicines..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </form>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    category === item ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-teal-600 w-8 h-8" />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500">No products found for this category or search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-md transition group flex flex-col">
                  <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center shrink-0">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                    ) : (
                      <Pill size={48} className="text-slate-300" />
                    )}
                    {product.requiresPrescription ? (
                      <span className="absolute top-2 left-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                        Prescription Req.
                      </span>
                    ) : null}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xs text-teal-600 font-medium mb-1">{product.category}</div>
                    <h3 className="font-bold text-slate-900 mb-1 truncate">{product.name}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-lg text-slate-800">Rs. {product.price}</span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
