# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: plain static HTML/CSS/JS, no framework, no build step. Chosen because the site's
central claim is engineering restraint (a 17 kB layout engine that ships no WASM), and shipping
a heavy SPA to render a dozen project cards would contradict the portfolio it presents. Also
deploys to GitHub Pages with zero configuration and no cold starts.

Deploy target: new GitHub repo `BaselAshraf81/BaselAshraf81.github.io`, served at
`https://baselashraf81.github.io`. The pre-existing site at `baselai.vercel.app`
(repo `Basel-Ashraf`) is left untouched.

## Users

Primary: engineering hiring managers, technical founders, and senior engineers who land here
from a GitHub profile link, a resume, or a Reddit/HN comment, and who decide within one
viewport whether this person builds real things. They are skimming, skeptical of student
portfolios, and looking for evidence rather than adjectives.

Secondary: technical peers arriving from a specific artifact (r/InternetIsBeautiful,
r/LocalLLM, npm, docs.rs) who want the demo or the repo immediately, not a biography.

Assumption (user delegated this decision): the two audiences are served by one surface that
leads with shipped, running work rather than with credentials.

## Product Purpose

A personal site for Basel Ashraf Fikry that converts a skeptical skim into either a hire
conversation or a click into a live artifact. Success is the visitor opening a real thing:
eigendrum.com, prolifictea.com, a repo, or the layout-sans demo.

## Positioning

An undergraduate who ships production software that strangers actually use, and who has the
numbers to prove it: a browser finite-element physics simulation with 150 stars and a DOI citation,
a layout engine that outperforms Meta's Yoga while shipping 18x less code, a review platform
with 100,000+ page views, and a merged upgrade PR in a third-party OSS framework released the same day.

## Operating Context

Visitors arrive on desktop and mobile, often from a link in a comment thread or a resume PDF.
Many arrive with a specific artifact already in mind. The site is read in under a minute in
most sessions.

## Capabilities and Constraints

Static site, no backend, no analytics requirement, no CMS. Must work with JavaScript disabled
for all content and navigation. All outbound project links must resolve; dead deployments are
excluded rather than linked.

Excluded because the deployment is dead (verified 2026-08-13): threatalert.live,
prolificblocklist.vercel.app, opensplinevercel.app.

Excluded as noise, per the user's instruction to discard weak material: university coursework
repos (CSE433, CSE434, CFG-TO-PDA, project), tutorial-program repos (PRODIGY_ML_*,
Car_Price_Predicion, Fruits-and-Vegetables-recognizer, MedicalTreatmentRAG), forks Basel did
not author (ChatTTS, insanely-fast-whisper, youtube-uploader, OAR-Tool, pluely), and
unlaunched or zero-traction projects (WriteNova, mena-investiq, socialmarket-mvp, LeafSense,
badmintoneg, vercel2, TheWiseKitten, ruki, Genzified, FastPeopleSearchScraper,
MYPORTALMONITORER, private-prompts, vsclaude, battlebots, spline, skiagram).

## Brand Commitments

Name: Basel Ashraf (goes by BaselAshraf81 online). GitHub bio, treated as his own voice:
"making software free again". ProlificTea's own stated ethos is binding and consistent with
this: no company, no investors, no ads, free forever, community-funded.

Voice: plain, specific, unembellished. Numbers over adjectives. No hype.

Existing handles: github.com/BaselAshraf81, linkedin.com/in/basel-askar,
x.com/BaselAshraf81, reddit.com/user/Sad_Steak_6813.

## Evidence on Hand

All figures below were independently verified on 2026-08-13/2026-08-21 and are the only quantitative
claims the site may make. Nothing here may be rounded up or embellished.

GitHub profile: 32 public repos, 8 followers, joined March 2023.

Stars: eigendrum 150 (DOI 10.5281/zenodo.22019539), layout-sans 67 (2 forks), holystitch 23 (2 forks), vibellm 12,
html-in-3d 5, epstein-rag-abliterated-llm 4, photophane 3, lineridervisualizer 3.

