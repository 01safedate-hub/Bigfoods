<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## FastChina project notes

- Two domains, one app: `src/app/(shop)` = fastchina.shop, `src/app/store` = fastchina.store (routed by `src/proxy.ts`), `src/app/admin` = back office.
- All prices come from `src/lib/pricing/engine.ts`. Never hard-code a naira price; change `config.ts` instead. Run `npm test` after touching pricing: the guardrail tests must stay green.
- Anything time-based uses Lagos time helpers in `src/lib/time.ts` and the `useNow` hook (renders a placeholder until mounted, so prerendered HTML never depends on the clock).
- Every promotion section has an `<InfoButton topic=…>`; explainer copy lives in `src/lib/content/info.ts`.
