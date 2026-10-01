Summit Broadband Authorized Retailer — static HTML site
=======================================================

Plain HTML/CSS/JS. No framework, no build step, no server code.

  index.html            Landing page
  legal/*.html          8 legal pages (+ 404.html)
  assets/css/           Compiled stylesheet (all animations, glows, gradients)
  assets/js/lenis.*.js  Smooth scrolling
  assets/js/site.*.js   Reveals, wipes, parallax, magnetic buttons, 3D tilt,
                        FAQ accordion, ZIP checker, scroll-spy, mobile menu
  vercel.json           Zero-build Vercel config (static, cache + security headers)
  assets/media/         Fonts, photography, favicon

Deploy on Vercel: "Add New Project" -> import this repository -> Deploy.
No build command or framework needed (vercel.json sets this up).
Also works on any static host (Netlify, S3, cPanel, GitHub Pages...).
All paths are relative.

Do not edit these files by hand. They are generated from the Next.js source:
update lib/content.ts (prices, plans, copy) and re-run  npm run export:html
