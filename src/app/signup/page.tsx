"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Satellite, ArrowRight, ShieldCheck, Lock, Mail, User } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // =========================================================================
    // TODO: Wire Supabase Auth
    // Example:
    // const { data, error } = await supabase.auth.signUp({
    //   email,
    //   password,
    //   options: { data: { full_name: name } },
    // });
    // if (error) throw error;
    // =========================================================================

    // Non-blocking fallback for development/guest workflow
    setTimeout(() => {
      setLoading(false);
      setNotice("Account initialized (Guest mode enabled). Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 600);
    }, 500);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#11141A] border border-[#1F242D] rounded-2xl p-8 space-y-6">
        {/* HEADER */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#090B0E] border border-[#1F242D] text-[#10B981] mb-2">
            <Satellite className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F3F4F6]">
            Create TerraClear Account
          </h1>
          <p className="text-xs text-[#8A94A6]">
            Deploy custom SAR-optical restoration pipelines and save high-resolution imagery.
          </p>
        </div>

        {notice && (
          <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981] font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8A94A6]">
              Operator Name / Call-Sign
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A94A6]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Sarah Connor"
                className="w-full bg-[#090B0E] border border-[#1F242D] focus:border-[#10B981] text-[#F3F4F6] placeholder:text-[#8A94A6]/50 text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8A94A6]">
              Operator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A94A6]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@organization.org"
                className="w-full bg-[#090B0E] border border-[#1F242D] focus:border-[#10B981] text-[#F3F4F6] placeholder:text-[#8A94A6]/50 text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8A94A6]">
              Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A94A6]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#090B0E] border border-[#1F242D] focus:border-[#10B981] text-[#F3F4F6] placeholder:text-[#8A94A6]/50 text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-[#090B0E] font-semibold text-xs tracking-wide transition-colors disabled:opacity-50"
          >
            {loading ? "Registering..." : "Create Workstation Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* NON-BLOCKING GUEST ACCESS & LOGIN LINK */}
        <div className="pt-2 border-t border-[#1F242D] space-y-3 text-center">
          <Link
            href="/"
            className="inline-block text-xs text-[#10B981] hover:underline font-medium"
          >
            Continue as Guest (No authentication required) →
          </Link>

          <p className="text-xs text-[#8A94A6]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#F3F4F6] hover:text-[#10B981] font-medium transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
