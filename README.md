# Voidcord

Voidcord is a Discord client modification based on [Equicord](https://github.com/Equicord/Equicord). Upstream code and attribution to Equicord and Vencord are preserved under GPL-3.0-or-later. The exact upstream revision is recorded in `UPSTREAM.json`.

## Build

Requires Node.js 22 or newer and the pnpm version specified in `package.json`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm test:custom-plugins
pnpm testTsc
pnpm build
```

Desktop output is now `dist/desktop/` and `dist/desktop.asar`, not the old loose files in `dist/`. Existing Voidcord settings and themes remain in the Voidcord data directory. Upstream's automatic development-profile copy/restart is disabled to avoid overwriting an existing Voidcord profile.

## Install

For the downloadable Windows release (no developer tools required), follow [WINDOWS.md](WINDOWS.md) and download the installer from [Releases](https://github.com/T1REI/Voidcord/releases/latest).

Fully close Discord first. Build the updated bundled installer with Go, then install the local build:

```sh
cd Installer
go build -tags cli -o build/VoidcordInstallerCli-Equicord.exe .
cd ..
```

In PowerShell:

```powershell
$env:VOIDCORD_USE_LOCAL_INSTALLER = "1"
pnpm inject
```

Use `pnpm uninject` to uninstall. The updated installer understands `dist/desktop/`; do not use an older downloaded installer with this source layout. Installation is not performed automatically by this migration.

## Custom plugins

Open **Voidcord Settings → Custom Plugins**. It uses Equicord's own plugin cards, lifecycle, dependency handling, settings and restart requirements. Local source builds also provide a template creator and folder shortcut.

Place each plugin in `src/userplugins/myPlugin/index.ts` or `index.tsx`, run `pnpm build`, and fully restart Discord. Native helpers belong in that plugin's `native.ts`. Do not execute plugins from untrusted sources. Custom plugins are not sandboxed.

The previous runtime compiler, `eval` loader and custom plugin registry have been removed. Old `custom-plugins/*.ts` files are not automatically executed or deleted. Review and move each to its own folder under `src/userplugins`, adjust imports to Equicord APIs, then rebuild. Release builds cannot compile arbitrary source files at runtime.

See [Equicord plugin documentation](https://docs.equicord.org/plugins/) and [custom plugin installation](https://docs.equicord.org/installing/custom-plugin/).

## Updates and rollback

See [MIGRATION.md](MIGRATION.md) before publishing, updating upstream, or rolling back. The updater follows the Voidcord Git remote, not Equicord releases. CI produces build artifacts only and does not overwrite releases automatically.

## Disclaimer

Not affiliated with Discord, Equicord or Vencord. Client modifications violate Discord's Terms of Service; use at your own risk.
