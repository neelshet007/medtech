"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, LogOut, Pencil, Pill, Plus, Trash2 } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { formatCurrency, formatShortDate } from "@/lib/formatters";

const emptyBatch = { quantity: "", expiryDate: "" };

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "Medicine",
  imageUrl: "",
  requiresPrescription: false,
  drugList: "",
  whenToUse: "",
  ingredients: "",
  sideEffects: "",
  expiryInformation: "",
  reviewLines: "",
  batches: [{ ...emptyBatch }],
};

function serializeReviewLines(reviews = []) {
  return reviews.map((review) => `${review.author}|${review.rating}|${review.comment}`).join("\n");
}

function parseReviewLines(lines = "") {
  return lines
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [author, rating, ...commentParts] = line.split("|");
      return {
        author: author?.trim(),
        rating: Number(rating),
        comment: commentParts.join("|").trim(),
      };
    });
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError("");
    setFormData(initialForm);
  }

  function handleEdit(product) {
    setEditingId(product._id);
    setFormError("");
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      imageUrl: product.imageUrl || "",
      requiresPrescription: Boolean(product.requiresPrescription),
      drugList: (product.drugList || []).join("\n"),
      whenToUse: (product.whenToUse || []).join("\n"),
      ingredients: (product.ingredients || []).join("\n"),
      sideEffects: (product.sideEffects || []).join("\n"),
      expiryInformation: product.expiryInformation || "",
      reviewLines: serializeReviewLines(product.reviews || []),
      batches: (product.batches || []).map((batch) => ({
        quantity: String(batch.quantity),
        expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().slice(0, 10) : "",
      })),
    });
    setIsModalOpen(true);
  }

  function updateBatch(index, key, value) {
    setFormData((current) => ({
      ...current,
      batches: current.batches.map((batch, batchIndex) =>
        batchIndex === index ? { ...batch, [key]: value } : batch
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          drugList: formData.drugList,
          whenToUse: formData.whenToUse,
          ingredients: formData.ingredients,
          sideEffects: formData.sideEffects,
          reviews: parseReviewLines(formData.reviewLines),
          batches: formData.batches.map((batch) => ({
            quantity: Number(batch.quantity),
            expiryDate: batch.expiryDate,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save product.");
      }

      setToast(editingId ? "Product updated." : "Product created.");
      resetForm();
      fetchProducts();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) {
      return;
    }

    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setToast(data.message || "Unable to delete product.");
      return;
    }

    setToast("Product deleted.");
    setProducts((current) => current.filter((product) => product._id !== id));
  }

  const inventorySummary = useMemo(() => {
    const expiredProducts = products.filter((product) => product.expiredBatchCount > 0);
    const nearExpiryProducts = products.filter((product) => product.nearExpiryCount > 0);
    const lowStockProducts = products.filter((product) => product.lowStock);
    return { expiredProducts, nearExpiryProducts, lowStockProducts };
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {toast ? <div className="fixed right-6 top-6 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">{toast}</div> : null}
      <div className="mx-auto space-y-6 max-w-7xl">
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inventory and expiry control</h1>
              <p className="text-sm text-slate-500">Products now store clinical metadata and FEFO-ready batch inventory instead of a flat stock number.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white transition hover:bg-teal-700">
              <Plus size={18} /> Add New
            </button>
            <LogoutButton className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800">
              <LogOut size={16} />
              Log Out
            </LogoutButton>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Near expiry (3-6 months)</h2>
            <div className="mt-4 space-y-3">
              {inventorySummary.nearExpiryProducts.map((product) => (
                <article key={product._id} className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  {product.name} - {product.nearExpiryCount} batch(es)
                </article>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Expired products</h2>
            <div className="mt-4 space-y-3">
              {inventorySummary.expiredProducts.map((product) => (
                <article key={product._id} className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                  {product.name} - {product.expiredBatchCount} expired batch(es)
                </article>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Low stock (&lt;5)</h2>
            <div className="mt-4 space-y-3">
              {inventorySummary.lowStockProducts.map((product) => (
                <article key={product._id} className="rounded-xl bg-sky-50 p-3 text-sm text-sky-700">
                  {product.name} - {product.stock} left
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-sm font-medium text-slate-600">
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Batches</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b border-slate-50 transition hover:bg-slate-50">
                      <td className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100">
                          {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="h-full w-full rounded object-cover" unoptimized /> : <Pill size={18} className="text-slate-400" />}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-500">{product.requiresPrescription ? "Rx Required" : "Open Sale"}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{product.category}</td>
                      <td className="p-4 font-medium text-slate-900">{formatCurrency(product.price)}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${product.lowStock ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {product.stock} left
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {(product.batches || []).map((batch) => (
                          <div key={batch._id}>
                            {batch.quantity} units - {formatShortDate(batch.expiryDate)}
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {product.expiredBatchCount > 0 ? <div className="text-rose-600">Expired batches: {product.expiredBatchCount}</div> : null}
                        {product.nearExpiryCount > 0 ? <div className="text-amber-600">Near expiry: {product.nearExpiryCount}</div> : null}
                        {product.lowStock ? <div className="text-sky-600">Low stock</div> : null}
                      </td>
                      <td className="flex gap-2 p-4">
                        <button onClick={() => handleEdit(product)} className="rounded p-2 text-indigo-600 transition hover:bg-indigo-50"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(product._id)} className="rounded p-2 text-red-600 transition hover:bg-red-50"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[95vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">x</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {formError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="Product name" className="rounded-xl border border-slate-200 px-4 py-3" />
                <input required type="number" min="0" value={formData.price} onChange={(event) => setFormData({ ...formData, price: event.target.value })} placeholder="Price" className="rounded-xl border border-slate-200 px-4 py-3" />
                <textarea required value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder="Description" className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" />
                <select value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3">
                  <option value="Medicine">Medicine</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Supplement">Supplement</option>
                  <option value="Personal Care">Personal Care</option>
                </select>
                <input value={formData.imageUrl} onChange={(event) => setFormData({ ...formData, imageUrl: event.target.value })} placeholder="Image URL" className="rounded-xl border border-slate-200 px-4 py-3" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <textarea value={formData.drugList} onChange={(event) => setFormData({ ...formData, drugList: event.target.value })} placeholder="Drug list, one per line" className="rounded-xl border border-slate-200 px-4 py-3" rows="4" />
                <textarea value={formData.whenToUse} onChange={(event) => setFormData({ ...formData, whenToUse: event.target.value })} placeholder="When to use, one per line" className="rounded-xl border border-slate-200 px-4 py-3" rows="4" />
                <textarea value={formData.ingredients} onChange={(event) => setFormData({ ...formData, ingredients: event.target.value })} placeholder="Ingredients, one per line" className="rounded-xl border border-slate-200 px-4 py-3" rows="4" />
                <textarea value={formData.sideEffects} onChange={(event) => setFormData({ ...formData, sideEffects: event.target.value })} placeholder="Side effects, one per line" className="rounded-xl border border-slate-200 px-4 py-3" rows="4" />
                <textarea value={formData.expiryInformation} onChange={(event) => setFormData({ ...formData, expiryInformation: event.target.value })} placeholder="Expiry information" className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" />
                <textarea value={formData.reviewLines} onChange={(event) => setFormData({ ...formData, reviewLines: event.target.value })} placeholder="Reviews: author|rating|comment" className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="4" />
              </div>

              <section className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Batch inventory</h3>
                  <button type="button" onClick={() => setFormData({ ...formData, batches: [...formData.batches, { ...emptyBatch }] })} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                    Add batch
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">Batches expiring within 3 months are rejected at validation time so FEFO only uses eligible stock.</p>
                <div className="mt-4 space-y-3">
                  {formData.batches.map((batch, index) => (
                    <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <input type="number" min="0" value={batch.quantity} onChange={(event) => updateBatch(index, "quantity", event.target.value)} placeholder="Batch quantity" className="rounded-xl border border-slate-200 px-4 py-3" />
                      <input type="date" value={batch.expiryDate} onChange={(event) => updateBatch(index, "expiryDate", event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" />
                      <button type="button" onClick={() => setFormData({ ...formData, batches: formData.batches.filter((_, batchIndex) => batchIndex !== index) || [{ ...emptyBatch }] })} className="rounded-xl border border-rose-200 px-4 py-3 text-rose-600">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.requiresPrescription} onChange={(event) => setFormData({ ...formData, requiresPrescription: event.target.checked })} />
                <span className="text-sm font-medium text-slate-700">Requires Prescription</span>
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2 font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editingId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
