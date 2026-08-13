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

## Deployment — needs a decision

The page declares a canonical URL in three places (`<link rel=canonical>`,
`og:url`, and the JSON-LD `url`), currently pointing at
`https://baselashraf81.github.io/`. As of writing, nothing is published yet:
`baselashraf.dev` does not resolve, and both github.io URLs return 404.

Pick one and make all three agree:

- **Custom domain** (what the repo name implies) — point the DNS at GitHub, add
  a `CNAME` file containing `baselashraf.dev`, and change the three URLs to
  `https://baselashraf.dev/`.
- **User pages** — rename this repo to `BaselAshraf81.github.io`, and the
  current URLs become correct as they stand.

Leaving them disagreeing costs you the OpenGraph preview and lets Google index
the wrong address, so it is worth settling before sharing the link.

The outbound project links (`baselashraf81.github.io/photophane/`,
`/layout-sans/…`, `/blackhole/`) are project pages and are already live; they
are unaffected by either choice.
