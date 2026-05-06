# Pointer Tech Stack

This is the short technical map for humans and coding AIs.

## Product

| Item | Value |
|---|---|
| Product name | Pointer |
| Internal application name | `pointer` |
| User data folder | `.pointer` |
| Shared data folder | `.pointer-shared` |
| URL protocol | `pointer://` |
| Windows AppUserModelId | `Pointer.Pointer` |
| Server app | `pointer-server` |
| Tunnel app | `pointer-tunnel` |
| Main product config | `product.json` |

Pointer is an independent build. It is not an official Microsoft product, is not Microsoft-signed, and does not use the official Microsoft Marketplace.

## Runtime And Build

| Area | Details |
|---|---|
| Node.js | `22.22.1` from `.nvmrc`; local copy in `.codex-tools\node-v22.22.1-win-x64\` |
| npm | npm 10.x bundled with Node.js |
| Electron | `39.8.8` |
| TypeScript | dev preview versions from `package.json` |
| Package manager | npm with `package-lock.json` |
| Build runner | Gulp 4 via `gulpfile.mjs` and `build/gulpfile*.ts` |
| Fast transpile | `build/next/index.ts` with esbuild when `build/buildConfig.ts` enables it |
| Packaging | `@vscode/gulp-electron`, ASAR, rcedit |
| Windows installer | Inno Setup through `build/win32/code.iss` |
| Native rebuilds | node-gyp + Visual Studio 2022 C++ Desktop Workload |

## Main Dependencies

| Category | Packages |
|---|---|
| Editor/text | `vscode-textmate`, `vscode-oniguruma`, `vscode-regexpp`, `@vscode/tree-sitter-wasm` |
| Terminal | `@xterm/xterm`, xterm addons, `node-pty` |
| Search/files | `@vscode/ripgrep`, `@parcel/watcher`, `yauzl`, `yazl` |
| Desktop/native | `@vscode/windows-registry`, `@vscode/windows-process-tree`, `@vscode/windows-mutex`, `native-keymap` |
| Storage/logging | `@vscode/sqlite3`, `@vscode/spdlog` |
| Agent/AI related | `@github/copilot`, `@github/copilot-sdk`, `@anthropic-ai/sdk`, `playwright-core` |
| Build/test | `gulp`, `electron`, `mocha`, `@playwright/test`, `eslint`, `tsec` |

## Source Layers

| Layer | Path | Responsibility |
|---|---|---|
| Base | `src/vs/base/` | Foundation utilities, lifecycle, browser/node helpers |
| Platform | `src/vs/platform/` | Services, DI, storage, files, telemetry, terminal platform pieces |
| Editor | `src/vs/editor/` | Monaco editor, text model, editing contributions |
| Workbench | `src/vs/workbench/` | Main product UI, commands, views, extension API |
| Electron | `src/vs/code/` | Desktop main process and startup |
| Server | `src/vs/server/` | Remote/server entry points |
| Sessions | `src/vs/sessions/` | Agent sessions experience and provider integrations |
| Extensions | `extensions/` | Built-in language/features/themes shipped with Pointer |

## Daily Commands

| Goal | Command |
|---|---|
| App only | `run\start.bat` |
| Live dev | `run\start-dev.bat` |
| Stop dev | `run\dev-stop.bat` |
| Portable release | `run\build-pointer.bat` |
| ZIP + installer | `run\build-pointer.bat --Zip --Installer` |
| Main TS check | `npm run compile-check-ts-native` |
| Extensions compile | `npm run gulp compile-extensions` |
| Layer check | `npm run valid-layers-check` |

## Output Locations

| Path | Meaning |
|---|---|
| `out/` | Dev compiled output |
| `out-build/` | Release compiled output |
| `.build/electron/` | Electron binary cache |
| `.build/builtInExtensions/` | Downloaded built-in extensions |
| `.build/artifacts/` | Final release artifacts |
| `.codex-tools/logs/` | Build logs |
| `../Pointer-win32-x64/` | Temporary Gulp package output before post-processing |
