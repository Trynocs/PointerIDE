# Pointer - Agent Reference

Pointer ist ein eigenständiger Editor, der auf Pointer-Core basiert.
Pointer ist **kein** offizielles Microsoft-Produkt, keine Fremdmarke, und nicht Microsoft-signiert.

---

## 0. Schnellstart für Coding AIs und Menschen

Wenn du nur kurz Orientierung brauchst:

| Thema | Kurzinfo |
|---|---|
| Produkt | Pointer, eigenständiger Electron-Editor |
| Sprache | TypeScript im Hauptcode, Rust im CLI, PowerShell/Bat für Windows-Skripte |
| Runtime | Node.js `22.22.1`, Electron `39.8.8` |
| Dev app-only | `run\start.bat` |
| Dev live/watch | `run\start-dev.bat` |
| Dev stoppen | `run\dev-stop.bat` |
| Release | `run\build-pointer.bat` |
| Release mit ZIP/Installer | `run\build-pointer.bat --Zip --Installer` |
| Artefakte | `.build\artifacts\` |
| Logs | `.codex-tools\logs\` |
| Produktidentität | `product.json` |
| Hauptguide | `docs/PROJECT_GUIDE.md` |
| Techstack | `docs/TECH_STACK.md` |
| Releaseguide | `docs/RELEASE.md` |

Arbeitsregel für Agents: Erst lesen, dann klein schneiden, dann ändern. Verwende `rg`, schütze vorhandene uncommitted Änderungen, halte Pointer-Branding intakt und validiere TypeScript-Änderungen vor Tests.

---

## 1. Projekt-Identität und Rebranding

### 1.1 Was ist Pointer?

Pointer ist als eigenständige App-Marke konfiguriert.
Der Name, die App-IDs, das Icon, die Datenordner und alle Markenreferenzen wurden auf "Pointer" geändert.

### 1.2 Wo wird das Branding definiert?

**`product.json`** (Projekt-Root) - Zentrale Konfiguration für das Rebranding:

```json
{
  "nameShort": "Pointer",
  "nameLong": "Pointer",
  "applicationName": "pointer",
  "dataFolderName": ".pointer",
  "sharedDataFolderName": ".pointer-shared",
  "win32MutexName": "pointer",
  "win32DirName": "Pointer",
  "win32NameVersion": "Pointer",
  "win32RegValueName": "Pointer",
  "win32AppUserModelId": "Pointer.Pointer",
  "win32ShellNameShort": "&Pointer",
  "win32TunnelServiceMutex": "pointer-tunnelservice",
  "win32TunnelMutex": "pointer-tunnel",
  "darwinBundleIdentifier": "com.pointer.app",
  "linuxIconName": "pointer",
  "urlProtocol": "pointer",
  "serverApplicationName": "pointer-server",
  "serverDataFolderName": ".pointer-server",
  "tunnelApplicationName": "pointer-tunnel"
}
```

Wichtige Felder:
- `nameShort` / `nameLong`: Angezeigter Name in der App (Titel, About, etc.)
- `applicationName`: Interner Name (CLI, Dateipfade)
- `dataFolderName`: Ordner unter `~/.pointer` für User-Daten
- `win32DirName`: Installationsordner auf Windows (`Pointer/`)
- `win32AppUserModelId`: Windows Taskbar-Gruppierung
- `win32MutexName`: Verhindert mehrfache Instanzen
- `urlProtocol`: `pointer://` URI-Scheme für Deep-Links
- `win32x64AppId` / `win32x64UserAppId`: Windows Installer App-ID (GUID)

### 1.3 WICHTIG: Pointer ist Pointer

Pointer:
- Ist ein **eigener Build** mit Pointer-Branding
- Hat **eigenes Branding** (Name, Icons, App-IDs)
- Ist **nicht** Microsoft-signiert
- Hat **keinen** Zugang zum offiziellen Microsoft Marketplace
- Verhält sich als Pointer-Distribution mit eigener Produktidentität
- Darf **nicht** unter fremder Produktmarke beworben werden

