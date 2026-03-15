import Link from "next/link";
import { HeartPulse, ShieldCheck, Activity, Stethoscope, LogOut } from "lucide-react";
import { getServerSession } from "next-auth/next";

export default async function Home() {
  const session = await getServerSession();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 text-teal-600">
          <HeartPulse size={32} strokeWidth={2} />
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">MediConnect</span>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm font-medium text-slate-500 hidden sm:block">Hello, {session.user?.name}</span>
              <Link href={session.user?.role === "admin" ? "/admin" : "/patient"} className="text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all">
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-sm font-bold bg-teal-600 text-white px-5 py-2.5 rounded-full shadow-sm shadow-teal-600/20 hover:bg-teal-700 hover:shadow-md transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 md:px-12 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Production Ready Healthcare Platform
        </div>
        
        <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          Your health, delivered <br className="hidden md:block"/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">securely & instantly.</span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
          Order genuine medicines, consult doctors online, and maintain your digital health records with bank-level encryption. All from the comfort of your home.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/patient/products" className="flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            <ShieldCheck size={20} />
            Browse Medicines
          </Link>
          <Link href="/patient" className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Activity size={20} />
            Patient Dashboard
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white border-t border-slate-100 py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Secure Payments</h3>
            <p className="text-slate-500 leading-relaxed">Razorpay integration with strict cryptographic signature verification ensures your transactions are completely tamper-proof.</p>
          </div>
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Activity size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Health Tracking</h3>
            <p className="text-slate-500 leading-relaxed">Monitor your vitals dynamically with interactive Recharts components built seamlessly into your patient dashboard.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <HeartPulse size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Digital Records</h3>
            <p className="text-slate-500 leading-relaxed">Upload prescriptions and lab reports instantly to secure Cloudinary buckets directly from the robust Edge Network APIs.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm border-t border-slate-800">
        <p>© {new Date().getFullYear()} MediConnect E-Commerce. All rights reserved.</p>
      </footer>
    </div>
  );
}
