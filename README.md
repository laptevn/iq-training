# MindSprint

A static, mobile-first React app for 15-minute IQ-style training sessions. It runs entirely in the browser, generates a deterministic 500-puzzle catalog, and stores session history in `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

## Validate and build

```bash
npm test
npm run build
```

The production site is written to `dist/`. Vite uses a relative asset base, so the build can be deployed directly to a GitHub Pages project path.

## Current puzzle categories

- Number series
- Mixed/interwoven series
- Letter logic
- Arithmetic
- Verbal analogies
- Classification / odd-one-out
- Numeric comparison
- Visual rotation sequences
- Pattern matrices
- Visual classification / odd-one-out

The score shown by the app is an informal training estimate, not a standardized or clinical IQ measurement.

## Calibrated scoring

Every session contains five questions from each of the ten categories and ten questions at each difficulty level. Correct answers are weighted from `0.70` at difficulty 1 to `1.45` at difficulty 5. The resulting weighted mastery maps to a guarded 70–145 estimate, with at most five additional points available for fast, accurate, high-completion work. Numerical, verbal, and visual subscores are saved with each new result.

Scores created before scoring model v2 remain in browser storage but are excluded from new comparisons and trend charts.