---

## 2. Projektstruktur (Ordner-Übersicht)

```
Pointer/
├── .build/                     # Build-Artefakte (gitignored)
│   ├── artifacts/              # RELEASE-OUTPUT → hier landen fertige Builds
│   │   └── Pointer-win32-x64/   # Packaged Windows x64 Build
│   ├── builtInExtensions/      # Heruntergeladene Built-In Extensions
│   ├── electron/               # Electron Binary Cache
│   ├── extensions/             # Kompilierte Extension-Builds
│   └── policies/               # Generierte Windows Group Policies
├── .codex-tools/               # Lokale Node.js Runtime + Build-Logs
│   ├── node-v22.22.1-win-x64/  # Lokale Node.js (aus .nvmrc)
│   ├── native-rebuild-x64.marker
│   └── logs/                   # Laufende Build-Logs pro Run
├── .github/                    # GitHub-Konfiguration
│   └── copilot-instructions.md # Detaillierte Code-Richtlinien
├── build/                      # Build-System (Gulp-Tasks, Compiler, etc.)
│   ├── buildConfig.ts          # Build-Konfiguration (esbuild Toggle)
│   ├── buildfile.ts            # Dateilisten für den Build
│   ├── gulpfile.ts             # Haupt-Gulpfile (importiert alle Tasks)
│   ├── gulpfile.vscode.ts      # Haupt-Paketierungs-Task
│   ├── gulpfile.vscode.win32.ts# Windows-spezifische Tasks (Inno Setup, Icon)
│   ├── gulpfile.compile.ts     # TypeScript-Kompilierung
│   ├── gulpfile.extensions.ts  # Built-In Extensions Build
│   ├── lib/                    # Build-Hilfsbibliotheken
│   │   ├── electron.ts         # Electron-Download und -Konfiguration
│   │   ├── asar.ts             # ASAR-Archiv-Erstellung
│   │   ├── optimize.ts         # JS/CSS Bundle-Optimierung
│   │   ├── builtInExtensions.ts# Built-In Extension Downloader
│   │   ├── policies/           # Windows Policy-Generierung
│   │   └── task.ts             # Task-Hilfsfunktionen
│   ├── win32/                  # Windows-Build-Ressourcen
│   │   ├── code.iss            # Inno Setup Installer-Skript (1986 Zeilen!)
│   │   ├── i18n/               # Installer-Lokalisierung
│   │   ├── inno_updater.exe    # Inno-Update-Helper
│   │   └── vcruntime140.dll    # Visual C++ Runtime
│   ├── azure-pipelines/        # CI/CD Pipeline-Skripte
│   ├── next/                   # Esbuild-basierte Transpilierung
│   ├── rspack/                 # Rspack-Konfiguration (Web-Build)
│   ├── vite/                   # Vite-Konfiguration (Web-Build)
│   └── npm/                    # Build-NPM-Skripte (postinstall, etc.)
├── extensions/                 # Built-In Extensions (ca. 40+ Ordner)
│   ├── typescript-language-features/
│   ├── git/
│   ├── copilot/
│   ├── theme-defaults/
│   └── ... (jeder Ordner hat eigenes package.json)
├── resources/                  # Statische Ressourcen
│   └── win32/                  # Windows-Ressourcen (Icons, Inno-Bitmaps)
│       ├── code.ico            # App-Icon
│       ├── inno-big-*.bmp      # Installer-Wizard-Hintergrundbilder
│       ├── inno-small-*.bmp    # Installer-Wizard-Kleinbild
│       └── VisualElementsManifest.xml
├── run/                        # Human-friendly Windows Entrypoints
│   ├── start.bat               # App-only Start ohne Watcher/Install/Rebuild
│   ├── start-dev.bat           # Live Dev-Modus mit Watcher
│   ├── dev-stop.bat            # Dev-Prozesse stoppen
│   └── build-pointer.bat       # Release-Build Starter
├── scripts/                    # Entwicklung und Build-Skripte
│   ├── code.bat                # Dev-Mode Launcher (Electron im Dev)
│   ├── dev-windows.ps1         # Dev-Mode (Watch + Launch)
│   ├── dev-stop.ps1            # Dev-Mode Watcher beenden
│   ├── build-windows.ps1       # Release-Build Skript (PowerShell)
│   ├── build-pointer-release.ps1 # Pointer-spezifischer Release-Build
│   └── ...
├── src/                        # Quellcode (TypeScript)
│   └── vs/
│       ├── base/               # Basis-Bibliotheken (Browser, Node, Common)
│       ├── platform/           # Plattform-Services und DI
│       ├── editor/             # Monaco Editor Core
│       ├── workbench/          # Haupt-App (Desktop + Web)
│       │   ├── browser/        # Core Workbench UI
│       │   ├── contrib/        # Feature-Contributions (Git, Debug, etc.)
│       │   └── api/            # Extension API Implementation
│       ├── code/               # Electron Main Process
│       ├── server/             # Remote Server
│       └── sessions/           # Agent Sessions Window
├── test/                       # Test-Infrastruktur
├── out/                        # Kompilierter JS-Output (Dev-Mode)
├── out-build/                  # Kompilierter JS-Output (Release-Build)
├── out-vscode/                 # Additional compiled output
├── AGENTS.md                   # ← Diese Datei
├── README.md                   # Projekt-Beschreibung
├── docs/                       # Pointer-spezifische Projekt-, Stack- und Release-Doku
├── package.json                # Root package.json (pointer-dev)
├── product.json                # Rebranding-Konfiguration
├── gulpfile.mjs                # Gulp-Einstiegspunkt
├── .nvmrc                      # Node.js Version: 22.22.1
├── .npmrc                      # NPM-Konfiguration (disturl für Electron-Headers)
└── LICENSE.txt                 # MIT Lizenz
```

