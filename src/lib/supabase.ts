import { createClient } from "@supabase/supabase-js";

// Retrieve Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

// Create Supabase client instance
export const supabase = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseKey || "placeholder-key"
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

export interface ProjectMetadata {
  dimensions: { width: number; height: number };
  optical_bands: string[];
  sar_channels: string[];
  resolution_meters: number;
  crs: string;
  cloud_coverage_percent?: number;
  optical_filename?: string;
  sar_filename?: string;
  reference_filename?: string;
  is_sample?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  optical_url: string;
  sar_url: string;
  reference_url?: string | null;
  cloud_mask_url?: string | null;
  status: "created" | "preprocessed" | "masked" | "reconstructing" | "completed";
  metadata: ProjectMetadata;
  created_at: string;
  updated_at?: string;
}

export interface ModelCheckpoint {
  id: string;
  name: string;
  architecture: "unet_patchgan" | "cnn_only" | "interpolation";
  version: string;
  description: string;
  metrics: {
    avg_psnr: number;
    avg_ssim: number;
    epochs?: number;
    loss_generator?: number;
    loss_discriminator?: number;
    loss_l1?: number;
    inference_speed_ms?: number;
    parameters_m?: number;
  };
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface Reconstruction {
  id: string;
  project_id: string;
  checkpoint_id?: string | null;
  reconstructed_url?: string | null;
  cloud_mask_url?: string | null;
  metrics: {
    psnr?: number | null;
    ssim?: number | null;
    mae?: number | null;
    rmse?: number | null;
    inference_time_ms?: number | null;
    qualitative_assessment: boolean;
  };
  comparison_data: {
    interpolation: { psnr: number; ssim: number };
    cnn_only: { psnr: number; ssim: number };
    unet_patchgan: { psnr: number; ssim: number };
  };
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

// ==============================================================================
// FALLBACK SEED CHECKPOINTS (Used if Supabase is offline / pending schema run)
// ==============================================================================
export const SEED_CHECKPOINTS: ModelCheckpoint[] = [
  {
    id: "checkpoint-unet-patchgan-v2",
    name: "U-Net + PatchGAN (SAR-Guided GAN)",
    architecture: "unet_patchgan",
    version: "v2.1",
    description:
      "Primary adversarial generator network trained on SEN12MS-CR-TS dataset. Fuses 4-band optical and 2-channel SAR inputs with multiscale 70x70 PatchGAN discrimination.",
    metrics: {
      avg_psnr: 29.84,
      avg_ssim: 0.892,
      epochs: 150,
      loss_generator: 0.041,
      loss_discriminator: 0.018,
      inference_speed_ms: 340,
      parameters_m: 54.2,
    },
    is_active: true,
    is_default: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "checkpoint-cnn-only-v1",
    name: "CNN-Only Baseline (U-Net L1 Loss)",
    architecture: "cnn_only",
    version: "v1.4",
    description:
      "Standard U-Net encoder-decoder trained solely with L1 pixel-reconstruction loss without adversarial PatchGAN supervision.",
    metrics: {
      avg_psnr: 26.15,
      avg_ssim: 0.814,
      epochs: 100,
      loss_l1: 0.068,
      inference_speed_ms: 195,
      parameters_m: 31.0,
    },
    is_active: true,
    is_default: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "checkpoint-interpolation-v1",
    name: "SAR-Guided Bicubic / Spatiotemporal Interpolation",
    architecture: "interpolation",
    version: "v1.0",
    description:
      "Non-deep learning baseline utilizing SAR structural edge weights and cloud boundary bicubic filling.",
    metrics: {
      avg_psnr: 21.4,
      avg_ssim: 0.685,
      inference_speed_ms: 45,
      parameters_m: 0,
    },
    is_active: true,
    is_default: false,
    created_at: new Date().toISOString(),
  },
];

export interface SampleScene {
  id: string;
  name: string;
  region: string;
  landscape: string;
  cloudPercent: number;
  opticalUrl: string;
  sarUrl: string;
  referenceUrl: string;
  maskUrl: string;
  reconUrl: string;
  description: string;
}

export const SEN12MS_SAMPLE_SCENES: SampleScene[] = [
  {
    id: "sen12ms-agri-408",
    name: "Agricultural Basin",
    region: "Rhine Valley, Europe (ROI #408)",
    landscape: "Cropland & River",
    cloudPercent: 42.5,
    opticalUrl: "/samples/sample_agri_optical.png",
    sarUrl: "/samples/sample_agri_sar.png",
    referenceUrl: "/samples/sample_agri_ref.png",
    maskUrl: "/samples/sample_agri_mask.png",
    reconUrl: "/samples/sample_agri_recon.png",
    description: "Intense cumulus cloud clusters over river basin and agricultural field mosaics.",
  },
  {
    id: "sen12ms-coastal-215",
    name: "Coastal Urban Port",
    region: "Mediterranean Coast (ROI #215)",
    landscape: "Urban & Ocean",
    cloudPercent: 36.8,
    opticalUrl: "/samples/sample_coastal_optical.png",
    sarUrl: "/samples/sample_coastal_sar.png",
    referenceUrl: "/samples/sample_coastal_ref.png",
    maskUrl: "/samples/sample_coastal_mask.png",
    reconUrl: "/samples/sample_coastal_recon.png",
    description: "Marine cloud coverage over dense coastal shipping port and urban street grid.",
  },
  {
    id: "sen12ms-alpine-703",
    name: "Alpine Forest & Ridge",
    region: "Bavarian Alps, Europe (ROI #703)",
    landscape: "Montane & Forest",
    cloudPercent: 48.2,
    opticalUrl: "/samples/sample_alpine_optical.png",
    sarUrl: "/samples/sample_alpine_sar.png",
    referenceUrl: "/samples/sample_alpine_ref.png",
    maskUrl: "/samples/sample_alpine_mask.png",
    reconUrl: "/samples/sample_alpine_recon.png",
    description: "High-altitude cloud layer obscuring alpine forest valleys and mountain ridges.",
  },
];

// Default sample project data for one-click loading
export const DEFAULT_SAMPLE_PROJECT: Omit<Project, "id" | "created_at"> = {
  name: "SEN12MS-CR Sample Scene #408",
  description:
    "Agricultural & river basin scene with heavy cumulus cloud cover (~42%) paired with Sentinel-1 dual-pol SAR backscatter.",
  optical_url: "/samples/sample_cloudy_optical.png",
  sar_url: "/samples/sample_sar.png",
  reference_url: "/samples/sample_clear_reference.png",
  cloud_mask_url: "/samples/sample_cloud_mask.png",
  status: "created",
  metadata: {
    dimensions: { width: 256, height: 256 },
    optical_bands: ["B02 (Blue)", "B03 (Green)", "B04 (Red)", "B08 (NIR)"],
    sar_channels: ["VV", "VH"],
    resolution_meters: 10,
    crs: "EPSG:4326 (WGS 84)",
    cloud_coverage_percent: 42.5,
    optical_filename: "sample_cloudy_optical.png",
    sar_filename: "sample_sar.png",
    reference_filename: "sample_clear_reference.png",
    is_sample: true,
  },
};

// ==============================================================================
// LOCAL STORAGE PERSISTENCE HELPERS (Reliable Fallback)
// ==============================================================================
const LOCAL_STORAGE_KEY = "terraclear_projects_cache";

// In-memory fallback caches to protect against browser localStorage 5MB quota limits
let inMemoryProjects: Project[] = [];
let inMemoryReconstructions: Reconstruction[] = [];

function getLocalProjects(): Project[] {
  if (typeof window === "undefined") return inMemoryProjects;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed: Project[] = raw ? JSON.parse(raw) : [];
    // Merge with in-memory projects
    const ids = new Set(parsed.map((p) => p.id));
    for (const mem of inMemoryProjects) {
      if (!ids.has(mem.id)) {
        parsed.unshift(mem);
      }
    }
    return parsed;
  } catch {
    return inMemoryProjects;
  }
}

function saveLocalProjects(projects: Project[]) {
  inMemoryProjects = projects;
  if (typeof window === "undefined") return;
  try {
    // Only cache up to 3 most recent projects to protect quota
    const trimmed = projects.slice(0, 3);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    // Quota reached: try clearing old cache and saving only the latest 1 project
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects.slice(0, 1)));
    } catch {
      // Gracefully continue using in-memory state without crashing
    }
  }
}

