"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { FileText, Loader2, Minus, Pill, Plus, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatCurrency } from "@/lib/formatters";

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
  const {
    addToCart,
    getItemQuantity,
    itemCount,
    pendingProductIds,
    updateQuantity,
  } = useCart();

  const categories = ["All", "Medicine", "Equipment", "Supplement", "Personal Care"];

  const fetchProducts = useCallback(async (searchQuery = "") => {
    setIsLoading(true);
    let url = `/api/products?category=${category}`;
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    try {
      const response = await fetch(url, { cache: "no-store" });
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

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = setTimeout(() => setToastMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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
    setToastMessage(`${product.name} added to cart.`);
  }

  function handleQuantityChange(product, nextQuantity) {
    if (!session?.user) {
      setAuthMessage("Please Sign In to manage your cart.");
      return;
    }

    updateQuantity(product._id, nextQuantity);
    setToastMessage(nextQuantity === 0 ? `${product.name} removed from cart.` : `${product.name} quantity updated.`);
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
        setToastMessage(`AI matched ${data.matchedProducts.length} medicine(s) from your prescription.`);
      } else if (data.success) {
        setVerifyError("AI analyzed it, but no matching products found in our pharmacy.");
      } else {
        setVerifyError(data.message || "Failed to analyze prescription.");
      }
    } catch (error) {
      setVerifyError("Connection error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="relative p-6 md:p-8 xl:p-12">
      {toastMessage ? (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-medium text-white shadow-lg">
          <ShoppingCart size={18} />
          {toastMessage}
        </div>
      ) : null}

      <div className="mx-auto mb-8 flex max-w-7xl items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <Pill className="text-teal-600" />
          Medical Pharmacy
        </h1>
        <Link href={session?.user ? "/dashboard/cart" : "/login"} className="relative rounded-full bg-teal-50 p-2 text-teal-700 transition hover:bg-teal-100">
          <ShoppingCart size={24} />
          {itemCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {itemCount}
            </span>
          ) : null}
        </Link>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row">
        <div className="w-full space-y-6 md:w-72">
          {authMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {authMessage}
            </div>
          ) : null}

          <div className="rounded-xl bg-linear-to-br from-teal-600 to-emerald-500 p-4 text-white shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <FileText size={20} className="text-teal-100" />
              <h3 className="text-sm font-bold">Order by Prescription</h3>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-teal-50">
              Upload your doctor&apos;s note and let AI find the matching medicines for you.
            </p>
            <label className="block w-full cursor-pointer rounded-lg border border-white/30 bg-white/20 py-2 text-center text-xs font-bold text-white transition hover:bg-white/30">
              {isVerifying ? "Analyzing..." : "Upload & Auto-Fill"}
              <input
                type="file"
                className="hidden"
                onChange={handlePrescriptionUpload}
                accept=".pdf,image/*"
                disabled={isVerifying}
              />
            </label>
            {verifyError ? (
              <p className="mt-2 rounded bg-red-500/20 p-1.5 text-[10px] text-red-100">{verifyError}</p>
            ) : null}
          </div>

          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search medicines..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </form>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-800">Categories</h3>
            <div className="space-y-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    category === item ? "bg-teal-50 font-medium text-teal-700" : "text-slate-600 hover:bg-slate-50"
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
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-500">No products found for this category or search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const quantity = getItemQuantity(product._id);
                const isPending = pendingProductIds.includes(product._id);

                return (
                  <div key={product._id} className="group flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
                    <Link href={`/patient/products/${product._id}`} className="relative flex h-48 items-center justify-center overflow-hidden bg-slate-100">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                      ) : (
                        <Pill size={48} className="text-slate-300" />
                      )}
                      {product.requiresPrescription ? (
                        <span className="absolute left-2 top-2 rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                          Prescription Req.
                        </span>
                      ) : null}
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-1 text-xs font-medium text-teal-600">{product.category}</div>
                      <Link href={`/patient/products/${product._id}`} className="mb-1 truncate font-bold text-slate-900">
                        {product.name}
                      </Link>
                      <p className="mb-4 flex-1 text-sm text-slate-500 line-clamp-2">{product.description}</p>
                      <div className="mt-auto">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-lg font-bold text-slate-800">{formatCurrency(product.price)}</span>
                          <span className={`text-xs font-semibold ${product.lowStock ? "text-rose-600" : "text-slate-500"}`}>
                            {product.lowStock ? "Low Stock" : `${product.stock} in stock`}
                          </span>
                        </div>

                        {quantity > 0 ? (
                          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                            <button
                              onClick={() => handleQuantityChange(product, quantity - 1)}
                              disabled={isPending}
                              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                            >
                              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Minus size={16} />}
                            </button>
                            <span className="min-w-8 text-center text-sm font-bold text-slate-900">{quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(product, quantity + 1)}
                              disabled={isPending}
                              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                            >
                              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0 || !session?.user || isPending}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