---

## 3. Build-System im Detail

### 3.1 Build-Kette (Übersicht)

```
npm ci → Node-Gyp Headers → Native Rebuilds → Electron Download
→ Built-In Extensions Download → Gulp: vscode-win32-x64
→ Gulp: vscode-win32-x64-inno-updater → [Optional: ZIP/Installer]
```

### 3.2 Voraussetzungen

| Komponente | Version | Zweck |
|---|---|---|
| Node.js | 22.22.1 | Build-Toolchain (definiert in `.nvmrc`) |
| npm | 10.x | Paketmanager |
| Visual Studio 2022 | C++ Desktop Workload | Native Module Kompilierung (node-gyp) |
| Python | 3.x | node-gyp Abhängigkeit |
| Git | beliebig | Versionskontrolle |

### 3.3 Node.js Runtime

Das Projekt verwendet eine **lokale Node.js Runtime** unter `.codex-tools/node-v22.22.1-win-x64/`.
Sie wird automatisch von `scripts/build-windows.ps1` heruntergeladen, falls nicht vorhanden.
Die Dev-Skripte (`scripts/dev-windows.ps1`, `scripts/dev-stop.ps1`) prüfen ebenfalls diesen Pfad zuerst,
bevor sie auf PATH zurückgreifen.

### 3.4 npm-Installations-Pipeline

Die Installation erfolgt in mehreren Stufen (siehe `Install-Dependencies` in `scripts/build-windows.ps1`):

