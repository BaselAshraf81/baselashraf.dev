# baselashraf.com

Live portfolio: **[https://baselashraf.com](https://baselashraf.com/)**

A single-page engineering portfolio for Basel Ashraf. Static HTML/CSS/JS with no build step, no framework, and zero runtime dependencies. Open `index.html` and it runs.

```
index.html      the page (with Schema.org graph & SEO meta)
styles.css      the whole design system (dark glass + caustic optics)
caustic.js      the hero light field canvas simulation
llms.txt        machine-readable AI agent index (llmstxt.org spec)
media/*.webp    captures of the live projects
tools/          how those captures are made
PRODUCT.md      every claim on the page, with its verified source
```

## Running it locally

Any static file server:

```powershell
python -m http.server 8899
# then open http://localhost:8899
```

## The captures

`media/` holds screenshots of the real, deployed projects (Eigendrum, LayoutSans, Prolific Tea, Photophane). They are not mockups, and nothing in them has been retouched &mdash; the numbers visible inside them are the products reporting their own live figures.

They are generated in two steps:

```powershell
node tools/shoot.js            # drives headless Chrome over CDP -> shots/*.png
powershell tools/images.ps1    # crops and compresses -> media/*.webp
```

`tools/shoot.js` talks CDP directly rather than using `chrome --screenshot`, because these projects compute in the browser before there is anything to capture. Driving the protocol lets the script wait in real time, strike the drum, solve the mesh, and only then capture.

`shots/` is gitignored &mdash; those are raw PNGs. Only the compressed `media/` WebP versions ship.

## Deployment & Domain

- **Canonical URL**: `https://baselashraf.com/`
- **Hosting**: Deployed on **Vercel** with DNS managed via **Cloudflare**.
- **GitHub Pages mirror**: Redirects automatically to `https://baselashraf.com/` with deep-link preservation.

