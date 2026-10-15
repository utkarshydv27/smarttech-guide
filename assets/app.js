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

  // Local knowledge search: no query is transmitted to a server.
  const knowledgeItems = [
    {title:"Spot a suspicious message",description:"Common scam signs, suspicious links, credential requests and what to do next.",url:"guide-digital-safety.html",keywords:"scam fraud suspicious message otp pin password fake sms phishing cyber safety digital security bank parcel kyc"},
    {title:"Check a suspicious message",description:"Run a simple on-device checklist for common warning signs.",url:"safety-check.html",keywords:"checker scam check message text link suspicious job offer"},
    {title:"Avoid fake job offers",description:"Verify employers, avoid upfront fees and find official career resources.",url:"guide-job-scams.html",keywords:"career jobs recruiter interview resume work from home fake job fee employment ncs"},
    {title:"Find official government services",description:"Start with DigiLocker, myScheme, NCS and the National Cyber Crime Portal.",url:"guide-government-services.html",keywords:"government scheme digilocker document portal aadhaar form certificate scholarship service ncs myscheme"},
    {title:"Verify a viral claim",description:"Check the original source, date, context and supporting evidence.",url:"guide-check-claims.html",keywords:"fake news viral post forwarded message claim pib fact check misinformation news image"},
    {title:"Choose an AI tool",description:"Compare usefulness, free-plan limits, privacy and accuracy.",url:"guide-ai-tools.html",keywords:"ai artificial intelligence prompt privacy free tool writing coding study"},
    {title:"JPG, PNG or WebP",description:"Understand image formats and choose one for your task.",url:"guide-image-formats.html",keywords:"jpg png webp image photo format convert"},
    {title:"Compress an image",description:"Learn quality settings and compare the size and clarity of results.",url:"guide-image-compression.html",keywords:"image compression reduce size photo"},
    {title:"Government scheme finder",description:"Use the official myScheme portal to discover relevant schemes.",url:"https://www.myscheme.gov.in/",external:true,keywords:"scheme benefits eligibility government grant"},
    {title:"Digital documents",description:"Use the official DigiLocker document wallet.",url:"https://www.digitallocker.gov.in/",external:true,keywords:"digilocker digital document certificate marksheet"},
    {title:"Jobs and career support",description:"Visit India's National Career Service portal.",url:"https://www.ncs.gov.in/",external:true,keywords:"career job internship ncs employment"},
    {title:"Find scholarships",description:"Review scholarship schemes, the current academic year and official eligibility details.",url:"https://scholarships.gov.in/",external:true,keywords:"scholarship scholarships student funding education college university nsp"},
    {title:"Find online courses",description:"Explore courses on SWAYAM and check the current enrolment and certification details.",url:"https://swayam.gov.in/",external:true,keywords:"swayam free course courses online learning student education certificate college skill"},
    {title:"Report cybercrime",description:"Open India's official National Cyber Crime Reporting Portal.",url:"https://cybercrime.gov.in/",external:true,keywords:"report fraud cybercrime online payment 1930"},
    {title:"Government claim fact-check",description:"Open PIB Fact Check for suspicious government-related claims.",url:"https://factcheck.pib.gov.in/",external:true,keywords:"pib fact check government announcement viral"},
    {title:"All topics",description:"Browse Digital Safety, AI, Careers, Government Services, Money and Everyday Know-how.",url:"learn.html",keywords:"learn topic guide money payment financial basics"},
    {title:"Online tools",description:"Use image compression, resizing, conversion and image-to-PDF utilities.",url:"tools.html",keywords:"compress resize image pdf tool converter"}
  ];
  const searchForm = byId("siteSearchForm"), searchInput = byId("siteSearch"), searchResults = byId("siteSearchResults");
  if (searchForm && searchInput && searchResults) {
    const showSearchResults = () => {
      const query = searchInput.value.trim().toLowerCase();
      searchResults.replaceChildren();
      searchResults.hidden = false;
      if (!query) {
        const p = document.createElement("p");
        p.className = "search-empty";
        p.textContent = "Type a question or topic to search the guide library.";
        searchResults.appendChild(p);
        return;
      }
      const words = query.split(/\s+/).filter(Boolean);
      const found = knowledgeItems.map(item => {
        const corpus = (item.title + " " + item.description + " " + item.keywords).toLowerCase();
        const score = words.reduce((n, word) => n + (corpus.includes(word) ? 1 : 0), 0);
        return { ...item, score };
      }).filter(item => item.score > 0).sort((a,b)=>b.score-a.score).slice(0,6);
      if (!found.length) {
        const p = document.createElement("p");
        p.className = "search-empty";
        p.textContent = "No close match found. Try a shorter phrase such as “job scam”, “DigiLocker” or “AI privacy”.";
        searchResults.appendChild(p);
        return;
      }
      const head = document.createElement("div");
      head.className = "search-result-heading";
      head.textContent = "Helpful starting points";
      searchResults.appendChild(head);
      found.forEach(item => {
        const a = document.createElement("a");
        a.className = "search-result";
        a.href = item.url;
        if (item.external) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        const body = document.createElement("span");
        const title = document.createElement("b"); title.textContent = item.title;
        const desc = document.createElement("small"); desc.textContent = item.description;
        body.append(title, desc);
        const arrow = document.createElement("span"); arrow.className = "search-result-arrow"; arrow.textContent = item.external ? "↗" : "→";
        a.append(body, arrow);
        searchResults.appendChild(a);
      });
    };
    searchForm.addEventListener("submit", e => { e.preventDefault(); showSearchResults(); });
    searchInput.addEventListener("keydown", e => { if (e.key === "Escape") { searchResults.hidden = true; } });
  }

  // Simple, local phrase-pattern checklist — not a definitive scam detector.
  const messageInput = byId("messageToCheck"), checkButton = byId("checkMessageButton"), clearButton = byId("clearMessageButton"), checkResult = byId("messageCheckResult");
  if (messageInput && checkButton && checkResult) {
    const patterns = [
      {title:"Requests for passwords, OTPs or PINs",explain:"Never disclose an OTP, password, card PIN, CVV or UPI PIN to a caller or unverified site.",test: t => /\b(?:otp|one[- ]time password|upi pin|card pin|cvv|password|verification code)\b/i.test(t) && /\b(?:share|send|tell|provide|enter|confirm|verify|reply|give|update|submit)\b/i.test(t)},
      {title:"Urgency, threats or account-blocking language",explain:"Pause and verify unexpected threats or deadlines through a contact channel you find independently.",test: t => /\b(?:urgent|immediately|act now|final warning|last chance|within\s*\d+\s*(?:minute|hour|day)s?|account.{0,25}(?:block|suspend|freeze)|(?:block|suspend|freeze).{0,25}account|expire(?:s|d)? today|legal action|digital arrest)\b/i.test(t)},
      {title:"Links or shortened URLs",explain:"Do not open an unexpected link. Navigate to the organisation's known official website yourself.",test: t => /(?:https?:\/\/|www\.|\b(?:bit\.ly|tinyurl\.com|t\.me|wa\.me|cutt\.ly)\b)/i.test(t)},
      {title:"Upfront job fees or unrealistic earnings",explain:"Verify the employer independently. Treat money demanded to secure a job or guaranteed high earnings as a serious warning sign.",test: t => /\b(?:registration fee|processing fee|security deposit|pay.{0,20}(?:job|interview|training|to start)|(?:job|interview).{0,20}fee|guaranteed job|guaranteed income|earn\s*(?:₹|rs\.?|inr)?\s*\d+|work from home.{0,35}fee|captcha.{0,35}job)\b/i.test(t)},
      {title:"Prize, lottery or guaranteed-return claims",explain:"Unexpected prizes and promises of high or risk-free returns should be verified; do not pay to unlock a supposed reward.",test: t => /\b(?:you(?:'ve| have) won|claim.{0,20}(?:prize|reward|gift|cash)|lottery|lucky winner|guaranteed returns?|double your money|risk[- ]free profit|free gift)\b/i.test(t)},
      {title:"Remote access or screen-sharing request",explain:"Do not install remote-access software or share your screen at the request of an unknown caller.",test: t => /\b(?:anydesk|teamviewer|quick.?support|remote access|screen.?share|share your screen)\b/i.test(t)},
      {title:"Unexpected KYC or identity threat",explain:"Contact the bank or organisation through its official app/site, not by using a link in the message.",test: t => /\b(?:kyc.{0,25}(?:update|expire|block|verify)|aadhaar.{0,25}(?:block|expire|suspend)|pan card.{0,25}(?:block|expire)|bank.{0,25}(?:account blocked|suspend|kyc pending))\b/i.test(t)}
    ];
    const renderChecks = (text) => {
      const matches = patterns.filter(p => p.test(text));
      checkResult.replaceChildren();
      checkResult.hidden = false;
      const head = document.createElement("div");
      head.className = "checker-result-head " + (matches.length >= 3 ? "risk-high" : matches.length > 0 ? "risk-medium" : "risk-low");
      const h = document.createElement("h3");
      h.textContent = matches.length >= 3 ? "Several warning signs found" : matches.length > 0 ? "Some warning signs found" : "No common warning patterns detected";
      const p = document.createElement("p");
      p.textContent = matches.length >= 3 ? "Pause. Do not click links, send money or share information until you independently verify the request." : matches.length > 0 ? "Treat this message cautiously and verify it through a separate, official channel." : "This is not a safety certificate. Scams may use wording this checklist does not recognise.";
      head.append(h,p);
      checkResult.appendChild(head);
      if (matches.length) {
        const list = document.createElement("div"); list.className = "checker-flag-list";
        matches.forEach(match => {
          const row = document.createElement("div"); row.className = "checker-flag";
          const icon = document.createElement("span"); icon.className = "flag-mark"; icon.textContent = "!";
          const body = document.createElement("div");
          const title = document.createElement("b"); title.textContent = match.title;
          const desc = document.createElement("p"); desc.textContent = match.explain;
          body.append(title, desc); row.append(icon, body); list.appendChild(row);
        });
        checkResult.appendChild(list);
      } else {
        const note = document.createElement("p"); note.className = "checker-no-match";
        note.textContent = "Still verify the sender and destination independently. A legitimate-looking message can be fraudulent, and a dangerous message can avoid these patterns.";
        checkResult.appendChild(note);
      }
      const tail = document.createElement("p"); tail.className = "small-note";
      tail.textContent = "Local pattern check only. The message is not sent to a server by this feature.";
      checkResult.appendChild(tail);
    };
    checkButton.addEventListener("click", () => {
      const text = messageInput.value.trim();
      checkResult.hidden = true; checkResult.replaceChildren();
      if (!text) {
        const p = document.createElement("p"); p.className = "checker-validation"; p.textContent = "Paste a message with all personal and secret information removed, then check it.";
        checkResult.appendChild(p); checkResult.hidden = false; return;
      }
      renderChecks(text);
    });
    clearButton?.addEventListener("click", () => {
      messageInput.value = ""; checkResult.replaceChildren(); checkResult.hidden = true; messageInput.focus();
    });
  }

})();