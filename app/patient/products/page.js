"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { FileText, Loader2, Pill, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function PatientProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [authMessage, setAuthMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
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
    setToastMessage(`Added ${product.name} to cart!`);
    setTimeout(() => setToastMessage(""), 3000);
  }

  async function handlePrescriptionUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !session?.user) {
      if (!session?.user) setAuthMessage("Please Sign In to upload a prescription.");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/prescription/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.matchedProducts?.length > 0) {
        data.matchedProducts.forEach((product) => {
          addToCart(product);
        });
        setToastMessage(`AI matched ${data.matchedProducts.length} medicine(s) from your prescription!`);
        setTimeout(() => setToastMessage(""), 4000);
      } else if (data.success) {
        setVerifyError("AI analyzed it, but no matching products found in our pharmacy.");
      } else {
        setVerifyError(data.message || "Failed to analyze prescription.");
      }
    } catch (err) {
      setVerifyError("Connection error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="p-6 md:p-8 xl:p-12 relative">
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-teal-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center gap-2 z-50 animate-bounce">
          <ShoppingCart size={18} />
          {toastMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Pill className="text-teal-600" />
          Medical Pharmacy
        </h1>
        <Link href={session?.user ? "/dashboard/cart" : "/login"} className="relative p-2 bg-teal-50 rounded-full text-teal-700 hover:bg-teal-100 transition">
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

          <div className="bg-linear-to-br from-teal-600 to-emerald-500 p-4 rounded-xl shadow-md text-white">
             <div className="flex items-center gap-2 mb-2">
                <FileText size={20} className="text-teal-100" />
                <h3 className="font-bold text-sm">Order by Prescription</h3>
             </div>
             <p className="text-teal-50 text-xs mb-3 leading-relaxed">
                Upload your doctor&apos;s note and let AI find the matching medicines for you.
             </p>
             <label className="bg-white/20 hover:bg-white/30 border border-white/30 text-white w-full py-2 rounded-lg text-xs font-bold text-center block cursor-pointer transition">
                {isVerifying ? "Analyzing..." : "Upload & Auto-Fill"}
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handlePrescriptionUpload} 
                  accept=".pdf,image/*" 
                  disabled={isVerifying} 
                />
             </label>
             {verifyError && (
               <p className="mt-2 text-[10px] text-red-100 bg-red-500/20 p-1.5 rounded">{verifyError}</p>
             )}
          </div>

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
                        disabled={product.stock === 0 || !session?.user}
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
