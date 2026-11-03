# Contributing

SonTool is at the repository bootstrap stage. Begin with the [engineering brief](docs/foundation-engineering.md), then work on the smallest verifiable change.

## Development

Use Node.js >=22.12.0 and npm. Run `npm ci --ignore-scripts`, then `npm run check`. Commit `package-lock.json` with dependency changes. The current experiment uses ESM JavaScript and JSON Schema; no frontend framework or service stack has been selected.

Tests should exercise observable behavior with synthetic data: malformed works, identity preservation, unknown modules and concurrent edits as those features are added. Record exact commands and environments. Do not substitute mocks for service authorization or real playback acceptance.

## Changes

Explain the problem, resulting behavior, compatibility implications and verification. Mark draft decisions and untested assumptions. Format or module-contract changes require a decision record and migration discussion before becoming stable.

## Public/private boundary

Only public code, public documentation and synthetic fixtures belong here. Do not upload personal works, user conversations, private Skill/Template bodies, account/session identifiers, tokens, environment files, private media or production database contents. Keep screenshots and logs out unless reviewed and necessary.

Do not port private SonETool or Sonjapgo source merely because you can read it. Check explicit redistribution authorization, provenance, licenses and separation from private configuration first. For third-party source reuse, retain required notices and record its origin. Proposing an adapter does not imply a completed integration.

The repository uses Apache-2.0. Keep the existing LICENSE intact. Do not add a dependency or copied component without checking its license and explaining why it is necessary.
