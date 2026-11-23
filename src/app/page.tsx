"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Satellite,
  Upload,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle,
  FileCheck2,
  Info,
  Radio,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import {
  createProject,
  getProjects,
  SEN12MS_SAMPLE_SCENES,
  SampleScene,
  Project,
} from "@/lib/supabase";

// Automatically optimizes and center-crops any user uploaded image to 256x256
// Prevents browser localStorage 5MB quota errors and matches the U-Net tensor shape
function optimizeImageTo256(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        // Center crop and scale to 256x256
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 256, 256);
        // Optimized ~60-90KB JPEG representation
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function UploadDatasetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProjectId = searchParams.get("projectId");

  // State for project creation / loading
  const [projectName, setProjectName] = useState("SEN12MS-CR Scene #408");
  const [selectedSample, setSelectedSample] = useState<SampleScene>(
    SEN12MS_SAMPLE_SCENES[0]
  );
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom upload state (data URLs or file objects)
  const [customOptical, setCustomOptical] = useState<string | null>(null);
  const [customSar, setCustomSar] = useState<string | null>(null);
  const [customReference, setCustomReference] = useState<string | null>(null);
  const [customOpticalName, setCustomOpticalName] = useState("");
  const [customSarName, setCustomSarName] = useState("");
  const [customReferenceName, setCustomReferenceName] = useState("");

  const [loading, setLoading] = useState(false);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);

  useEffect(() => {
    getProjects().then((data) => setExistingProjects(data));
  }, []);

  // Handle sample selection
  const handleSelectSample = (scene: SampleScene) => {
    setSelectedSample(scene);
    setIsCustomMode(false);
    setProjectName(`SEN12MS-CR ${scene.name}`);
  };

  // Handle custom image uploads via file input with auto 256x256 optimization
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "optical" | "sar" | "reference"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedDataUrl = await optimizeImageTo256(file);
      if (type === "optical") {
        setCustomOptical(optimizedDataUrl);
        setCustomOpticalName(file.name);
      } else if (type === "sar") {
        setCustomSar(optimizedDataUrl);
        setCustomSarName(file.name);
      } else {
        setCustomReference(optimizedDataUrl);
        setCustomReferenceName(file.name);
      }
      setIsCustomMode(true);
    } catch (err) {
      console.warn("Failed to optimize custom image:", err);
    }
  };

  // Submit and proceed to Step 2 (/process)
  const handleProceed = async () => {
    setLoading(true);

    try {
      let opticalUrl: string;
      let sarUrl: string;
      let referenceUrl: string | null = null;
      let maskUrl: string;
      let cloudPercent = 42.5;

      if (isCustomMode && customOptical && customSar) {
        opticalUrl = customOptical;
        sarUrl = customSar;
        referenceUrl = customReference || null;
        maskUrl = "/samples/sample_cloud_mask.png";
        cloudPercent = 38.0;
      } else {
        opticalUrl = selectedSample.opticalUrl;
        sarUrl = selectedSample.sarUrl;
        referenceUrl = selectedSample.referenceUrl;
        maskUrl = selectedSample.maskUrl;
        cloudPercent = selectedSample.cloudPercent;
      }

      const newProject = await createProject({
        name: projectName || "Multimodal Satellite Project",
        description: isCustomMode
          ? "User-uploaded Sentinel-1 & Sentinel-2 multimodal dataset pair."
          : `${selectedSample.name} from SEN12MS-CR-TS dataset. ${selectedSample.description}`,
        optical_url: opticalUrl,
        sar_url: sarUrl,
        reference_url: referenceUrl,
        cloud_mask_url: maskUrl,
        status: "created",
        metadata: {
          dimensions: { width: 256, height: 256 },
          optical_bands: ["B04 (Red)", "B03 (Green)", "B02 (Blue)"],
          sar_channels: ["VV (Co-pol)", "VH (Cross-pol)"],
          resolution_meters: 10,
          crs: "EPSG:32632 / UTM 32N",
          cloud_coverage_percent: cloudPercent,
          optical_filename: isCustomMode ? customOpticalName : "sentinel2_l2a_rgb.png",
          sar_filename: isCustomMode ? customSarName : "sentinel1_grd_sar.png",
          reference_filename: isCustomMode ? customReferenceName : "sentinel2_clear_ref.png",
          is_sample: !isCustomMode,
        },
      });

      router.push(`/process?projectId=${encodeURIComponent(newProject.id)}`);
    } catch (err) {
      console.error("Failed to initialize project:", err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* STEP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F242D] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[11px] font-mono font-medium mb-1.5 border border-[#10B981]/20">
            <span>STEP 01</span>
            <span>/</span>
            <span>04</span>
            <span className="text-[#8A94A6]">•</span>
            <span>DATASET INGESTION</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F3F4F6]">
            Upload &amp; Dataset Selection
          </h1>
          <p className="text-xs text-[#8A94A6] mt-0.5">
            Select a verified SEN12MS-CR-TS sample scene or upload custom co-registered Sentinel-1 SAR and Sentinel-2 Optical raster layers.
          </p>
        </div>

        {/* PROJECT NAME INPUT */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#8A94A6] font-medium whitespace-nowrap">
            Project:
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-[#11141A] border border-[#1F242D] focus:border-[#10B981] text-[#F3F4F6] text-xs font-mono rounded-lg px-3 py-1.5 outline-none w-56 transition-colors"
          />
        </div>
      </div>

      {/* SECTION 1: SEN12MS-CR-TS SAMPLE SCENES STRIP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">
              SEN12MS-CR-TS Sample Scenes (1-Click Instant Test)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#8A94A6]">
            3 Benchmark Scenes Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEN12MS_SAMPLE_SCENES.map((scene) => {
            const isSelected = !isCustomMode && selectedSample.id === scene.id;
            return (
              <div
                key={scene.id}
                onClick={() => handleSelectSample(scene)}
                className={`group relative rounded-xl border p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#11141A] border-[#10B981] shadow-sm"
                    : "bg-[#11141A]/70 border-[#1F242D] hover:border-[#1F242D]/80 hover:bg-[#11141A]"
                }`}
              >
                {/* ACTIVE BADGE */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-mono font-medium">
                    <Check className="w-3 h-3" /> Selected
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-14 h-14 rounded-lg bg-[#090B0E] border border-[#1F242D] overflow-hidden shrink-0">
                    <img
                      src={scene.opticalUrl}
                      alt={scene.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 pr-16">
                    <h3 className="text-sm font-semibold text-[#F3F4F6] truncate">
                      {scene.name}
                    </h3>
                    <p className="text-[11px] text-[#8A94A6] truncate font-mono">
                      {scene.region}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] text-[#10B981] font-mono">
                      {scene.landscape}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#8A94A6] line-clamp-2 leading-relaxed mb-3">
                  {scene.description}
                </p>

                {/* METADATA TAGS */}
                <div className="pt-2.5 border-t border-[#1F242D] flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[#8A94A6]">
                  <span className="px-1.5 py-0.5 rounded bg-[#090B0E] border border-[#1F242D]">
                    256×256 px
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#090B0E] border border-[#1F242D]">
                    10m GSD
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#090B0E] border border-[#1F242D]">
                    S1 VV/VH + S2 RGB
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#090B0E] border border-[#1F242D] text-[#F3F4F6]">
                    Cloud: {scene.cloudPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CUSTOM DATASET UPLOAD ZONE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#8A94A6]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">
              Custom Satellite Image Upload (Optional)
            </h2>
          </div>
          <span className="text-[11px] text-[#8A94A6]">
            Upload own paired rasters (PNG / TIFF / GeoTIFF / JPEG)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* UPLOAD 1: OPTICAL (REQUIRED) */}
          <div
            className={`rounded-xl border p-4 space-y-3 transition-colors ${
              isCustomMode && customOptical
                ? "bg-[#11141A] border-[#10B981]/50"
                : "bg-[#11141A] border-[#1F242D]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F3F4F6]">
                1. Optical Satellite Image
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                Required
              </span>
            </div>
            <p className="text-[11px] text-[#8A94A6]">
              Cloud-obscured Sentinel-2 L2A optical bands (RGB/NIR).
            </p>

            <label className="flex flex-col items-center justify-center h-36 rounded-lg border border-dashed border-[#1F242D] hover:border-[#10B981]/50 bg-[#090B0E] cursor-pointer transition-colors relative overflow-hidden group">
              {customOptical ? (
                <>
                  <img
                    src={customOptical}
                    alt="Custom Optical"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#090B0E]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-[#F3F4F6] font-medium">
                      Replace Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 space-y-1.5">
                  <ImageIcon className="w-6 h-6 text-[#8A94A6] mx-auto" />
                  <span className="text-xs font-medium text-[#F3F4F6] block">
                    Choose or drop Optical file
                  </span>
                  <span className="text-[10px] text-[#8A94A6] font-mono block">
                    Target: 256×256 px
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "optical")}
                className="hidden"
              />
            </label>

            <div className="text-[10px] font-mono text-[#8A94A6] truncate">
              {customOpticalName || "Using active scene raster"}
            </div>
          </div>

          {/* UPLOAD 2: SAR (REQUIRED) */}
          <div
            className={`rounded-xl border p-4 space-y-3 transition-colors ${
              isCustomMode && customSar
                ? "bg-[#11141A] border-[#10B981]/50"
                : "bg-[#11141A] border-[#1F242D]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F3F4F6]">
                2. Synthetic Aperture Radar (SAR)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                Required
              </span>
            </div>
            <p className="text-[11px] text-[#8A94A6]">
              Sentinel-1 GRD dual-polarization radar (VV/VH backscatter).
            </p>

            <label className="flex flex-col items-center justify-center h-36 rounded-lg border border-dashed border-[#1F242D] hover:border-[#10B981]/50 bg-[#090B0E] cursor-pointer transition-colors relative overflow-hidden group">
              {customSar ? (
                <>
                  <img
                    src={customSar}
                    alt="Custom SAR"
                    className="w-full h-full object-cover filter grayscale"
                  />
                  <div className="absolute inset-0 bg-[#090B0E]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-[#F3F4F6] font-medium">
                      Replace Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 space-y-1.5">
                  <Satellite className="w-6 h-6 text-[#8A94A6] mx-auto" />
                  <span className="text-xs font-medium text-[#F3F4F6] block">
                    Choose or drop SAR file
                  </span>
                  <span className="text-[10px] text-[#8A94A6] font-mono block">
                    Target: 256×256 px
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "sar")}
                className="hidden"
              />
            </label>

            <div className="text-[10px] font-mono text-[#8A94A6] truncate">
              {customSarName || "Using active scene raster"}
            </div>
          </div>

          {/* UPLOAD 3: CLEAR REFERENCE (OPTIONAL) */}
          <div
            className={`rounded-xl border p-4 space-y-3 transition-colors ${
              customReference
                ? "bg-[#11141A] border-[#10B981]/50"
                : "bg-[#11141A] border-[#1F242D]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F3F4F6]">
                3. Clear Sky Reference
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1F242D] text-[#8A94A6] border border-[#1F242D]">
                Optional
              </span>
            </div>
            <p className="text-[11px] text-[#8A94A6]">
              Ground-truth clear photo for PSNR/SSIM calculation.
            </p>

            <label className="flex flex-col items-center justify-center h-36 rounded-lg border border-dashed border-[#1F242D] hover:border-[#10B981]/50 bg-[#090B0E] cursor-pointer transition-colors relative overflow-hidden group">
              {customReference ? (
                <>
                  <img
                    src={customReference}
                    alt="Custom Reference"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#090B0E]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-[#F3F4F6] font-medium">
                      Replace Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 space-y-1.5">
                  <Sparkles className="w-6 h-6 text-[#8A94A6] mx-auto" />
                  <span className="text-xs font-medium text-[#F3F4F6] block">
                    Choose or drop Reference
                  </span>
                  <span className="text-[10px] text-[#8A94A6] font-mono block">
                    If omitted: Qualitative mode
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "reference")}
                className="hidden"
              />
            </label>

            <div className="text-[10px] font-mono text-[#8A94A6] truncate">
              {customReferenceName ||
                (isCustomMode
                  ? "None (Qualitative Assessment)"
                  : "Using benchmark clear reference")}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION & STEP CTA */}
      <div className="bg-[#11141A] border border-[#1F242D] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-[#F3F4F6] flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#10B981]" />
            <span>Ready for Sensor Preprocessing &amp; Masking</span>
          </div>
          <p className="text-[11px] text-[#8A94A6] font-mono">
            {isCustomMode
              ? `Custom rasters loaded (${customOptical ? "Optical ✓" : "Optical ✗"}, ${customSar ? "SAR ✓" : "SAR ✗"})`
              : `Selected benchmark: ${selectedSample.name} (${selectedSample.region})`}
          </p>
        </div>

        <button
          onClick={handleProceed}
          disabled={loading || (isCustomMode && (!customOptical || !customSar))}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-[#090B0E] font-semibold text-xs tracking-wide transition-colors disabled:opacity-50 shrink-0"
        >
          <span>{loading ? "Initializing..." : "Proceed to Preprocess & Mask"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function UploadDatasetPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs font-mono text-[#8A94A6]">
          Loading Workstation Dataset Ingestion...
        </div>
      }
    >
      <UploadDatasetContent />
    </Suspense>
  );
}
