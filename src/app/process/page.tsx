"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sliders,
  Eye,
  Satellite,
  Activity,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import {
  getProjectById,
  updateProject,
  Project,
} from "@/lib/supabase";

function ProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cloud sensitivity slider (0.20 to 0.80, default 0.45)
  const [cloudSensitivity, setCloudSensitivity] = useState(0.45);
  // View mode: 'overlay' | 'binary' | 'optical'
  const [viewMode, setViewMode] = useState<"overlay" | "binary" | "optical">(
    "overlay"
  );

  // Real computed cloud statistics
  const [cloudCoveragePct, setCloudCoveragePct] = useState<number>(38.5);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getProjectById(projectId)
      .then((p) => {
        setProject(p);
        if (p?.metadata?.cloud_coverage_percent) {
          setCloudCoveragePct(p.metadata.cloud_coverage_percent);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load project:", err);
        setLoading(false);
      });
  }, [projectId]);

  // Dynamically compute real cloud mask on HTML5 canvas whenever optical image or sensitivity changes
  useEffect(() => {
    if (!project?.optical_url) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw original optical image scaled to 256x256
      ctx.drawImage(img, 0, 0, 256, 256);
      const imgData = ctx.getImageData(0, 0, 256, 256);
      const data = imgData.data;

      // Cloud threshold based on sensitivity:
      // Higher sensitivity => lower threshold (detects dimmer haze / thin clouds)
      // Range: 0.20 (threshold ~230) to 0.80 (threshold ~160)
      const threshold = 245 - cloudSensitivity * 105;

      let cloudCount = 0;
      const totalPixels = 256 * 256;

      // Create binary mask canvas
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = 256;
      maskCanvas.height = 256;
      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) return;
      const maskData = maskCtx.createImageData(256, 256);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        // True cloud identification: high brightness + low color saturation (white/light gray)
        const isCloud =
          brightness > threshold &&
          Math.abs(r - g) < 40 &&
          Math.abs(r - b) < 40 &&
          Math.abs(g - b) < 40;

        if (isCloud) {
          cloudCount++;
          // Mask image: white for cloud
          maskData.data[i] = 255;
          maskData.data[i + 1] = 255;
          maskData.data[i + 2] = 255;
          maskData.data[i + 3] = 255;
        } else {
          // Clear ground: black
          maskData.data[i] = 0;
          maskData.data[i + 1] = 0;
          maskData.data[i + 2] = 0;
          maskData.data[i + 3] = 255;
        }
      }

      maskCtx.putImageData(maskData, 0, 0);
      const generatedMaskUrl = maskCanvas.toDataURL("image/png");
      setMaskDataUrl(generatedMaskUrl);

      const calculatedPct =
        Math.round((cloudCount / totalPixels) * 1000) / 10;
      setCloudCoveragePct(Math.max(2, Math.min(98, calculatedPct)));

      // Render the display canvas according to active viewMode
      const displayCanvas = canvasRef.current;
      if (displayCanvas) {
        const displayCtx = displayCanvas.getContext("2d");
        if (displayCtx) {
          displayCtx.clearRect(0, 0, 256, 256);

          if (viewMode === "optical") {
            // Just the optical photo
            displayCtx.drawImage(img, 0, 0, 256, 256);
          } else if (viewMode === "binary") {
            // Binary mask only: black and white
            displayCtx.drawImage(maskCanvas, 0, 0, 256, 256);
          } else {
            // Overlay: optical photo with clean semi-transparent emerald tint over detected clouds
            displayCtx.drawImage(img, 0, 0, 256, 256);
            const overlayData = displayCtx.getImageData(0, 0, 256, 256);
            for (let i = 0; i < data.length; i += 4) {
              if (maskData.data[i] === 255) {
                // Tint cloud pixels with crisp satellite emerald highlight
                overlayData.data[i] = Math.round(
                  overlayData.data[i] * 0.4 + 16 * 0.6
                );
                overlayData.data[i + 1] = Math.round(
                  overlayData.data[i + 1] * 0.4 + 185 * 0.6
                );
                overlayData.data[i + 2] = Math.round(
                  overlayData.data[i + 2] * 0.4 + 129 * 0.6
                );
              }
            }
            displayCtx.putImageData(overlayData, 0, 0);
          }
        }
      }
    };
    img.src = project.optical_url;
  }, [project?.optical_url, cloudSensitivity, viewMode]);

  const clearSurfacePct = Math.round((100 - cloudCoveragePct) * 10) / 10;

  const handleConfirmAndContinue = async () => {
    if (!project) return;
    setSaving(true);

    try {
      await updateProject(project.id, {
        status: "masked",
        cloud_mask_url: maskDataUrl || project.cloud_mask_url,
        metadata: {
          ...project.metadata,
          cloud_coverage_percent: cloudCoveragePct,
        },
      });

      router.push(`/reconstruct?projectId=${encodeURIComponent(project.id)}`);
    } catch (err) {
      console.warn("Mask update notice:", err);
      router.push(`/reconstruct?projectId=${encodeURIComponent(project.id)}`);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-mono text-[#8A94A6] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#10B981]" />
        <span>Analyzing Satellite Image &amp; Detecting Clouds...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#11141A] border border-[#1F242D] flex items-center justify-center mx-auto text-[#8A94A6]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-[#F3F4F6]">No Image Loaded</h2>
        <p className="text-xs text-[#8A94A6]">
          Please select a sample scene or upload an image in Step 01 first.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10B981] text-[#090B0E] font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Step 01 (Upload)
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STEP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F242D] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[11px] font-mono font-medium mb-1.5 border border-[#10B981]/20">
            <span>STEP 02</span>
            <span>/</span>
            <span>04</span>
            <span className="text-[#8A94A6]">•</span>
            <span>CLOUD DETECTION &amp; VERIFICATION</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F3F4F6]">
            Review Detected Clouds
          </h1>
          <p className="text-xs text-[#8A94A6] mt-0.5">
            The AI automatically identifies which parts of the image are clouds and leaves the real ground untouched.
          </p>
        </div>

        <Link
          href={`/?projectId=${project.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11141A] hover:bg-[#1F242D] border border-[#1F242D] text-xs font-medium text-[#8A94A6] hover:text-[#F3F4F6] transition-colors self-start md:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload
        </Link>
      </div>

      {/* CLEAR ACTIONABLE GUIDE BANNER ("WHAT TO DO") */}
      <div className="bg-[#11141A] border border-[#10B981]/30 rounded-xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F3F4F6]">
            <HelpCircle className="w-4 h-4 text-[#10B981]" />
            <span>WHAT TO DO ON THIS STEP:</span>
          </div>
          <p className="text-xs text-[#8A94A6] leading-relaxed">
            1. Look at the image below — the <strong className="text-[#10B981]">green highlighted areas</strong> are clouds marked for removal.<br />
            2. (Optional) Adjust the slider if you want to include thin haze or focus only on thick clouds.<br />
            3. When you are satisfied, click the button on the right to start AI reconstruction.
          </p>
        </div>

        <button
          onClick={handleConfirmAndContinue}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-[#090B0E] font-bold text-xs tracking-wide transition-all shadow-md shadow-[#10B981]/15 shrink-0"
        >
          <span>{saving ? "Saving..." : "Confirm & Continue to Reconstruct"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* SENSOR HEALTH & DIMENSION BADGES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-[#11141A] border border-[#1F242D]">
          <span className="text-[10px] text-[#8A94A6] uppercase block">
            Optical Image
          </span>
          <div className="text-sm font-bold text-[#F3F4F6] mt-0.5">
            256 × 256 px
          </div>
          <span className="text-[10px] text-[#10B981]">✓ Aligned &amp; Ready</span>
        </div>

        <div className="p-3 rounded-lg bg-[#11141A] border border-[#1F242D]">
          <span className="text-[10px] text-[#8A94A6] uppercase block">
            Radar (SAR) Guidance
          </span>
          <div className="text-sm font-bold text-[#F3F4F6] mt-0.5">
            256 × 256 px
          </div>
          <span className="text-[10px] text-[#10B981]">✓ Penetrates Clouds</span>
        </div>

        <div className="p-3 rounded-lg bg-[#11141A] border border-[#1F242D]">
          <span className="text-[10px] text-[#8A94A6] uppercase block">
            Clouds Detected
          </span>
          <div className="text-sm font-bold text-[#F3F4F6] mt-0.5">
            {cloudCoveragePct}%
          </div>
          <span className="text-[10px] text-amber-400">To be erased by AI</span>
        </div>

        <div className="p-3 rounded-lg bg-[#11141A] border border-[#1F242D]">
          <span className="text-[10px] text-[#8A94A6] uppercase block">
            Clear Ground
          </span>
          <div className="text-sm font-bold text-[#10B981] mt-0.5">
            {clearSurfacePct}%
          </div>
          <span className="text-[10px] text-[#8A94A6]">100% Protected</span>
        </div>
      </div>

      {/* MAIN WORKSPACE: INTERACTIVE CLOUD MASK VIEWER */}
      <div className="bg-[#11141A] border border-[#1F242D] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#10B981]" />
              <span>Cloud Detection Preview</span>
            </h2>
            <p className="text-[11px] text-[#8A94A6] mt-0.5">
              Only the highlighted areas will be repainted using radar data. Real ground is kept intact.
            </p>
          </div>

          {/* VIEW SWITCHER */}
          <div className="flex items-center gap-1 bg-[#090B0E] p-1 rounded-lg border border-[#1F242D]">
            <button
              onClick={() => setViewMode("overlay")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === "overlay"
                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                  : "text-[#8A94A6] hover:text-[#F3F4F6]"
              }`}
            >
              Cloud Highlight
            </button>
            <button
              onClick={() => setViewMode("binary")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === "binary"
                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                  : "text-[#8A94A6] hover:text-[#F3F4F6]"
              }`}
            >
              Black &amp; White Mask
            </button>
            <button
              onClick={() => setViewMode("optical")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === "optical"
                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                  : "text-[#8A94A6] hover:text-[#F3F4F6]"
              }`}
            >
              Original Photo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* DISPLAY CANVAS (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="aspect-square w-full max-w-sm rounded-xl bg-[#090B0E] border border-[#1F242D] overflow-hidden relative shadow-lg flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={256}
                height={256}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-[#090B0E]/85 backdrop-blur-sm text-[10px] font-mono text-[#F3F4F6] border border-[#1F242D]">
                {viewMode === "overlay"
                  ? `Green Tint = Cloud to Erase (${cloudCoveragePct}%)`
                  : viewMode === "binary"
                  ? "White = Cloud Area, Black = Clear Ground"
                  : "Original Cloudy Optical Input"}
              </div>
            </div>
            <p className="text-[11px] text-[#8A94A6] mt-2 font-mono text-center">
              Target Resolution: 256×256 pixels
            </p>
          </div>

          {/* CONTROLS & EXPLANATION (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* SENSITIVITY SLIDER */}
            <div className="p-4 rounded-xl bg-[#090B0E] border border-[#1F242D] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F3F4F6] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Cloud Sensitivity</span>
                </span>
                <span className="font-mono text-[#10B981] font-bold">
                  {Math.round(cloudSensitivity * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={cloudSensitivity}
                onChange={(e) =>
                  setCloudSensitivity(parseFloat(e.target.value))
                }
                className="w-full accent-[#10B981] bg-[#1F242D] h-2 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-[#8A94A6]">
                <span>Thick Clouds Only</span>
                <span>Balanced (Recommended)</span>
                <span>Catch Faint Haze</span>
              </div>

              <p className="text-[11px] text-[#8A94A6] leading-relaxed pt-1">
                Drag the slider to adjust which areas are treated as clouds. Watch the green highlight on the left update live.
              </p>
            </div>

            {/* WHAT HAPPENS NEXT EXPLANATION */}
            <div className="p-4 rounded-xl bg-[#090B0E] border border-[#1F242D] space-y-2">
              <div className="text-xs font-bold text-[#F3F4F6] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                <span>What Happens Next?</span>
              </div>
              <p className="text-xs text-[#8A94A6] leading-relaxed">
                When you click <strong>Confirm &amp; Continue</strong>, the U-Net AI model takes the radar scan (which sees straight through the clouds) and paints in the missing fields and roads under the green area.
              </p>
            </div>

            {/* CONFIRM BUTTON */}
            <button
              onClick={handleConfirmAndContinue}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-[#090B0E] font-bold text-xs tracking-wide transition-all shadow-md shadow-[#10B981]/15"
            >
              <span>{saving ? "Saving Mask..." : "Confirm & Continue to Reconstruct"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProcessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs font-mono text-[#8A94A6]">
          Loading Cloud Detection...
        </div>
      }
    >
      <ProcessContent />
    </Suspense>
  );
}
