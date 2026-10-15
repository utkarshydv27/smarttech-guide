# SmartTech Guide

A responsive static website with a professional white-and-blue theme, browser-based image tools, AI-tool guidance and original technology articles.

## Website

After GitHub Pages is enabled, the expected website address is:

https://utkarshydv27.github.io/smarttech-guide/

## Pages

- `index.html` — home page
- `tools.html` — image compressor, image resizer, image converter and images-to-PDF utility
- `ai-tools.html` — AI tool categories and evaluation tips
- `guides.html` — guide index
- `guide-image-compression.html`, `guide-image-formats.html`, `guide-ai-tools.html` — original educational guides
- `about.html`, `contact.html`, `privacy.html`, `disclaimer.html` — website information pages

## Hosting on GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then click **Save**.
4. Wait for GitHub Pages to deploy and open the URL above.

## Tool behavior

- Image compression, resize and conversion use browser canvas APIs. Selected files are designed to be processed locally in the visitor's browser.
- Images-to-PDF uses jsPDF loaded from cdnjs. It requires an internet connection to load the library.
- Keep original files when quality matters and test large files on the target device.

## Monetization status

No active ad code is included in this version. AdSense requires separate account/site review and proper implementation after approval. Do not click your own ads, encourage clicks, use bots, or buy invalid traffic. Update the privacy policy before adding advertising or analytics services.

## Test checklist

- [ ] Open all pages and check navigation on desktop and mobile.
- [ ] Test compression with JPG, PNG and WebP files.
- [ ] Check image dimensions and output for resizing.
- [ ] Check each supported conversion format in your target browser.
- [ ] Test Images-to-PDF with one image and several images.
- [ ] Check all download links, external links and the 404 page.
- [ ] Confirm the deployed URL and Search Console indexing.
- [ ] Review accessibility, page speed and current privacy information before applying for monetization.

## Project status

Initial static website committed. Manual GitHub Pages activation and real browser/device testing are still required.