// ==============================================================================
// DATA ACCESS FUNCTIONS
// ==============================================================================

/**
 * Fetch all projects from Supabase with graceful localStorage fallback
 */
export async function getProjects(): Promise<Project[]> {
  const localProjects = getLocalProjects();

  if (!isSupabaseConfigured) {
    return localProjects;
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Supabase query error or empty, using local cache:", error?.message);
      return localProjects;
    }

    // Merge supabase data with local items if any
    const existingIds = new Set(data.map((p) => p.id));
    const merged = [...data];
    for (const p of localProjects) {
      if (!existingIds.has(p.id)) {
        merged.push(p);
      }
    }
    return merged;
  } catch (err) {
    console.warn("Supabase fetch failed, falling back to local storage:", err);
    return localProjects;
  }
}

/**
 * Fetch a single project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const localProjects = getLocalProjects();
  const localMatch = localProjects.find((p) => p.id === id);

  if (!isSupabaseConfigured) {
    return localMatch || null;
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return localMatch || null;
    }
    return data as Project;
  } catch {
    return localMatch || null;
  }
}

/**
 * Create a new project in Supabase and sync to local cache
 */
export async function createProject(
  projectData: Omit<Project, "id" | "created_at">
): Promise<Project> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `proj-${Date.now()}`;
  const now = new Date().toISOString();

  const newProject: Project = {
    ...projectData,
    id,
    created_at: now,
  };

  // Always save in localStorage cache
  const current = getLocalProjects();
  const updated = [newProject, ...current.filter((p) => p.id !== id)];
  saveLocalProjects(updated);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            id: newProject.id,
            name: newProject.name,
            description: newProject.description,
            optical_url: newProject.optical_url,
            sar_url: newProject.sar_url,
            reference_url: newProject.reference_url,
            cloud_mask_url: newProject.cloud_mask_url,
            status: newProject.status,
            metadata: newProject.metadata,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return data as Project;
      }
      if (error) {
        console.warn("Supabase insert warning:", error.message);
      }
    } catch (err) {
      console.warn("Supabase insert exception, using local record:", err);
    }
  }

  return newProject;
}

