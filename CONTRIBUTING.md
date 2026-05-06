# Contributing to Pointer

Thanks for contributing to Pointer. This repository is large, layered, and build-heavy, so the fastest path is to make small, traceable changes and validate them with the narrowest useful checks.

## Product Identity

Pointer is an independent editor distribution.

- Use `Pointer` for user-facing product text.
- Use `pointer`, `.pointer`, `pointer://`, and the IDs from `product.json` for internal product identity.
- Do not describe Pointer as an official Microsoft product.
- Do not imply Microsoft signing or access to the official Microsoft Marketplace.
- Keep upstream copyright headers where they already exist.

## Before You Change Code

1. Read [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) for the project map.
2. Check [AGENTS.md](AGENTS.md) if you are a coding agent.
3. Use `rg` to find existing patterns before adding new helpers or services.
4. Keep changes close to the affected feature area.
5. Avoid drive-by refactors, formatting churn, or unrelated metadata changes.

## Local Workflow

| Goal | Command |
|---|---|
| Start app only | `run\start.bat` |
| Start live dev mode | `run\start-dev.bat` |
| Stop watchers/app | `run\dev-stop.bat` |
| Build release | `run\build-pointer.bat` |
| Build release with ZIP + installer | `run\build-pointer.bat --Zip --Installer` |

The Windows scripts use Node.js `22.22.1` from `.nvmrc`. If the local runtime is missing, the build/dev scripts download it to `.codex-tools\node-v22.22.1-win-x64\`.

## Coding Rules

- Use tabs for indentation.
- Use PascalCase for types/enums and camelCase for functions, properties, and locals.
- Use single quotes for code strings.
- Use localized double-quoted strings only through the existing localization APIs for user-visible text.
- Prefer `async`/`await`.
- Register disposables immediately with `DisposableStore`, `MutableDisposable`, `DisposableMap`, or the local pattern.
- Do not use `any` or `unknown` unless the surrounding code already requires it and there is no better type.
- Prefer direct services/APIs over cross-component storage-key writes or event-driven control flow.
- Service dependencies belong in constructors.
- Open editors through `IEditorService` unless the local pattern requires otherwise.

## Validation

Always check TypeScript compilation before running tests for TypeScript changes.

| Change area | First validation |
|---|---|
| `src/` | `npm run compile-check-ts-native` |
| `extensions/` | `npm run gulp compile-extensions` |
| `build/` | `cd build && npm run typecheck` |
| Architecture/layers | `npm run valid-layers-check` |
| Unit tests | `scripts\test.bat --grep <pattern>` or relevant suite |
| Integration/smoke | Use the matching `test/` README or scripts |

Do not claim a change is done if compilation errors remain.

## Pull Request Checklist

- [ ] Pointer branding is preserved.
- [ ] The change is scoped to the requested behavior.
- [ ] Existing patterns were reused where practical.
- [ ] TypeScript compilation was checked for touched areas.
- [ ] Relevant tests were run, or the reason for not running them is documented.
- [ ] Release/build docs were updated if commands, artifacts, or product metadata changed.
- [ ] No generated artifacts or temporary files were committed accidentally.

## Issue Reports

When reporting a Pointer issue, include:

- Pointer version and build type
- Operating system and architecture
- Reproduction steps
- Expected behavior and actual behavior
- Installed extensions, if relevant
- DevTools console errors, logs, screenshots, or screen recordings when useful
- Whether the issue reproduces with extensions disabled

Use the Pointer issue tracker from `product.json.reportIssueUrl`.

## More Docs

- [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md)
- [docs/TECH_STACK.md](docs/TECH_STACK.md)
- [docs/RELEASE.md](docs/RELEASE.md)
- [AGENTS.md](AGENTS.md)