1. **Root** (`npm ci --ignore-scripts`): Hauptabhängigkeiten ohne Scripts
2. **Node-Gyp Headers** (`build/npm/gyp`): Electron-spezifische C++ Headers für native Module
3. **SpectreMitigation Patching**: Entfernt `/Qspectre` Flags aus `.gyp` Dateien (nur Windows)
4. **Native Rebuilds** (`npm rebuild`): Neu-kompilierung aller nativen Module mit MSVC:
   - `@vscode/spdlog`, `@vscode/sqlite3`, `@vscode/ripgrep`, `@vscode/windows-registry`
   - `@vscode/native-watchdog`, `@vscode/policy-watcher`, `native-keymap`
   - `node-pty`, `@parcel/watcher`, `kerberos`, `native-is-elevated`
   - `windows-foreground-love`, `@vscode/windows-process-tree`, `@vscode/deviceid`, `@vscode/windows-mutex`
5. **Electron Download** (`node build/lib/electron.ts`): Lädt Electron 39.8.8 nach `.build/electron/`
6. **Sub-Projekte**: Installiert Dependencies in `build/`, `extensions/`, und ~30 Extension-Unterordnern

### 3.5 Native Module Rebuild

Native Module werden nur neu kompiliert wenn:
- `$Fresh` Flag gesetzt ist
- Oder der Marker `.codex-tools/native-rebuild-x64.marker` nicht existiert

Nach erfolgreichem Rebuild wird der Marker mit aktuellem Datum erstellt.
Dies spart Zeit bei wiederholten Builds.

### 3.6 Health-Check System

`build-windows.ps1` hat ein Health-Check-System, das kritische Dateien überprüft:
- **Root**: `node_modules/gulp/bin/gulp.js`, `@vscode/l10n-dev`, `xml2js`
- **Build**: `node_modules/ternary-stream`, `node_modules/esbuild`
- **Extensions**: `node_modules/esbuild`

Wenn Dateien fehlen, wird automatisch `npm ci` zur Reparatur ausgeführt.

### 3.7 Auto-Repair bei Gulp-Fehlern

Wenn ein Gulp-Task mit `MODULE_NOT_FOUND` fehlschlägt, repariert `build-windows.ps1` automatisch
die Dependencies (root, build, extensions) und wiederholt den Task einmal.

### 3.8 VS DevShell Integration

Wenn die Build-Skripte nicht in einer Visual Studio Dev-Shell laufen,
starten sie sich selbst in einer neu:
- Sucht `VsDevCmd.bat` in: Community, Professional, Enterprise, BuildTools (2022)
- Setzt `-arch=$Arch -host_arch=x64`
- Fügt lokalen Node.js zur PATH hinzu
- Startet PowerShell neu mit allen Parametern

### 3.9 Gulp Tasks für den Release-Build

Die wichtigsten Gulp-Tasks:

| Task | Beschreibung |
|---|---|
| `vscode-win32-x64` | Packaged den x64 Build nach `../Pointer-win32-x64/` |
| `vscode-win32-arm64` | Packaged den ARM64 Build |
| `vscode-win32-x64-inno-updater` | Kopiert Update-Helper und patcht Icon |
| `vscode-win32-x64-user-setup` | Erstellt User-Installer (Inno Setup) |
| `vscode-win32-x64-system-setup` | Erstellt System-Installer (Inno Setup) |
| `compile` | Kompiliert TypeScript |
| `compile-build-with-mangling` | Build-Skripte kompilieren + Minifizierung |
| `minify-vscode` | JS/CSS für Release minifizieren |

### 3.10 Paketierungs-Fluss (vscode-win32-x64 Task)

Der Haupt-Task in `build/gulpfile.vscode.ts`:

1. **Electron Pack**: Verwendet `@vscode/gulp-electron` um Electron + App-Code zusammenzupacken
2. **Product JSON**: `product.json` wird mit Commit-Hash und Versionsinfo angereichert
3. **ASAR Erstellung**: App-Code wird in `app.asar` gepackt (aus `out-build/`)
4. **Ressourcen kopieren**: Icons, HTML-Templates, NLS-Dateien, etc.
5. **Native Module**: Vor-kompilierte `.node` Dateien werden in den Build kopiert
6. **Extensions**: Built-In Extensions werden nach `extensions/` kopiert
7. **rcedit**: EXE-Icon wird auf `resources/win32/code.ico` gesetzt
8. **Output**: Landet in `../Pointer-win32-x64/` (ein Ordner über dem Repo-Root!)