layout-sans, from its own README benchmark table: 100 boxes 0.27 ms vs 8.0 ms DOM vs 0.80 ms
Yoga; 10,000 boxes 4.82 ms vs 800 ms DOM vs 8.0 ms Yoga; 100,000 variable-height 46 ms vs DOM
crashes vs 85 ms Yoga; ~17 kB gzipped vs Yoga's 300+ kB. Published on npm. Runs on Node, Bun,
Deno, Cloudflare Workers, browser. Zero dependencies. Built on chenglou/pretext.
Note: npm downloads are ~900 for the trailing year. Deliberately not published on the site,
because the figure is weak and would undercut the star count and the benchmark.

ProlificTea (prolifictea.com, live, HTTP 200): the site itself reports 100,000+ page views and
1,582 researchers indexed. Chrome extension, PWA push, threaded comments, image uploads, admin
moderation.

Nextron PR #531, verified via GitHub API: state MERGED, merged 2026-03-23, 33 files changed,
+1218 / -416, "Upgrade to Next.js 16 and React 19 with Turbopack compatibility", released as
nextron@9.6.0.

fastemporal: Rust reimplementation of Luxon, published to docs.rs (live, HTTP 200), 332
passing tests ported from Luxon, date-fns and TC39 Temporal conformance suites.

Reddit traction (r/ archive, verified): eigendrum 219 upvotes / 31 comments on
r/InternetIsBeautiful; ProlificTea 158 and 117 upvotes on r/ProlificAc; vibellm 57 on
r/LocalLLM; photophane 72 on r/photogrammetry; fx-inject-shim 21 on r/firefox.

Legal RAG: repo epstein-rag-abliterated-llm, 25,303 documents, hybrid search, 230+ concurrent
users on a single T4 GPU with a custom request queue. Decision (user delegated): present it by
its engineering, under the neutral label "legal document RAG", link the repo so the name is
discoverable but do not foreground the political subject matter.

M-Pesa: stored XSS in the PDF receipt generator via font descriptor injection, accepted
through HackerOne. Self-reported and not publicly verifiable; no CVE or public disclosure URL
was found. State it as a reported and accepted finding, not as a published advisory.

Live and verified (HTTP 200): eigendrum.com, prolifictea.com,
docs.rs/fastemporal, baselashraf81.github.io/photophane/, baselashraf81.github.io/blackhole/,
baselashraf81.github.io/layout-sans/demo/interactive-text.html.

Education: BSc Computer Engineering and Software Systems, dual degree, University of East
London and Ain Shams University, Feb 2021 to expected Nov 2026. Università di Pisa graduate
summer school, Sep 2025, scholarship, 29/30. Hanyang University exchange, Seoul,
Sep 2024 to Jan 2025, GPA 4.0/4.5.

Contact: u2679054@uel.ac.uk. Decision (user delegated): the phone number on the resume is
omitted from this public page; email ships as a mailto.

No photograph of Basel is available in the workspace. No testimonials, press quotes, revenue
figures, or customer names exist. None may be invented.

## Product Principles

1. Evidence over adjective. Every claim on the surface carries a number, a link, or both, and
   every number traces to the Evidence section above.
2. Link to the running thing. A visitor should always be one click from software they can use,
   not from a description of it.
3. Cut rather than pad. A weak project omitted makes the strong ones legible; the repo count
   is not the achievement.
4. Report figures at their true size. No rounding up, no "viral", no implied scale the
   evidence does not support.
5. Restraint is the argument. The site's own weight and speed are part of the portfolio.

## Accessibility & Inclusion

No client-specific standard was established, so the general floor applies: full keyboard
operability, visible focus, semantic landmarks and headings, WCAG AA contrast, respect for
prefers-reduced-motion, and all content available without JavaScript. layout-sans itself
ships screen-reader accessibility, so an inaccessible site would contradict the work it
presents.