/**
 * Update project fields in Supabase and local cache
 */
export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | null> {
  // Update local cache first
  const current = getLocalProjects();
  const idx = current.findIndex((p) => p.id === id);
  let updatedRecord: Project | null = null;

  if (idx !== -1) {
    updatedRecord = {
      ...current[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    current[idx] = updatedRecord;
    saveLocalProjects(current);
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        return data as Project;
      }
    } catch (err) {
      console.warn("Supabase update error:", err);
    }
  }

  return updatedRecord;
}

/**
 * Upload an image file to the Supabase storage bucket 'satellite-images'
 * Falls back to an Object URL / Data URL if Supabase storage is unavailable.
 */
export async function uploadSatelliteImage(
  file: File,
  folder: string = "uploads"
): Promise<{ url: string; width: number; height: number }> {
  const fileExt = file.name.split(".").pop() || "png";
  const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  // Read dimensions using client Image object if in browser
  const dimensions = await getImageDimensions(file);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from("satellite-images")
        .upload(uniqueName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("satellite-images").getPublicUrl(data.path);
        return {
          url: publicUrl,
          width: dimensions.width,
          height: dimensions.height,
        };
      }
      console.warn("Storage upload notice:", error?.message);
    } catch (e) {
      console.warn("Supabase storage error:", e);
    }
  }

  // Fallback: convert to base64 Data URL so it is fully self-contained and persistent
  const dataUrl = await fileToDataUrl(file);
  return {
    url: dataUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Helper: extract image width & height from a browser File
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ width: 256, height: 256 });
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth || 256, height: img.naturalHeight || 256 });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve({ width: 256, height: 256 });
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==============================================================================
// RECONSTRUCTION DATA HELPERS
// ==============================================================================
const RECONSTRUCTIONS_STORAGE_KEY = "terraclear_reconstructions_cache";

