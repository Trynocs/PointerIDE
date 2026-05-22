# Pointer Project Guide

This guide is the central entrypoint for humans and coding AIs working in Pointer. It explains what the product is, where important things live, which commands are safe to run, and how to make changes without getting lost.

## One-Minute Summary

Pointer is a standalone Electron desktop editor based on Pointer-Core. It keeps the upstream layered editor architecture, but the product identity is Pointer: app name, folders, URL protocol, icons, installers, and release artifacts are all Pointer-specific.

The shortest useful workflow is:

```bat
run\start-dev.bat
run\dev-stop.bat
run\build-pointer.bat --Zip --Installer
```

For app-only startup with existing compiled output:

```bat
run\start.bat
```

## Non-Negotiable Identity Rules

- Pointer is Pointer.
- Pointer is not an official Microsoft product.
- Pointer is not Microsoft-signed.
- Pointer does not have access to the official Microsoft Marketplace.
- Keep upstream copyright headers where they already exist.
- Keep user-facing product text, installers, app IDs, folders, and docs aligned with `product.json`.

## Documentation Map

| File | Audience | Purpose |
|---|---|---|
| `README.md` | Everyone | First overview and command cheat sheet |
| `AGENTS.md` | Coding AIs | Agent rules, architecture, build notes |
| `.github/copilot-instructions.md` | Copilot-style agents | Project-wide coding instructions |
| `docs/TECH_STACK.md` | Everyone | Short stack and ownership map |
| `docs/RELEASE.md` | Builders/release | Release build details and troubleshooting |
| `docs/LAUNCH_CHECKLIST.md` | Maintainers/release | Public release checklist and smoke-test expectations |
| `CONTRIBUTING.md` | Contributors | Workflow, validation, PR checklist |
| `src/vs/sessions/README.md` | Sessions contributors | Sessions architecture |
| `test/README.md` | Test authors | Test infrastructure |

## Product Configuration

`product.json` is the source of truth for product identity.

Important fields:

| Field | Meaning |
|---|---|
| `nameShort`, `nameLong` | Display name |
| `applicationName` | Internal app name and CLI-ish identity |
| `dataFolderName` | User data folder |
| `sharedDataFolderName` | Shared data folder |
| `urlProtocol` | Deep link protocol |
| `win32DirName` | Windows install directory name |
| `win32AppUserModelId` | Windows taskbar grouping |
| `serverApplicationName` | Server binary identity |
| `tunnelApplicationName` | Tunnel binary identity |
| `builtInExtensions` | Downloaded built-ins for release packaging |
| `onboardingThemes` | Themes offered during onboarding |

If you change branding, update `product.json`, Windows resources under `resources/win32/`, themes under `extensions/theme-defaults/`, and any release docs affected by artifact names.

## Repository Map

| Path | What belongs there |
|---|---|
| `.build/` | Generated build state and final release artifacts |
| `.codex-tools/` | Local tool runtime and build logs |
| `.github/` | GitHub config, Copilot instructions, prompts, skills, workflows |
| `build/` | Gulp tasks, packaging, CI scripts, Electron and extension download helpers |
| `cli/` | Rust CLI and tunnel-related command code |
| `docs/` | Pointer-specific project documentation |
| `extensions/` | Built-in extensions and default themes |
| `resources/` | Static product resources such as Windows icons and manifests |
| `run/` | Human-friendly Windows entrypoint scripts |
| `scripts/` | Lower-level build, dev, test, web, and helper scripts |
| `src/vs/` | Main TypeScript application source |
| `test/` | Unit, integration, smoke, sanity, component fixture, and MCP tests |

Generated folders such as `out/`, `out-build/`, `out-vscode/`, `.build/`, and `.codex-tools/` should not be treated as source.

## Architecture

Pointer keeps a layered architecture:

```text
src/vs/base/
  -> src/vs/platform/
    -> src/vs/editor/
      -> src/vs/workbench/
        -> src/vs/code/
```

The important rule: lower layers should not depend on higher layers. Use existing services, registries, and contribution points instead of adding cross-layer imports.

### `src/vs/base/`

Foundational utilities, lifecycle primitives, browser/node helpers, collections, events, cancellation, and common abstractions.

### `src/vs/platform/`

Service interfaces and implementations used across editor/workbench. This layer owns dependency injection patterns, file/storage/configuration/telemetry/terminal primitives, and platform abstractions.

### `src/vs/editor/`

Monaco editor core: text models, editor widgets, commands, language-ish behavior, contributions, and editor tests.

### `src/vs/workbench/`

The main app shell: layout, views, commands, menus, services, extension host API, feature contributions, chat, terminal, debug, SCM, preferences, and desktop/browser integration.

### `src/vs/code/`

Electron desktop main process and startup code.

### `src/vs/server/`

Remote/server process code.

### `src/vs/sessions/`

Agent sessions window and agentic workflows. This sits alongside the workbench and may import from workbench where local architecture allows it. Keep sessions-specific UX and provider wiring here when possible.

## Development Modes

