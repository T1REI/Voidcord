# Voidcord Installer

This is the Voidcord-branded fork of the Vencord Installer. It installs Voidcord builds from the latest `T1REI/Voidcord` release. Do not use releases from the upstream Vencord installer for Voidcord. The project keeps the upstream GPL license and required copyright notices; do not remove or misrepresent upstream attribution.

Build the Windows CLI from this directory with Go and a C compiler installed:

```powershell
make PLATFORM=windows ARCH=amd64 GUI=0
```

The Voidcord build workflow compiles the CLI and uploads it with the desktop build artifacts. From the root of the Voidcord repository, `Inject-UnInject.bat` selects install or uninstall and invokes the matching installer CLI. For local development, build an installer CLI into `Installer/build` and set `VOIDCORD_USE_LOCAL_INSTALLER=1` before running the BAT file.

The installer source retains its upstream GPL licensing and notices.