### 3.11 Inno Setup Installer-Fluss

Der Task `vscode-win32-x64-user-setup` in `build/gulpfile.vscode.win32.ts`:

1. Liest `product.json` und `package.json` für Versionsinfo und App-IDs
2. Generiert Definitions für Inno Setup (Name, Version, Pfade, GUIDs)
3. Ruft `ISCC.exe` (Inno Setup Compiler) mit `build/win32/code.iss` auf
4. Das `code.iss` Skript (1986 Zeilen!) steuert:
   - Installer-Oberfläche (Wizard-Bilder, Icons)
   - Datei-Kopierung, Registry-Einträge, Pfad-Variablen
   - Desktop-Verknüpfungen, Kontextmenü-Einträge
   - Deinstallation, Update-Verhalten
   - association mit Dateitypen
5. Output: `PointerSetup.exe` in `.build/win32-x64/user-setup/`

---

## 4. Dev-Modus vs. Release-Build

### 4.1 App-only Start (`run\start.bat`)

```
run\start.bat → scripts\start-pointer.ps1 →
  1. Lokale Node.js Runtime oder Node.js auf PATH finden
  2. Alte Watcher aus diesem Repo stoppen
  3. Prüfen, ob `.build\electron\Pointer.exe` und `out\...` existieren
  4. Pointer ohne npm install, rebuild, compile oder watcher starten
```

Dieser Pfad ist bewusst sicher und schnell. Er ist ideal, wenn der Dev-Output bereits existiert.

### 4.2 Live Dev-Modus (`run\start-dev.bat`)

```
run\start-dev.bat → scripts/dev-windows.ps1 →
  1. Ensure-Node: Node.js 22.22.1 sicherstellen
     - Prüft .codex-tools/node-v22.22.1-win-x64/
     - Fallback auf PATH
     - Auto-Download von nodejs.org falls nötig
  2. Ensure-Dependencies: First-Time Setup
     - Prüft ob node_modules/gulp und node_modules/deemon existieren
     - Falls nicht: npm ci (root, build, extensions) + Electron Download
     - Wird bei subsequenten Runs übersprungen
  3. kill-watch-client-transpiled (alte Watcher beenden)
  4. deemon --detach npm run watch-client-transpile (Hintergrund-Watcher starten)
  5. Sleep 3 Sekunden (Warten auf ersten Compile)
  6. scripts/code.bat → build/lib/preLaunch.ts (Electron im Dev-Modus starten)
```

**Eigenschaften:**
- Uses esbuild for fast transpilation (`build/next/index.ts transpile --watch`)
- Electron lädt Code direkt aus `out/` (nicht aus ASAR)
- `NODE_ENV=development`, `VSCODE_DEV=1`
- File-Watcher: Änderungen werden sofort kompiliert und in Electron neu geladen
- Source Maps aktiv, kein Minifizierung
- Gestartet mit `scripts/code.bat` → `.build/electron/Pointer.exe`
- **First-Time Setup**: npm ci + Electron Download automatisch bei erstem Start
- **Hinweis**: Native Module (Terminal etc.) brauchen `run\build-pointer.bat` für Rebuild

**Stoppen:** `run\dev-stop.bat` → `scripts/dev-stop.ps1` → beendet Watcher und App-Prozesse für dieses Repo

### 4.3 Release-Build (`run\build-pointer.bat`)

