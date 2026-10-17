# Voidcord v0.2.0 — External Custom Plugins

Voidcord is a Discord client modification based on Equicord. This release introduces restart-based external plugin loading without rebuilding the client.

## What's new

- Separate **Custom Plugins** directory in the Voidcord data folder.
- Automatic compilation of TS/TSX, JS/JSX, relative imports and JSON at startup.
- Self-contained CSS imports with styles applied when a plugin starts.
- Per-version source approval through a native confirmation dialog. Editing source requires approval again.
- External plugin registration before Equicord initializes settings, lifecycle and webpack patches.
- Folder creation, multi-author templates, development guides, refresh and error reporting in Custom Plugins.
- Personal plugins are kept outside the published source and release bundles.

## Install or update on Windows

1. Back up `%APPDATA%\Voidcord` and fully quit Discord, including the tray icon.
2. Download **VoidcordInstallerCli.exe** below and check its SHA-256 against **SHA256SUMS.txt**.
3. Choose **Install Voidcord** for a new install or **Repair Voidcord** to update an existing install, then select your Discord installation.
4. Start Discord and open **Voidcord Settings → Custom Plugins**.

If you currently use a local source build containing personal plugins, back those plugins up first. Repair switches you to the published build, which does not contain them.

## Add a plugin

Use **Open Folder**, add one source folder per plugin, click **Refresh folders**, review the source and approve it using **Review & trust**. Fully restart Discord, enable the plugin and restart again if prompted. No pnpm commands or project rebuild are needed for supported external plugins.

This is a supported subset of the Equicord plugin format, not universal compatibility. External `native.ts`, arbitrary npm imports, external-to-external dependencies and some aliases are unsupported. See **CUSTOM-PLUGINS.md** for details. Old `userplugins` templates are not automatically migrated.

## Downloads

| File | Purpose |
| --- | --- |
| `VoidcordInstallerCli.exe` | Recommended online Windows x64 installer |
| `desktop.asar` | Desktop archive used by installer/updater; not Discord's `app.asar` |
| `Voidcord-Desktop.zip` | Unpacked desktop bundle for developers |
| `equibop.asar` | Compatible Equibop installations |
| `extension-chrome.zip`, `extension-firefox.zip` | Browser builds; external folder loading is desktop-only |
| `INSTALL-Windows.md`, `CUSTOM-PLUGINS.md` | Installation and plugin documentation |
| `SHA256SUMS.txt` | Download checksums |

## Validation and known limits

Ten automated tests cover templates, compilation, local imports, trust fingerprints, file limits and invalid-plugin isolation. TypeScript, targeted ESLint, desktop/Equibop and browser builds were checked locally. CI also runs plugin tests, type checks, builds and Go installer tests.

Discord UI behavior, external webpack patches and end-to-end approval/loading have not been fully smoke-tested in a live client. Plugins execute trusted code with access to the Discord session, not in a sandbox. A broken plugin can still hang or damage the client. If startup fails, fully quit Discord, move its folder out of Custom Plugins and start again.

The Windows executable is unsigned. Do not disable security software. Client modifications can violate Discord's Terms of Service; use at your own risk. GPL-3.0-or-later; upstream Equicord/Vencord attribution is preserved.
