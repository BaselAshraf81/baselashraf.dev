# baselashraf.dev

A single-page portfolio. Three static files, no build step, no framework, no
dependencies. Open `index.html` and it works.

```
index.html      the page
styles.css      the whole design system
caustic.js      the hero light field
media/*.webp    captures of the live projects (235 kB total)
tools/          how those captures are made
PRODUCT.md      every claim on the page, with its source
```

## Running it

Any static server will do:

```powershell
python -m http.server 8899
# then http://localhost:8899
```

## The captures

`media/` holds five screenshots of the real, deployed projects. They are not
mockups, and nothing in them has been retouched — the numbers visible inside
them are the products reporting their own figures.

They are regenerated in two steps:

```powershell
node tools/shoot.js            # drives headless Chrome over CDP -> shots/*.png
powershell tools/images.ps1    # crops and compresses -> media/*.webp
```

`tools/shoot.js` talks CDP directly rather than using `chrome --screenshot`,
because two of these projects compute for 10–45 seconds before there is
anything worth photographing. `--screenshot` fires at load and catches them
mid-solve; driving the protocol lets the script wait in real time, strike the
drum, and only then capture.

`shots/` is gitignored — those are multi-megabyte raw PNGs. Only the compressed
`media/` versions ship.

## Before the next commit

Two things are tracked that should not be:

```powershell
git rm -r --cached .kiro shots
```

`.kiro/` is editor tooling and `shots/` is ~14 MB of raw captures. Both are now
in `.gitignore`, but gitignore does not untrack what is already committed.

## Deployment

The portfolio is deployed to Vercel and served at `https://baselashraf.com/` via Cloudflare DNS. Canonical URLs, OpenGraph tags, and JSON-LD schema in `index.html` point to `https://baselashraf.com/`.

The outbound project links (`baselashraf81.github.io/photophane/`,
`/layout-sans/…`, `/blackhole/`) are individual project demo pages hosted on GitHub Pages.
