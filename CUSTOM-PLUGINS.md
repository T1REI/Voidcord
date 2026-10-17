# External Custom Plugins

The desktop client loads reviewed source folders from `%APPDATA%\Voidcord\Custom Plugins` on Windows (the `Custom Plugins` subdirectory of the Voidcord data directory elsewhere). This is independent of `src/userplugins` and works in standalone desktop builds too.

1. Open Custom Plugins → Open Folder.
2. Add a folder named using a Latin letter followed by letters, digits, `_` or `-` (up to 64 characters), or use New empty plugin.
3. Supply exactly one entry: `index.ts`, `index.tsx`, `index.js` or `index.jsx`, exporting an Equicord plugin definition as default.
4. Refresh folders, review the actual source files, then use Review & trust. The native confirmation dialog approves the SHA-256 fingerprint of this source version.
5. Fully quit Discord, including the tray icon, and start it again. Enable the plugin in Custom Plugins and restart once more to apply its patches.
6. After editing source files, approve the changed version and restart. No pnpm command or project rebuild is needed.

Existing `src/userplugins` plugins remain supported; do not keep the same plugin both bundled and external. Duplicate names are rejected. Existing `%APPDATA%\Voidcord\userplugins` templates are not automatically moved or trusted. Copy reviewed templates into the new directory yourself. Removing a folder removes the external plugin on next startup; settings are retained. Revoke trust takes effect on restart, not immediately in an already-running session.

## Supported format

Relative TS/TSX/JS/JSX/JSON imports are compiled to an in-memory CommonJS module graph. CSS imports add self-contained styles while the plugin is enabled. Files must stay in the plugin folder, without links. Limits: 128 source files, 2 MiB total, 16 directory levels. Hidden paths and node_modules are ignored. Compilation checks syntax, not types. Arbitrary npm imports, native.ts, external-to-external dependencies, managed CSS imports and CSS url()/@import are not supported.

Available module imports:

- `@utils/types`, `@utils/Logger`, `@webpack`, `@webpack/common`, `react`, `@components/ErrorBoundary`
- `@api/DataStore`, `@api/Settings`, `@api/PluginManager`, `@api/Styles`
- `@api/ContextMenu`, `@api/MessageEvents`, `@api/Notices`, `@api/Notifications`, `@api/HeaderBar`

New plugin definitions are disabled by default. All external plugins require restart when toggled. Registration happens before the built-in plugin manager initializes patches, settings, dependencies and startup stages. One plugin compilation/registration error is reported without stopping other plugins. Runtime start/stop/Flux errors use the existing manager's handling; arbitrary malicious or broken code can still damage or hang the client.

## Security and recovery

**This is not a sandbox.** Trusted code executes with access to the renderer and Discord session. Import restrictions and file checks are compatibility and filesystem safeguards, not isolation. Source execution uses a local module wrapper, never remote downloads. Every changed source version requires approval again. Approval records are local in `custom-plugin-trust.json`, not cloud settings.

If a plugin prevents Discord starting, fully quit Discord and move its folder out of Custom Plugins. Restart. To revoke all approvals while Discord is closed, rename `custom-plugin-trust.json`; do not edit Discord installation files.

## Tests

From the repository root:

```powershell
pnpm exec tsx --test scripts/tests/customPlugins.test.ts scripts/tests/externalPlugins.test.ts
pnpm testTsc
pnpm build
pnpm buildStandalone
```

Discord smoke test still requires a real client: approve a harmless plugin, restart, enable, restart, verify start/stop and CSS, edit source and verify approval invalidation, test a webpack patch after restart, remove a folder, and test recovery from a deliberately failing start handler.
