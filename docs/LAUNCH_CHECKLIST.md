# Pointer Launch Checklist

Use this checklist before publishing a public Pointer release.

## Repository Readiness

- `product.json`, `package.json`, README badges, issue links, and release docs point to `https://github.com/PointerIDE/Pointer`.
- Public issue templates, PR template, and security policy are Pointer-specific.
- No local tool output, generated release artifacts, tokens, credentials, or private logs are tracked.
- Contributor setup works from the documented `run\start-dev.bat`, `run\start.bat`, and `run\build-pointer.bat` entrypoints.

## Local Validation

```bat
npm run compile-check-ts-native
npm audit --omit=dev --audit-level=high
run\build-pointer.bat --Installer --Zip
```

`npm audit --omit=dev` may still report the current moderate `uuid` advisory
through `@microsoft/dev-tunnels-connections` and `@vscode/deviceid`. Track it
until those upstream packages provide compatible fixed versions.

Confirm that `.build\artifacts\` contains:

- `Pointer-win32-x64\Pointer.exe`
- `Pointer-win32-x64.zip`
- `PointerSetup-x64-1.119.0.exe`

## Smoke Test

- Launch the portable app with temporary user data and extensions directories.
- Confirm the window title, product name, icon, About dialog, and Report Issue link use Pointer branding.
- Open and save a file.
- Open the integrated terminal.
- Open the Source Control view in a Git repository.
- Confirm the extension host starts without an obvious startup error.
- Install with `PointerSetup-x64-1.119.0.exe`, launch the installed app, and uninstall it cleanly.

## Release

- Merge the release-readiness branch after CI is green.
- Run the `Pointer Windows Release` workflow from `main`.
- Use tag `v1.119.0`, architecture `x64`, ZIP enabled, Installer enabled, Draft enabled.
- Confirm the GitHub Release is a draft and has both assets attached before publishing.

## Signing Notice

Pointer Windows builds are currently unsigned. Public release notes and installer docs must state this clearly until code signing is configured.
