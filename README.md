# WordReference Client

An unofficial dictionary and translation client that fetches WordReference results on the server and presents them in a Next.js interface.

## What it does

- Choose a source and target dictionary and search for a term.
- Get autocomplete suggestions while typing.
- Display parsed translation results.
- Save recent searches and adjust appearance preferences.

## Run locally

Use Node.js 20.9+ and Bun.

```bash
git clone https://github.com/SpyC0der77/wordreferenceclient.git
cd wordreferenceclient
bun install --frozen-lockfile
bun run dev
```

Open [localhost:3000](http://localhost:3000).

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Build the production app |
| `bun run start` | Serve a production build |
| `bun run lint` | Run ESLint |

Run `build` before `start`.

## Dependencies and limitations

No WordReference API key is used. The server fetches and parses WordReference HTML, so changes to the upstream markup or availability can affect results. This project is not affiliated with WordReference.

## Source layout

- [`components/search/search-app.tsx`](components/search/search-app.tsx): Search interface.
- [`lib/wordreference/`](lib/wordreference/): Fetching and parsing dictionary results.
- [`app/api/translate/route.ts`](app/api/translate/route.ts): Translation endpoint.
- [`app/api/autocomplete/route.ts`](app/api/autocomplete/route.ts): Autocomplete endpoint.

## Cloudflare deployment

The repo includes an OpenNext Worker and a Pages proxy. Authenticate Wrangler and configure your Cloudflare account before deployment.

```bash
bun run cf-typegen
bun run deploy
```

`deploy` builds and deploys the `wordreference-app` Worker, then deploys the `wordreference` Pages project. The Pages `BACKEND` binding points to that Worker. Review [`wrangler.jsonc`](wrangler.jsonc), [`wrangler.pages.jsonc`](wrangler.pages.jsonc), and [`scripts/deploy-pages.mjs`](scripts/deploy-pages.mjs) before using these project names in another account.
