# Fix: Alle Provider vollfunktional im Select Models UI

## Problem
Provider-Namen erscheinen im UI, aber Connect/Test/APIs funktionieren nicht.
Grund: BYOK-Provider-Registrierung ist hinter Chat-Activation-Gate (braucht Copilot-Login).

## Fix 1: BYOKContrib immer aktivieren
**Datei:** `extensions/copilot/src/extension/extension/vscode-node/contributions.ts`

`asContributionFactory(BYOKContrib)` von `vscodeNodeChatContributions` (Zeile 127) nach `vscodeNodeContributions` verschieben (vor das `];` auf Zeile 107).

```diff
 export const vscodeNodeContributions: IExtensionContributionFactory[] = [
     ...vscodeContributions,
     // ...existing entries...
     sessionSyncContribution,
+    asContributionFactory(BYOKContrib),
 ];

 export const vscodeNodeChatContributions: IExtensionContributionFactory[] = [
     // ...existing entries...
-    asContributionFactory(BYOKContrib),
     // ...rest stays...
 ];
```

## Fix 2: Error-Handling in byokContribution.ts
**Datei:** `extensions/copilot/src/extension/byok/vscode-node/byokContribution.ts`

Komplettes Rewrite von `_registerProviders()` mit:
- `try/catch` um CDN-fetch mit Fallback auf `{}`
- `try/catch` um jedes einzelne `createInstance()` damit ein fehlgeschlagener Provider die anderen nicht blockt
- Logging bei Fehlern

## Fix 3: Irreführende Error-Message
**Datei:** `extensions/copilot/src/extension/byok/vscode-node/abstractLanguageModelChatProvider.ts`

Zeile 157: `"Error fetching available OpenRouter models"` -> dynamischer Provider-Name via `this._name`.
