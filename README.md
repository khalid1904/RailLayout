# Train Coach Planner

Combine multiple Indian Railways PNRs into one visual coach map. Built for group and family travel with live RailRadar PNR data, berth visualization, friendly names, nearby passengers, refresh with change detection, and PDF export.

## Features

- Live PNR lookup via secure server-side RailRadar integration
- Multi-PNR input with paste extraction
- Journey validation across PNRs
- Visual coach layout (Sleeper, AC 3-tier, AC 2-tier, Chair Car)
- Passenger metadata: display names, relationships, groups, notes
- Nearby passenger detection using coach layout
- Refresh with change detection
- A4 landscape PDF export
- PWA installable shell
- Browser-local persistence for trip metadata

## Local Development

### Prerequisites

- Node.js 18+ (Node 20+ recommended)
- A valid [RailRadar](https://railradar.in/docs) API key

### Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
RAILRADAR_API_KEY=your_private_key
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter real PNRs.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RAILRADAR_API_KEY` | Yes | Server-side RailRadar API key. Never expose to the browser. |

See `.env.example` for the template.

## Architecture

```
Browser → POST /api/pnr → PNRProvider → RailRadarPNRProvider → RailRadar API
                                              ↓
                                         Normalizer → Domain model → UI
```

- API key stays on the server only
- RailRadar-specific logic is isolated under `src/lib/pnr/railradar/`
- Coach layout logic lives in `src/lib/coach/`
- User metadata persists in localStorage via Zustand

## Vercel Deployment

### Step 1

Push the project to GitHub.

### Step 2

Open [Vercel](https://vercel.com).

### Step 3

Import the GitHub repository.

### Step 4

Use the detected Next.js settings.

### Step 5

Open **Project Settings → Environment Variables** and add:

```
Name:  RAILRADAR_API_KEY
Value: <your private RailRadar API key>
```

Enable for Production and Preview as needed.

### Step 6

Deploy.

### Step 7

Open the deployed URL.

### Step 8

Enter a real PNR.

### Step 9

Verify that `POST /api/pnr` returns live RailRadar data (check Network tab — the API key must not appear in responses).

## Security Notes

- `RAILRADAR_API_KEY` is never sent to the browser
- PNR numbers are masked in the UI (`••••1234`)
- PNR numbers are masked in development logs
- `/api/pnr` and `/api/pnrs` use rate limiting and short-lived caching
- User input is sanitized before storage

## Rate Limiting

The server applies per-IP rate limiting and a ~45 second PNR cache to reduce duplicate RailRadar calls. On Vercel serverless, limits apply per instance — avoid rapid repeated refreshes during development.

## No Demo Mode

This application does not include sample PNRs, mock railway data, or demo mode. All railway values come from live RailRadar API responses.

## License

Private — for personal/group travel planning.
