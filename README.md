# AI Image Generation Dashboard

This project demonstrates how to integrate the Tensor.art API in a Next.js application. It allows users to manage prompts, fetch model IDs and generate images asynchronously.

## New Features

- **Parameter Auto‑fill**: paste raw Tensor.art generation JSON and automatically populate fields.
- **Model ID Fetcher**: search for the correct model ID by name.
- **Async Image Generation**: send generation jobs and poll their status.
- **Settings Templates**: save generation parameters locally and reuse them.

## Environment Variables

- `TAMS_PRIVATE_KEY` – Tensor.art private key (base64 encoded)
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` – used by rate limiting
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` – optional, used if you connect to Supabase

Run `npm install` and then `npm run dev` to start the development server.

### Troubleshooting

If `npm install` fails with an `ERESOLVE unable to resolve dependency tree` error
related to `date-fns`, ensure that `date-fns@^2` is installed. You can run

```bash
npm install date-fns@^2 --save
```

or install dependencies with the `--legacy-peer-deps` flag.
