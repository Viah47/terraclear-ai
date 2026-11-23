"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Satellite, ChevronRight, User, ArrowRight } from "lucide-react";
import { getProjectById, Project } from "@/lib/supabase";

const STEPS = [
  { number: "01", name: "Upload & Dataset", path: "/" },
  { number: "02", name: "Preprocess & Mask", path: "/process" },
  { number: "03", name: "Reconstruct", path: "/reconstruct" },
  { number: "04", name: "Results & Export", path: "/results" },
];

function WorkstationHeaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    let active = true;
    getProjectById(projectId).then((p) => {
      if (active) setProject(p);
    });
    return () => {
      active = false;
    };
  }, [projectId]);

  const buildUrl = (path: string) => {
    if (projectId) {
      return `${path}?projectId=${encodeURIComponent(projectId)}`;
    }
    return path;
  };

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header className="h-14 border-b border-[#1F242D] bg-[#090B0E]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* BRANDING */}
      <div className="flex items-center gap-6">
        <Link href={buildUrl("/")} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#11141A] border border-[#1F242D] flex items-center justify-center text-[#10B981] group-hover:border-[#10B981]/50 transition-colors">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-[#F3F4F6]">
                TerraClear
              </span>
              <span className="font-mono text-[10px] text-[#10B981] px-1 py-0.2 rounded bg-[#10B981]/10 border border-[#10B981]/20 font-semibold">
                AI
              </span>
            </div>
            <p className="text-[10px] text-[#8A94A6] font-mono leading-none">
              Sentinel-1/2 Workstation
            </p>
          </div>
        </Link>
      </div>

      {/* 4-STEP LINEAR PROGRESS STEPPER */}
      {!isAuthPage && (
        <nav className="hidden md:flex items-center gap-1 bg-[#11141A] p-1 rounded-xl border border-[#1F242D]">
          {STEPS.map((step, idx) => {
            const isActive =
              step.path === "/"
                ? pathname === "/"
                : pathname.startsWith(step.path);
            const isPassed =
              (pathname === "/process" && idx < 1) ||
              (pathname === "/reconstruct" && idx < 2) ||
              (pathname === "/results" && idx < 3);

            return (
              <React.Fragment key={step.number}>
                {idx > 0 && (
                  <div className="w-3 h-px bg-[#1F242D]" />
                )}
                <Link
                  href={buildUrl(step.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#090B0E] text-[#F3F4F6] border border-[#10B981]/40 shadow-sm"
                      : isPassed
                      ? "text-[#8A94A6] hover:text-[#F3F4F6]"
                      : "text-[#8A94A6]/60 hover:text-[#8A94A6]"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      isActive ? "text-[#10B981]" : "text-[#8A94A6]"
                    }`}
                  >
                    {step.number}
                  </span>
                  <span>{step.name}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* RIGHT ACTIONS: PROJECT BADGE & AUTH */}
      <div className="flex items-center gap-3">
        {project && !isAuthPage && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#11141A] border border-[#1F242D] text-xs font-mono text-[#8A94A6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#F3F4F6] truncate max-w-[140px]">
              {project.name}
            </span>
            <span className="text-[10px] uppercase text-[#10B981]">
              [{project.status}]
            </span>
          </div>
        )}

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11141A] hover:bg-[#1A1F29] border border-[#1F242D] text-xs font-medium text-[#8A94A6] hover:text-[#F3F4F6] transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </Link>
      </div>
    </header>
  );
}

export default function WorkstationHeader() {
  return (
    <Suspense
      fallback={
        <header className="h-14 border-b border-[#1F242D] bg-[#090B0E] px-6 flex items-center justify-between" />
      }
    >
      <WorkstationHeaderInner />
    </Suspense>
  );
}
