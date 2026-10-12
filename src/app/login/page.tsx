"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Lock, Mail, AlertCircle, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background industrial motif */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#781F32_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-maroon-600 flex items-center justify-center text-white shadow-xl border border-maroon-400/40">
            <Flame className="w-8 h-8 text-amber-300" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white font-sans">
          Oil & Gas Sales Hub
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
          Enterprise B2B Quotation Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@oilgashub.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-[11px] font-medium text-maroon-600 hover:text-maroon-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-maroon-600 hover:bg-maroon-700 focus:outline-none focus:ring-2 focus:ring-maroon-500/30 shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Tender Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Selectors */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Role Demonstration
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin@oilgashub.com", "AdminPass2026!")}
                className="w-full flex items-center justify-between p-2 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Admin Account</span>
                    <span className="text-[10px] text-amber-700">Full visibility, margins, supplier costs</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-amber-300">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("sales1@oilgashub.com", "Sales1Pass2026!")}
                className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition-all"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Salesperson 1 (Sarah)</span>
                    <span className="text-[10px] text-slate-500">Shared register, quotes, strictly isolated costs</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-slate-300">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("sales2@oilgashub.com", "Sales2Pass2026!")}
                className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition-all"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Salesperson 2 (Tariq)</span>
                    <span className="text-[10px] text-slate-500">Shared register, quotes, strictly isolated costs</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-slate-300">
                  Select
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Compliant with API 6D, ASME & ISO 9001 Commercial Protocols • Version 2.4.0
          </p>
        </div>
      </div>
    </div>
  );
}
