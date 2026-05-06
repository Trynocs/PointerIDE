# Pointer Project Instructions

Use these instructions for all Pointer repository work.

## Identity

Pointer is an independent editor distribution. It is not an official Microsoft product, is not Microsoft-signed, and does not use the official Microsoft Marketplace.

Keep user-facing product text and packaging metadata aligned with `product.json`.

## Commands

- App-only start: `run\start.bat`
- Live dev mode: `run\start-dev.bat`
- Stop dev: `run\dev-stop.bat`
- Release build: `run\build-pointer.bat`
- ZIP + installer: `run\build-pointer.bat --Zip --Installer`

## Main Docs

- `docs/PROJECT_GUIDE.md`
- `docs/TECH_STACK.md`
- `docs/RELEASE.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`

## Coding Rules

- Follow nearby patterns before introducing abstractions.
- Use tabs.
- Preserve copyright headers.
- Localize user-facing strings through the existing localization system.
- Register disposables immediately.
- Keep service dependencies in constructors.
- Avoid `any` and `unknown`.
- Check TypeScript compilation before test runs.

## Validation

- `src/`: `npm run compile-check-ts-native`
- `extensions/`: `npm run gulp compile-extensions`
- `build/`: `cd build && npm run typecheck`
- Layer-sensitive changes: `npm run valid-layers-check`

Protect existing uncommitted changes. Never revert unrelated user work.
