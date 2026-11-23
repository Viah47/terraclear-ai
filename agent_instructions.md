# ANTIGRAVITY INSTRUCTIONS — TERRACLEAR AI (SIMPLE VERCEL BUILD)

## 1. Tech Stack (Strict)
- Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- Backend/DB/Storage: `@supabase/supabase-js` ONLY (No Prisma, no Drizzle, no FastAPI).
- ML Integration: `@gradio/client` inside Next.js API Route Handlers (`/api/reconstruct`).
- NEVER install Python, `gdal`, `rasterio`, or `torch` in `package.json`.

## 2. Core Workflow Rules
- Maintain active `projectId` in URL query params (`?projectId=...`) across all 8 pages.
- Include a "Load Sample Scene" button on Page 02 using pre-bundled PNG pairs in `/public/samples/` so the app is testable immediately without uploading files.
- **Page 03 (Preprocessing):** Validate that Optical and SAR image widths/heights match before allowing the user to continue.
- **Page 04 (Cloud Detection):** Generate/display a cloud mask overlay and show Cloud % vs Clear %; require a "Confirm Mask" click before Page 05.
- **Page 05 (Reconstruction Lab):** Call `POST /api/reconstruct`. If `process.env.HF_SPACE_NAME` is not set yet, run a clean fallback mode (returns a blended preview + mock metrics) so the app works end-to-end before the PyTorch Space is live.
- **Page 06 (Evaluation):** Only display measured PSNR/SSIM if `reference_url` exists; otherwise display "Qualitative Assessment Only". Include comparison charts for: Interpolation vs Proposed, CNN-only vs CNN-GAN, and Optical-only vs Optical+SAR.
- **Page 07 (Results):** 4-panel grid (Original Optical, SAR, Cloud Mask, Reconstructed) + interactive before/after slider + download buttons (PNG + JSON metrics report).
- **Page 08 (Admin):** Accessible via a simple User/Admin toggle in the sidebar; displays dataset list, training loss chart, and model checkpoints table.

## 3. Build in 4 Short Phases (Stop after each phase)
- **Phase 1:** Setup Supabase client (`src/lib/supabase.ts`), SQL schema file (`supabase_schema.sql`), shared sidebar layout, and Page 01 (Dashboard) + Page 02 (Projects & Upload/Sample Loader).
- **Phase 2:** Build Page 03 (Preprocessing validation), Page 04 (Cloud Mask overlay), and Page 05 (Reconstruction Lab UI + `/api/reconstruct` route with fallback mode).
- **Phase 3:** Build Page 06 (Evaluation & Comparison charts), Page 07 (4-Panel Results + Slider + Export), and Page 08 (Admin Panel).
- **Phase 4:** Generate the standalone `hf-space/app.py` (Gradio + PyTorch U-Net + scikit-image PSNR/SSIM) and wire `@gradio/client` into `/api/reconstruct`.