```
run\build-pointer.bat → scripts/build-pointer-release.ps1 →
  1. VS DevShell sicherstellen
  2. Node.js sicherstellen (Auto-Download)
  3. npm dependencies installieren
  4. Native Module rebuild
  5. Electron downloaden
  6. Built-In Extensions herunterladen
  7. Policies generieren
  8. Gulp: vscode-win32-x64 (Package)
  9. Gulp: vscode-win32-x64-inno-updater
  10. [Optional] Gulp: vscode-win32-x64-user-setup (Installer - VOR Post-Processing!)
  11. EXE nach Pointer.exe umbenennen
  12. [Optional] ZIP erstellen
  13. Temporäre Ordner aufräumen
  14. Alles kopiert nach .build/artifacts/
```

**WICHTIG**: Installer-Task (Schritt 10) muss VOR dem Verschieben des Paket-Ordners laufen,
da Inno Setup `../Pointer-win32-x64/` als SourceDir benötigt.

---

## 5. Konfigurations-Dateien

### 5.1 package.json (Root)

```json
{
  "name": "pointer-dev",
  "version": "1.119.0",
  "main": "./out/main.js",
  "type": "module",
  "private": true
}
```

- `name`: Interne Bezeichnung (wird nicht dem Nutzer angezeigt)
- `version`: Versionsnummer für den Build
- `main`: Electron Main-Process Entry Point
- `type: "module"`: ESM-Module (kein CommonJS)

### 5.2 .nvmrc

```
22.22.1
```

Definiert die exakte Node.js Version für den Build.

### 5.3 .npmrc

Enthält `disturl` und `target` für node-gyp, um die korrekten Electron C++ Headers herunterzuladen.

### 5.4 buildConfig.ts

```typescript
export const useEsbuildTranspile = true;
```

Steuerung der Transpilierung:
- `true`: esbuild für schnelles Transpilieren, gulp-tsb nur für Type-Checking
- `false`: gulp-tsb für beides (langsamer)

---

## 6. Build-Artefakte

### 6.1 Ordnerregel

**Alle** Release-Artefakte landen unter `.build/artifacts/`:

```
.build/artifacts/
├── Pointer-win32-x64/              # Portable App
├── Pointer-win32-x64.zip           # Gezippte portable Version
└── PointerSetup-x64-<version>.exe  # Windows Installer (Inno Setup, optional)
```

Keine fertigen Builds im Repo-Root ablegen!

### 6.2 Build-Logs

Jeder Build erzeugt Logs unter `.codex-tools/logs/<timestamp>-<pid>/`:
- Jeder Schritt hat seine eigene `.log` Datei
- `latest-run.txt` verweist auf den letzten Run

### 6.3 Temporäre Build-Dateien

- `../Pointer-win32-x64/` - Temporärer Package-Ordner (ein Verzeichnis über dem Repo!)
- `.build/win32-x64/` - Temporäre Inno Setup Output-Dateien

Diese werden von `build-pointer-release.ps1` bereinigt und die Artefakte nach `.build/artifacts/` kopiert.

---

## 7. Skript-Referenz

### 7.1 Entwicklung

| Skript | Beschreibung |
|---|---|
| `run\start.bat` | Startet vorhandenen Dev-Output ohne Watcher/Install/Rebuild |
| `run\start-dev.bat` | Startet Live Dev-Modus (Watcher + Electron) |
| `run\dev-stop.bat` | Stoppt Watcher und App-Prozesse für dieses Repo |
| `scripts/code.bat` | Startet Electron direkt im Dev-Modus |
| `scripts/dev-windows.ps1` | Dev-Mode PowerShell (Watcher + Launch) |
| `scripts/dev-stop.ps1` | Watcher beenden |

### 7.2 Build

| Skript | Beschreibung |
|---|---|
| `run\build-pointer.bat` | Pointer Release-Build (einfacher Einstieg) |
| `scripts/build-pointer-release.ps1` | Detaillierter Pointer Release-Build (PowerShell) |
| `scripts/build-windows.ps1` | Original Code-OSS Build-Skript |

### 7.3 NPM Scripts (aus package.json)

