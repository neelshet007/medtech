import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarClock, FileText, Pill } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { Product } from "@/models/Product";

export default async function ProductDetailPage({ params }) {
  await connectToDatabase();
  const product = await Product.findById(params.id).lean();

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Product not found</h1>
          <Link href="/patient/products" className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const nextExpiry = [...(product.batches || [])].sort(
    (left, right) => new Date(left.expiryDate).getTime() - new Date(right.expiryDate).getTime()
  )[0];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/patient/products" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          <ArrowLeft size={16} />
          Back to products
        </Link>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <div className="relative flex h-[420px] items-center justify-center bg-slate-100">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
              ) : (
                <Pill size={80} className="text-slate-300" />
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{product.category}</span>
              {product.requiresPrescription ? (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Prescription Required</span>
              ) : null}
              {product.lowStock ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Low Stock</span>
              ) : null}
            </div>

            <h1 className="mt-4 text-4xl font-bold text-slate-900">{product.name}</h1>
            <p className="mt-3 text-base leading-7 text-slate-500">{product.description}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-sm text-slate-500">Price</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(product.price)}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-sm text-slate-500">Current stock</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{product.stock}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarClock size={18} className="text-sky-600" />
                <span className="font-semibold">Next usable batch expiry</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {nextExpiry ? formatShortDate(nextExpiry.expiryDate) : "No eligible batch available"}
              </p>
              <p className="mt-2 text-sm text-slate-500">{product.expiryInformation || "Expiry guidance not provided."}</p>
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-sky-600" />
              <h2 className="text-2xl font-bold text-slate-900">Clinical details</h2>
            </div>
            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900">Drug list</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {(product.drugList || []).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">When to use</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {(product.whenToUse || []).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Ingredients</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {(product.ingredients || []).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Side effects</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {(product.sideEffects || []).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
            <div className="mt-6 space-y-4">
              {(product.reviews || []).length > 0 ? (
                product.reviews.map((review, index) => (
                  <article key={`${review.author}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-900">{review.author}</p>
                      <p className="text-sm font-semibold text-amber-600">{review.rating}/5</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">No reviews available yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
