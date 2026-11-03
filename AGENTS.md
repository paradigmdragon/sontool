# Working on SonTool

Read `README.md`, `docs/architecture.md`, `docs/sjg-format.md` and `docs/foundation-engineering.md` before changing behavior.

- This is SonTool, a separate public project from SonETool. Do not copy private service/repository code, personal works, conversations, credentials or production data here.
- Discover existing assets and tool contracts before inventing replacements. Read access to private code does not authorize its publication. Record provenance and compatible license for any reused code.
- Preserve unrelated changes, existing files and Git history. Inspect the current branch and working tree; isolate overlapping work. Never force-push or reset shared work.
- Keep the core independent of AI vendors, UI frameworks, renderers and service storage. Prefer reuse, then extension, then an adapter, then new implementation.
- The product direction is approved. `0.1.0-draft.1` and its JSON envelope are an experiment, not an approved stable file standard. Version format changes explicitly; do not silently rewrite works or strip unknown data.
- Stable IDs identify targets. Future edit batches must validate their base revision and apply atomically. Never overwrite a concurrent human edit silently.
- Parse documents as data. Do not execute imported code, fetch referenced URLs or load modules merely because a document requests it. Unknown modules remain preserved and inactive.
- Private preview and public publication are distinct operations. Publishing a work requires explicit user approval and server-side authorization bound to the reviewed revision. Never infer approval from a flag in imported data.
- Keep real works outside this repository. Only synthetic fixtures in `examples/` may be committed. Review the complete staged/publication file list, including ignored and generated files when relevant.
- Run `npm ci --ignore-scripts` and `npm run check` for core changes. Add behavioral checks for new failure modes. Do not add tests that merely repeat prose or implementation text.
- Report implemented, locally tested, service-tested and unverified behavior separately. A schema pass is not playback, safe execution, authorization or publication acceptance.
- A bootstrap commit does not authorize deployment, package release, service mutations or changes to other repositories. Use the current user's scope for each step.