| Script | Beschreibung |
|---|---|
| `npm run compile` | TypeScript kompilieren (Gulp) |
| `npm run watch` | Watcher starten (Client + Extensions + Copilot) |
| `npm run gulp <task>` | Gulp-Task ausführen |
| `npm run electron` | Electron Version anzeigen |
| `npm run download-builtin-extensions` | Built-In Extensions herunterladen |

---

## 8. Architektur des Quellcodes

### 8.1 Schichten-Architektur

```
src/vs/base/         ← Grundlegende Utilities (Browser, Node, Common)
    ↑
src/vs/platform/     ← Plattform-Services, Dependency Injection
    ↑
src/vs/editor/       ← Monaco Editor (Syntax Highlighting, etc.)
    ↑
src/vs/workbench/    ← Haupt-App UI und Services
    ↑
src/vs/code/         ← Electron Main Process
```

### 8.2 Wichtige Prinzipien

- **Dependency Injection**: Services werden über Constructor-Parameter injiziert
- **Contribution Model**: Features registrieren sich über Extension Points
- **Cross-Platform**: Plattform-spezifischer Code ist abstrahiert
- **Event-Driven**: Komponenten kommunizieren über Events (sparsam einsetzen)
- **Disposable Pattern**: Alle Ressourcen müssen disposiert werden (DisposableStore, MutableDisposable)

### 8.3 Test-Struktur

- `src/vs/*/test/` - Unit Tests (neben dem Code)
- `test/integration/` - Integration Tests
- `test/smoke/` - Smoke Tests (E2E)
- `extensions/*/src/test/` - Extension Tests

---

## 9. Coding-Richtlinien

- **Einrückung**: Tabs (keine Spaces!)
- **Naming**: PascalCase für Types/Enums, camelCase für Funktionen/Variablen
- **Quotes**: Single Quotes für Code, Double Quotes für User-Strings (Lokalisierung)
- **Pfeilfunktionen**: Bevorzugen über anonymous functions
- **Copyright Header**: Jede Datei muss den Microsoft Copyright Header behalten
- **Async/Await**: Bevorzugen über Promise.then()
- **No `any`/`unknown`**: Typisierungen sind Pflicht
- **JSDoc**: Für alle exportierten Funktionen, Interfaces, Enums, Classes

---

## 10. Erweiterung des Projekts

### 10.1 Neue Built-In Extension hinzufügen

1. Extension-Ordner unter `extensions/` erstellen
2. In `product.json` → `builtInExtensions` Array eintragen (mit SHA256)
3. Gulp-Task `compile-extensions` ausführen

### 10.2 Branding ändern

1. `product.json` bearbeiten (Name, App-IDs, etc.)
2. `resources/win32/code.ico` ersetzen
3. `resources/win32/inno-*.bmp` ersetzen (Installer-Wizard Bilder)
4. Build neu ausführen

### 10.3 Themes hinzufügen

Themes werden in `product.json` → `onboardingThemes` konfiguriert:
```json
{
  "id": "pointer-dark",
  "label": "Pointer Dark",
  "themeId": "Pointer Dark",
  "type": "dark"
}
```

---

## 11. Häufige Probleme und Lösungen

### Electron Binary nicht gefunden
```
Fehler: Cannot find module 'electron'
Lösung: node build/lib/electron.ts (wird automatisch im Build ausgeführt)
```

### Native Module kompilieren nicht
```
Fehler: MSB8020 / node-gyp Fehler
Lösung: VS 2022 mit C++ Desktop Workload installieren
Lösung: In VS Dev Shell ausführen (wird automatisch versucht)
```

### Watcher starten nicht
```
Fehler: deemon not found
Lösung: npm ci im Root ausführen (deemon ist eine devDependency)
```

### Gulp MODULE_NOT_FOUND
```
Wird automatisch repariert von build-windows.ps1
Manuell: npm ci im Root, build/, und extensions/ Ordner
```
