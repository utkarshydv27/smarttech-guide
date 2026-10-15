(() => {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const setStatus = (el, text, type = "") => {
    if (!el) return;
    el.textContent = text;
    el.className = "tool-status" + (type ? " " + type : "");
  };
  const formatBytes = (n) => {
    if (!Number.isFinite(n) || n < 0) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(2) + " MB";
  };
  const safeName = (name) => (name || "image").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "image";
  const loadImage = (file) => new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("Choose a valid image file."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be opened. Try another file.")); };
    img.src = url;
  });
  const canvasFor = (img, width, height, type) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not prepare the image canvas.");
    if (type === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  };
  const toBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Your browser could not export this format. Try JPG or PNG.")), type, quality);
  });
  const mimeFrom = (value) => ({jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", webp:"image/webp"})[value] || "image/jpeg";
  const extFrom = (mime) => mime === "image/jpeg" ? "jpg" : mime.split("/")[1] || "png";
  const preview = (wrap, img, file) => {
    if (!wrap) return;
    wrap.replaceChildren();
    const pic = document.createElement("img");
    pic.alt = "Selected image preview";
    pic.src = URL.createObjectURL(file);
    pic.onload = () => URL.revokeObjectURL(pic.src);
    wrap.appendChild(pic);
    wrap.classList.add("visible");
  };
  const revealDownload = (anchor, blob, filename) => {
    if (!anchor) return;
    if (anchor.dataset.objectUrl) URL.revokeObjectURL(anchor.dataset.objectUrl);
    const url = URL.createObjectURL(blob);
    anchor.dataset.objectUrl = url;
    anchor.href = url;
    anchor.download = filename;
    anchor.textContent = "Download " + filename;
    anchor.classList.add("visible");
  };
  const resetDownload = (anchor) => {
    if (!anchor) return;
    anchor.classList.remove("visible");
    if (anchor.dataset.objectUrl) URL.revokeObjectURL(anchor.dataset.objectUrl);
    delete anchor.dataset.objectUrl;
    anchor.removeAttribute("href");
  };

  const menuToggle = byId("menuToggle"), nav = byId("siteNav");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const opened = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(opened));
      menuToggle.setAttribute("aria-label", opened ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }));
  }
  const year = byId("year");
  if (year) year.textContent = new Date().getFullYear();

  const compressInput = byId("compressFile");
  if (compressInput) {
    const status = byId("compressStatus"), dl = byId("compressDownload"), q = byId("compressQuality"), qValue = byId("compressQualityValue"), outFormat = byId("compressFormat"), previewWrap = byId("compressPreview");
    if (q && qValue) q.addEventListener("input", () => qValue.textContent = q.value + "%");
    compressInput.addEventListener("change", () => {
      resetDownload(dl); previewWrap?.classList.remove("visible");
      const file = compressInput.files?.[0];
      if (file) setStatus(status, "Selected " + formatBytes(file.size) + ". Adjust quality and compress.");
    });
    byId("compressButton")?.addEventListener("click", async () => {
      const file = compressInput.files?.[0];
      resetDownload(dl);
      if (!file) return setStatus(status, "Choose an image first.", "error");
      try {
        setStatus(status, "Compressing in your browser…");
        const img = await loadImage(file);
        const mime = mimeFrom(outFormat?.value || "image/jpeg");
        const canvas = canvasFor(img, img.naturalWidth, img.naturalHeight, mime);
        const blob = await toBlob(canvas, mime, Math.max(.1, Math.min(1, Number(q?.value || 78) / 100)));
        const filename = safeName(file.name) + "-compressed." + extFrom(mime);
        revealDownload(dl, blob, filename);
        const percent = file.size ? Math.max(0, Math.round((1 - blob.size / file.size) * 100)) : 0;
        setStatus(status, "Done: " + formatBytes(file.size) + " → " + formatBytes(blob.size) + (blob.size < file.size ? " (" + percent + "% smaller)." : ". This format is not smaller for this image; try another quality or format."), "success");
        if (previewWrap) { previewWrap.replaceChildren(); const im = document.createElement("img"); im.alt = "Compressed image preview"; im.src = URL.createObjectURL(blob); im.onload = () => URL.revokeObjectURL(im.src); previewWrap.appendChild(im); previewWrap.classList.add("visible"); }
      } catch (e) { setStatus(status, e.message || "Compression failed. Try another image.", "error"); }
    });
  }

  const resizeInput = byId("resizeFile");
  if (resizeInput) {
    const status = byId("resizeStatus"), dl = byId("resizeDownload"), width = byId("resizeWidth"), height = byId("resizeHeight"), keep = byId("resizeKeep"), format = byId("resizeFormat");
    let original = null;
    resizeInput.addEventListener("change", async () => {
      resetDownload(dl); original = null;
      const file = resizeInput.files?.[0];
      if (!file) return;
      try {
        original = await loadImage(file);
        if (width) width.value = original.naturalWidth;
        if (height) height.value = original.naturalHeight;
        setStatus(status, "Original dimensions: " + original.naturalWidth + " × " + original.naturalHeight + " px.");
      } catch (e) { setStatus(status, e.message, "error"); }
    });
    const syncDimensions = (source) => {
      if (!original || !keep?.checked) return;
      const ratio = original.naturalWidth / original.naturalHeight;
      if (source === width && width) height.value = Math.max(1, Math.round(Number(width.value) / ratio));
      if (source === height && height) width.value = Math.max(1, Math.round(Number(height.value) * ratio));
    };
    width?.addEventListener("input", () => syncDimensions(width));
    height?.addEventListener("input", () => syncDimensions(height));
    byId("resizeButton")?.addEventListener("click", async () => {
      const file = resizeInput.files?.[0]; resetDownload(dl);
      if (!file) return setStatus(status, "Choose an image first.", "error");
      try {
        const img = original || await loadImage(file);
        const w = Math.round(Number(width?.value)), h = Math.round(Number(height?.value));
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 || w > 12000 || h > 12000 || w * h > 50000000) throw new Error("Use dimensions between 1 and 12,000 px, with no more than 50 million pixels.");
        setStatus(status, "Resizing in your browser…");
        const mime = mimeFrom(format?.value || "image/jpeg");
        const canvas = canvasFor(img, w, h, mime);
        const blob = await toBlob(canvas, mime, .92);
        const filename = safeName(file.name) + "-" + w + "x" + h + "." + extFrom(mime);
        revealDownload(dl, blob, filename);
        setStatus(status, "Ready: " + w + " × " + h + " px · " + formatBytes(blob.size) + ".", "success");
      } catch (e) { setStatus(status, e.message || "Resize failed.", "error"); }
    });
  }

  const convertInput = byId("convertFile");
  if (convertInput) {
    const status = byId("convertStatus"), dl = byId("convertDownload"), format = byId("convertFormat");
    convertInput.addEventListener("change", () => { resetDownload(dl); const f = convertInput.files?.[0]; if (f) setStatus(status, "Selected " + f.name + " (" + formatBytes(f.size) + ")."); });
    byId("convertButton")?.addEventListener("click", async () => {
      const file = convertInput.files?.[0]; resetDownload(dl);
      if (!file) return setStatus(status, "Choose an image first.", "error");
      try {
        setStatus(status, "Converting in your browser…");
        const img = await loadImage(file);
        const mime = mimeFrom(format?.value || "image/webp");
        const canvas = canvasFor(img, img.naturalWidth, img.naturalHeight, mime);
        const blob = await toBlob(canvas, mime, .92);
        const filename = safeName(file.name) + "-converted." + extFrom(mime);
        revealDownload(dl, blob, filename);
        setStatus(status, "Converted to " + extFrom(mime).toUpperCase() + " · " + formatBytes(blob.size) + ".", "success");
      } catch (e) { setStatus(status, e.message || "Conversion failed.", "error"); }
    });
  }

  const pdfInput = byId("pdfFiles");
  if (pdfInput) {
    const status = byId("pdfStatus"), dl = byId("pdfDownload"), previewWrap = byId("pdfPreview");
    pdfInput.addEventListener("change", () => {
      resetDownload(dl);
      const files = Array.from(pdfInput.files || []).filter(f => f.type.startsWith("image/"));
      if (previewWrap) { previewWrap.replaceChildren(); previewWrap.classList.remove("visible"); }
      setStatus(status, files.length ? files.length + " image(s) selected · " + formatBytes(files.reduce((n, f) => n + f.size, 0)) + " total." : "Choose one or more image files.");
      if (files.length && previewWrap) {
        const first = files[0], im = document.createElement("img"); im.alt = "First selected image preview"; im.src = URL.createObjectURL(first); im.onload = () => URL.revokeObjectURL(im.src); previewWrap.appendChild(im); previewWrap.classList.add("visible");
      }
    });
    byId("pdfButton")?.addEventListener("click", async () => {
      const files = Array.from(pdfInput.files || []).filter(f => f.type.startsWith("image/")); resetDownload(dl);
      if (!files.length) return setStatus(status, "Select at least one image first.", "error");
      if (!window.jspdf?.jsPDF) return setStatus(status, "The PDF library could not load. Check your internet connection and try again.", "error");
      try {
        setStatus(status, "Creating PDF in your browser…");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
        for (let i = 0; i < files.length; i++) {
          const img = await loadImage(files[i]);
          const canvas = canvasFor(img, img.naturalWidth, img.naturalHeight, "image/jpeg");
          const data = canvas.toDataURL("image/jpeg", .9);
          const pageW = 210, pageH = 297, margin = 8;
          const ratio = Math.min((pageW - margin * 2) / img.naturalWidth, (pageH - margin * 2) / img.naturalHeight);
          const w = img.naturalWidth * ratio, h = img.naturalHeight * ratio;
          if (i > 0) pdf.addPage();
          pdf.addImage(data, "JPEG", (pageW-w)/2, (pageH-h)/2, w, h, undefined, "FAST");
        }
        const blob = pdf.output("blob");
        revealDownload(dl, blob, "smarttech-images.pdf");
        setStatus(status, "PDF ready with " + files.length + " page(s) · " + formatBytes(blob.size) + ".", "success");
      } catch (e) { setStatus(status, e.message || "PDF creation failed. Try smaller images.", "error"); }
    });
  }

  document.querySelectorAll("[data-current-year]").forEach(el => el.textContent = new Date().getFullYear());
})();