export function getLocalReconstructions(projectId?: string): Reconstruction[] {
  let list: Reconstruction[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(RECONSTRUCTIONS_STORAGE_KEY);
      list = raw ? JSON.parse(raw) : [];
    } catch {
      list = inMemoryReconstructions;
    }
  } else {
    list = inMemoryReconstructions;
  }

  // Merge with in-memory cache
  const ids = new Set(list.map((r) => r.id));
  for (const mem of inMemoryReconstructions) {
    if (!ids.has(mem.id)) {
      list.unshift(mem);
    }
  }

  if (projectId) {
    return list.filter((r) => r.project_id === projectId);
  }
  return list;
}

export function saveLocalReconstruction(rec: Reconstruction) {
  inMemoryReconstructions = [rec, ...inMemoryReconstructions.filter((r) => r.id !== rec.id)];
  if (typeof window === "undefined") return;
  try {
    const list = getLocalReconstructions();
    const updated = [rec, ...list.filter((r) => r.id !== rec.id)].slice(0, 3);
    localStorage.setItem(RECONSTRUCTIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    try {
      localStorage.removeItem(RECONSTRUCTIONS_STORAGE_KEY);
      localStorage.setItem(RECONSTRUCTIONS_STORAGE_KEY, JSON.stringify([rec]));
    } catch {
      // Gracefully continue using in-memory state
    }
  }
}

export async function saveReconstruction(
  data: Omit<Reconstruction, "id" | "created_at">
): Promise<Reconstruction> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `rec-${Date.now()}`;
  const now = new Date().toISOString();

  const record: Reconstruction = {
    ...data,
    id,
    created_at: now,
  };

  saveLocalReconstruction(record);

  if (isSupabaseConfigured) {
    try {
      const { data: inserted, error } = await supabase
        .from("reconstructions")
        .insert([record])
        .select()
        .single();
      if (!error && inserted) {
        return inserted as Reconstruction;
      }
    } catch (e) {
      console.warn("Supabase reconstruction insert notice:", e);
    }
  }

  return record;
}

export async function getReconstructionsByProject(
  projectId: string
): Promise<Reconstruction[]> {
  const localList = getLocalReconstructions(projectId);
  if (!isSupabaseConfigured) return localList;

  try {
    const { data, error } = await supabase
      .from("reconstructions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Reconstruction[];
    }
    return localList;
  } catch {
    return localList;
  }
}

// ==============================================================================
// MODEL CHECKPOINTS HELPERS
// ==============================================================================
const CHECKPOINTS_STORAGE_KEY = "terraclear_checkpoints_cache";

export function getLocalCheckpoints(): ModelCheckpoint[] {
  if (typeof window === "undefined") return SEED_CHECKPOINTS;
  try {
    const raw = localStorage.getItem(CHECKPOINTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_CHECKPOINTS;
  } catch {
    return SEED_CHECKPOINTS;
  }
}

export function saveLocalCheckpoints(list: ModelCheckpoint[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHECKPOINTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save checkpoints locally:", e);
  }
}

export async function getModelCheckpoints(): Promise<ModelCheckpoint[]> {
  const local = getLocalCheckpoints();
  if (!isSupabaseConfigured) return local;

  try {
    const { data, error } = await supabase
      .from("model_checkpoints")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as ModelCheckpoint[];
    }
    return local;
  } catch {
    return local;
  }
}

export async function createModelCheckpoint(
  item: Omit<ModelCheckpoint, "id" | "created_at">
): Promise<ModelCheckpoint> {
  const id = `chk-${Date.now()}`;
  const now = new Date().toISOString();
  const record: ModelCheckpoint = { ...item, id, created_at: now };

  const current = getLocalCheckpoints();
  const updated = [record, ...current];
  saveLocalCheckpoints(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("model_checkpoints").insert([record]);
    } catch (e) {
      console.warn("Supabase checkpoint insert notice:", e);
    }
  }

  return record;
}

export async function toggleModelCheckpointActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const current = getLocalCheckpoints();
  const updated = current.map((c) => (c.id === id ? { ...c, is_active: isActive } : c));
  saveLocalCheckpoints(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("model_checkpoints")
        .update({ is_active: isActive })
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase checkpoint update notice:", e);
    }
  }
}