| Mode | Command | Behavior |
|---|---|---|
| App-only start | `run\start.bat` | Uses existing compiled output, stops stale watchers, does not install/compile/rebuild |
| Live dev | `run\start-dev.bat` | Ensures dependencies, native modules, Electron, Copilot bundle, starts watcher, launches app |
| Stop dev | `run\dev-stop.bat` | Stops repo-local watchers and app processes |
| Release build | `run\build-pointer.bat` | Produces portable release under `.build\artifacts\` |

Use `run\start.bat` when compiled output already exists and you want a safe app launch. Use `run\start-dev.bat` when you are changing TypeScript and want live transpilation.

## Release Build

The main release script is:

```bat
run\build-pointer.bat
```

Useful flags:

| Flag | Meaning |
|---|---|
| `--Arch x64` | Build architecture, default `x64` |
| `--SkipInstall` | Skip dependency install when already healthy |
| `--Fresh` | Reinstall dependencies and rebuild native modules |
| `--Zip` | Create portable ZIP |
| `--Installer` | Build Inno Setup installer |

Release output:

| Artifact | Meaning |
|---|---|
| `.build\artifacts\Pointer-win32-x64\` | Portable app |
| `.build\artifacts\Pointer-win32-x64.zip` | Optional ZIP |
| `.build\artifacts\PointerSetup-x64-<version>.exe` | Optional installer |

Logs are written to `.codex-tools\logs\<timestamp>-<pid>\`. `latest-run.txt` points at the latest run.

## Build Pipeline

Release builds do roughly this:

1. Ensure Visual Studio Developer Shell.
2. Ensure Node.js from `.nvmrc`.
3. Install/repair npm dependencies.
4. Install Electron node-gyp headers.
5. Patch Windows `/Qspectre` flags where needed.
6. Rebuild native modules with MSVC.
7. Download Electron.
8. Download built-in extensions from `product.json`.
9. Generate policies.
10. Run Gulp `vscode-win32-<arch>`.
11. Run Gulp `vscode-win32-<arch>-inno-updater`.
12. Optionally run Gulp `vscode-win32-<arch>-user-setup`.
13. Copy final artifacts into `.build\artifacts\`.

The temporary package folder is one directory above the repo: `..\Pointer-win32-x64\`.

## Coding Guidelines

- Follow nearby code style first.
- Use tabs.
- Keep imports compact and deduplicated.
- Prefer existing services and helpers.
- Do not add global state when a service/registry/contribution exists.
- Register disposables immediately.
- Avoid `any` and `unknown`.
- Keep user-visible strings localized.
- Use direct service APIs instead of storage-key backdoors.
- Avoid event-driven orchestration when direct service calls are clearer.
- Keep tests in the correct suite and follow local patterns.

## Validation Guide

Always compile-check TypeScript changes before running tests.

| Touched area | Validation |
|---|---|
| `src/` TypeScript | `npm run compile-check-ts-native` |
| `extensions/` TypeScript | `npm run gulp compile-extensions` |
| `build/` TypeScript | `cd build && npm run typecheck` |
| Layering-sensitive code | `npm run valid-layers-check` |
| Unit tests | `scripts\test.bat --grep <pattern>` |
| Smoke tests | See `test/smoke/README.md` |
| Integration tests | See `test/integration/` docs |

Do not run broad expensive suites unless the change risk calls for it.

## Agent Workflow

For coding AIs:

1. Read `AGENTS.md` and this guide.
2. Inspect the existing implementation before editing.
3. Use `rg` for search.
4. Protect user changes in the working tree.
5. Keep edits scoped.
6. Update docs when commands, artifacts, product identity, or workflows change.
7. Run the narrowest reliable validation.
8. Report changed files and validation results clearly.

If the working tree is already dirty, assume the changes are intentional and avoid reverting them.

## Common Change Areas

| Goal | Likely files |
|---|---|
| Rename product/user-facing identity | `product.json`, `resources/`, `build/`, `src/vs/workbench/**`, docs |
| Windows installer changes | `build/gulpfile.vscode.win32.ts`, `build/win32/code.iss`, `resources/win32/`, `docs/RELEASE.md` |
| Release output behavior | `scripts/build-pointer-release.ps1`, `build/gulpfile.vscode.ts`, `docs/RELEASE.md` |
| Dev launch behavior | `run/*.bat`, `scripts/dev-windows.ps1`, `scripts/start-pointer.ps1` |
| Agent sessions | `src/vs/sessions/`, `src/vs/workbench/contrib/chat/**`, `.github/instructions/*sessions*` |
| Built-in themes | `extensions/theme-defaults/themes/`, `product.json.onboardingThemes` |
| Built-in extensions | `extensions/`, `product.json.builtInExtensions`, `build/lib/builtInExtensions.ts` |

## Troubleshooting

| Symptom | First check |
|---|---|
| `node.exe` missing | Run `run\start-dev.bat` or `run\build-pointer.bat`; scripts download Node.js |
| Electron missing | `node build/lib/electron.ts` or rerun dev/build script |
| Native module errors | Visual Studio 2022 C++ Desktop Workload and DevShell |
| Gulp `MODULE_NOT_FOUND` | Build script auto-repair logs under `.codex-tools\logs\` |
| App-only start fails | Run `run\start-dev.bat` once to create `out/` and `.build/electron/` |
| Installer missing | Ensure Inno Setup is installed and `--Installer` was passed |

## Keep Docs In Sync

Update docs when you change:

- Commands in `run/` or `scripts/`
- Artifact names or locations
- Product identity in `product.json`
- Build flags or dependencies
- Required tool versions
- Agent/session workflows
- Testing expectations
