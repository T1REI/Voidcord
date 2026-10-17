# Voidcord for Windows

Equicord-based Voidcord release. Client modifications violate Discord's Terms of Service. Use at your own risk. This build is not signed; no Discord runtime smoke test has been performed by the automated build.

## Install (Windows 10/11 x64)

1. Install the regular desktop Discord application from https://discord.com/download and launch it once. This installer is not intended for the browser or Microsoft Store version.
2. Export settings and uninstall any existing Vencord/Equicord/BetterDiscord modification with its own installer first. Do not stack client modifications.
3. Fully quit Discord using its tray icon, then check Task Manager for remaining Discord processes. Close them normally where possible.
4. Download **VoidcordInstallerCli.exe** from https://github.com/T1REI/Voidcord/releases/latest. You do not need Node.js, pnpm, Git or Go.
5. Launch the EXE. This is a console menu: select **Install Voidcord** with arrow keys and press Enter, then select your Discord installation (Stable, PTB or Canary).
6. Wait for a successful installation, then open Discord. Look for **Voidcord Settings** in User Settings. The installer downloads `desktop.asar` from the Voidcord release, not upstream Equicord.

Run as your regular user. Do not disable antivirus or SmartScreen. If Windows blocks the unsigned file, verify its source and SHA256 first; if your policy still blocks it, stop and investigate rather than disabling protection.

Optional PowerShell command from the download folder:

```powershell
.\VoidcordInstallerCli.exe --install --branch stable
```

## Verify download

Download `SHA256SUMS.txt` from the same release and compare its entry with:

```powershell
Get-FileHash .\VoidcordInstallerCli.exe -Algorithm SHA256
```

The checksum detects corruption/mismatched downloads, not a compromised release publisher.

## Update / repair / uninstall

Fully quit Discord before repair or uninstall. Use the same installer menu: **Repair Voidcord** to fetch the current release and repatch, **Uninstall Voidcord** to remove the client patch. Uninstall does not intentionally delete your settings.

```powershell
.\VoidcordInstallerCli.exe --repair --branch stable
.\VoidcordInstallerCli.exe --uninstall --branch stable
```

The commands are alternatives, not a sequence to execute together. Back up `%APPDATA%\Voidcord` before updates. After a Discord update, use Repair if the mod disappears. If Discord fails to start, uninstall the mod first and test vanilla Discord.

## Release files

- `VoidcordInstallerCli.exe`: recommended online Windows x64 installer, downloads the latest Voidcord desktop archive.
- `desktop.asar`: complete desktop mod bundle used by installer and updater. Do not manually replace Discord's original `app.asar` with it.
- `Voidcord-Desktop.zip`: unpacked desktop bundle for developers/manual diagnostics, not a one-click offline installer.
- `equibop.asar`: bundle for compatible Equibop installations, not needed for regular Discord.
- `extension-chrome.zip`, `extension-firefox.zip`: browser extension builds, not needed for desktop Discord.
- `SHA256SUMS.txt`: checksums for the release downloads.

## Custom Plugins

Open **Voidcord Settings → Custom Plugins → Open Folder**. Plugins live in `%APPDATA%\Voidcord\Custom Plugins`, one folder per plugin. TS/TSX and supported local imports compile automatically; a source checkout and developer tools are not required.

After adding a plugin, click **Refresh folders**, review its source and choose **Review & trust**. Fully restart Discord, enable the plugin and restart again when prompted. Source changes require approval again. This is not hot reload and plugins are not sandboxed. `native.ts`, arbitrary npm modules and some Equicord imports are unsupported. See [CUSTOM-PLUGINS.md](CUSTOM-PLUGINS.md).

Personal plugins are not bundled with Voidcord. Existing templates in `%APPDATA%\Voidcord\userplugins` are not migrated automatically. Back them up and copy compatible plugins into the new folder yourself. Do not keep the same plugin in both an external folder and a local source build.
