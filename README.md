# Promotion Footprint

Evidence-first competitor marketing intelligence built with Next.js and designed for Vercel.

## What it does

Enter a company or product and the app runs independent public-source observers for Google, Meta, LinkedIn, YouTube and TikTok. It normalizes the observations, ranks the visible channel footprint, detects simple recurring themes, and keeps an evidence URL beside each finding.

The system deliberately reports a **publicly observable footprint**, not "every ad" and not advertising ROI. A missing observation is never treated as proof that a company does not use a channel.

## Observers

- **Google:** public Google search discovery.
- **Meta:** public Ad Library surface; optionally the Meta Ads Archive API when `META_ACCESS_TOKEN` is configured.
- **LinkedIn:** public Ad Library surface.
- **YouTube:** public search surface; optionally the YouTube Data API when `YOUTUBE_API_KEY` is configured.
- **TikTok:** public search surface.
- **Website:** direct fetch when the input is a full `https://...` URL.

Some public pages actively restrict automated requests. The code handles those failures independently so one blocked platform does not abort the report.

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For stronger data, copy `.env.example` to `.env.local` and configure the optional API keys.

## Vercel

This is intentionally a Next.js application so it can be deployed directly to Vercel. The analysis route uses the Node.js runtime and a short execution window. This is appropriate for the MVP's small number of observers. If the product grows into long-running crawls, historical re-scans, or hundreds of sources, move collection into a queue/worker service and keep Vercel as the UI/API layer.

## Architecture

```text
Next.js UI
    |
    v
POST /api/analyze
    |
    +--> Google observer
    +--> Meta observer + optional Ads Archive API
    +--> LinkedIn observer
    +--> YouTube observer + optional Data API
    +--> TikTok observer
    +--> Website observer
    |
    v
Normalized observations
    |
    v
Channel scoring + theme detection
    |
    v
Evidence-backed report
```

## Important limitation

The public-web observers are intentionally conservative. They do not pretend that a successful fetch of a platform's search page means a paid campaign exists. Paid findings should come from an explicit advertising source (for example an ad library or API) and organic findings from public content/search evidence.

## Next milestones

1. Add a search-provider adapter for reliable account/domain discovery.
2. Improve platform-specific parsing and pagination.
3. Add persistence for historical observations.
4. Add scheduled re-scans and channel momentum.
5. Add campaign clustering and LLM-assisted summaries with citations to stored evidence.
