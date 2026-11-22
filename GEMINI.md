# Editing & Verification Speed

- Keep edits quick and direct. Do **not** run heavy verification (such as headless browser suites, multi-viewport screenshot captures, or multi-thousand-run simulations) after routine changes.
- Only run full verification when:
  1. The user explicitly asks for verification, testing, or screenshots; or
  2. The change is genuinely risky (e.g., save/load data migrations, complex combat/state refactors, or breaking layout/portal geometry).
- For normal edits, rely on careful code reading and minimal targeted checks, then report concisely what changed.
