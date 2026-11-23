---
title: TerraClear-AI Multimodal Cloud Removal
emoji: 🛰️
colorFrom: green
colorTo: blue
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
---

# TerraClear AI — Multimodal Satellite Image Restoration Space

SAR-guided deep generative restoration of cloudy Sentinel-2 optical imagery using Sentinel-1 Synthetic Aperture Radar (SAR), trained and benchmarked on the SEN12MS-CR-TS dataset.

## How It Works
1. **Inputs:**
   - Sentinel-2 cloudy optical image (RGB)
   - Sentinel-1 SAR dual-pol backscatter radar image
   - (Optional) Cloud segmentation mask
   - (Optional) Clear optical reference image
2. **Model:**
   - PyTorch U-Net Generator with skip connections and multi-channel tensor fusion.
3. **Outputs:**
   - Synthesized cloud-free optical image
   - Measured PSNR (dB)
   - Measured SSIM

## Deploy to Hugging Face Spaces
1. Create a new Space on [huggingface.co/new-space](https://huggingface.co/new-space) (choose **Gradio** SDK).
2. Push the files in this directory (`app.py`, `requirements.txt`, `README.md`) to your Space repository.
3. Once the Space is running (e.g. `your-username/terraclear-ai-space`), add it to your Next.js `.env.local`:
   ```bash
   HF_SPACE_NAME=your-username/terraclear-ai-space
   ```
4. The Next.js API route `/api/reconstruct` will automatically connect to this Space via `@gradio/client`!
