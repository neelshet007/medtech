"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, LogOut, Pencil, Pill, Plus, Trash2 } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "Medicine",
  stock: "",
  imageUrl: "",
  requiresPrescription: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
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
      stock: String(product.stock),
      imageUrl: product.imageUrl || "",
      requiresPrescription: Boolean(product.requiresPrescription),
    });
    setIsModalOpen(true);
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
          stock: Number(formData.stock),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save product.");
      }

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
      alert(data.message || "Unable to delete product.");
      return;
    }

    setProducts((current) => current.filter((product) => product._id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manage Products</h1>
              <p className="text-sm text-slate-500">The product collection is the single source of truth for both admin and patient views.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition"
            >
              <Plus size={18} /> Add New
            </button>
            <LogoutButton className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800">
              <LogOut size={16} />
              Log Out
            </LogoutButton>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium text-sm">
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                          {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="w-full h-full object-cover rounded" unoptimized /> : <Pill size={18} className="text-slate-400" />}
                        </div>
                        <div className="font-medium text-slate-900">{product.name}</div>
                      </td>
                      <td className="p-4 text-slate-600 text-sm">{product.category}</td>
                      <td className="p-4 font-medium text-slate-900">Rs. {product.price}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock > 10 ? "bg-green-100 text-green-700" : product.stock > 0 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                          {product.stock} left
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {product.requiresPrescription ? <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium border border-blue-100">Rx Required</span> : "Open Sale"}
                      </td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">x</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input required type="text" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea required value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" rows="2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (Rs.)</label>
                  <input required type="number" min="0" value={formData.price} onChange={(event) => setFormData({ ...formData, price: event.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                  <input required type="number" min="0" value={formData.stock} onChange={(event) => setFormData({ ...formData, stock: event.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                  <input type="url" value={formData.imageUrl} onChange={(event) => setFormData({ ...formData, imageUrl: event.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="Medicine">Medicine</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input type="checkbox" id="rx" checked={formData.requiresPrescription} onChange={(event) => setFormData({ ...formData, requiresPrescription: event.target.checked })} className="rounded text-teal-600 focus:ring-teal-500" />
                  <label htmlFor="rx" className="text-sm font-medium text-slate-700">Requires Prescription</label>
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
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
