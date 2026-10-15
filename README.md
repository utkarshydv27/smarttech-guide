# SmartTech Guide — Practical Knowledge Hub

A responsive static website designed to help users find clear explanations and trusted starting points for everyday questions.

## Website URL

After GitHub Pages is enabled, the intended URL is:

https://utkarshydv27.github.io/smarttech-guide/

## Main features

- **Explore Topics:** Digital safety and privacy; AI and technology; careers and learning; government and digital services; money and digital payment safety; everyday information literacy.
- **Local Safety Check:** A browser-based phrase-pattern checklist for common suspicious-message warning signs. It is not a definitive scam detector, antivirus, or link scanner. Message text is not transmitted by this feature.
- **Knowledge Search:** Searches a curated index of guides and official resources in the browser. It does not use a server or send the query to a search provider.
- **Guides:** Practical explainers on suspicious messages, fake job offers, government services, viral-claim verification, AI tools, image compression and image formats.
- **Official resource directory:** Links to DigiLocker, myScheme, National Career Service, the National Cyber Crime Reporting Portal, PIB Fact Check and RBI.
- **Optional image utilities:** Image compressor, image resizer, format converter and images-to-PDF tool remain available as a secondary part of the website.

## Pages

- `index.html` — knowledge hub home page
- `learn.html` — topic directory and official links
- `safety-check.html` — local suspicious-message checklist
- `guides.html` — guide library
- `guide-digital-safety.html` — suspicious messages and cyber safety
- `guide-job-scams.html` — fake recruiter and job-offer warning signs
- `guide-government-services.html` — official service portal starting points
- `guide-check-claims.html` — how to verify viral claims
- `guide-ai-tools.html` — AI-tool evaluation
- `guide-image-compression.html`, `guide-image-formats.html` — optional image-related guides
- `tools.html` — optional browser-based image utilities
- `about.html`, `contact.html`, `privacy.html`, `disclaimer.html` — site information pages

## GitHub Pages deployment

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then select **Save**.
4. Wait for deployment, then open the intended URL above.

## Privacy and safety notes

- The Knowledge Search only filters a fixed index in the visitor's browser.
- The Safety Check matches a small set of text patterns in the browser. It is not an official determination and may miss scams or flag a legitimate message. Users should remove personal details before pasting text.
- Image utilities process selected images in the browser where supported.
- The images-to-PDF feature loads jsPDF from cdnjs and requires an internet connection.
- External services have their own terms and privacy practices. The site links to them as starting points and is not affiliated with the government or third-party organisations.

## Monetization status

No active AdSense code is included. AdSense requires a separate application, site review and policy compliance. If ad or analytics services are added later, review this site's privacy disclosure and placement before enabling them. Never click your own ads, encourage clicks or use bots/invalid traffic.

## QA checklist

- [x] Create home, topic directory, checker, guide pages and metadata files.
- [x] Check internal links in HTML files.
- [x] Check JavaScript syntax.
- [ ] Activate GitHub Pages and verify the deployed URL.
- [ ] Test the site on real desktop and mobile browsers.
- [ ] Test the safety checker with benign, suspicious and ambiguous examples; confirm its limitations are clearly displayed.
- [ ] Test every tool and download action.
- [ ] Check keyboard navigation, accessibility and page loading.
- [ ] Review information and linked official requirements when they change.

## Project status

Knowledge-hub redesign committed. Deployment and full browser/device acceptance testing remain.
