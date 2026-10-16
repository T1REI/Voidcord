# Equicord migration and recovery

## Recovery point

Before migration, the working tree was clean at `512a6ffb4dcb8cb7bc479f4ba548b93032cf04d8`. Work is isolated on `migration/equicord`. The old `voidcord-publish` branch is retained.

External backup: `../Backups/before-equicord-20261017/` (relative to this repository). It contains a verified full Git bundle, a ZIP of the tracked source and a copy of the previous `dist` directory. Keep this backup offline before rewriting any remote history. It does not include the live Discord settings profile; back that up separately before installing/testing.

Recover into a NEW directory, without overwriting this checkout:

```sh
git clone /path/to/voidcord.bundle Voidcord-recovered
git -C Voidcord-recovered switch voidcord-publish
```

Build the recovered version and reinstall its local build with Discord closed. For a quick binary recovery, the backed-up `dist` must be restored together with the old source/installer layout; do not mix old loose files and new `dist/desktop` output.

## Future changes

Commit each tested change separately. Before releases, make an annotated version tag and retain its build artifacts. Undo published changes with `git revert <commit>`, followed by testing and rebuilding. Do not use force-push for ordinary rollback.

The repository owner explicitly authorized a clean-history publication on 2026-10-17: replace `main` with a parentless Equicord-based snapshot, remove the old `devbuild` release/tag and historical Actions runs/caches. The repository itself, access settings and secrets are retained. The pre-cleanup remote mirror, verified bundle, release metadata and assets are saved in `../Backups/github-before-cleanup-20261017/`. Deleting Git history does not retract public clones, GitHub internal references or cached data.

## Upstream maintenance

`UPSTREAM.json` pins the imported Equicord revision. Keep upstream attribution and compatibility identifiers (`Vencord`, `VencordNative`, `vencord://`, `@vencord/discord-types`); these remain part of Equicord's API and must not be globally renamed.

Fetch a chosen Equicord revision, review the diff against the pinned revision, and port updates on a separate branch. Do not blindly replace Voidcord-specific settings paths, installer paths, workflows or plugin management. Update the pin after validation.

## Manual smoke test before release

1. Export settings and copy the Voidcord profile with Discord closed.
2. Install the new local build using the updated installer.
3. Open Voidcord settings, Plugins, Custom Plugins, Themes and Backup & Restore.
4. Create a template, rebuild, fully restart, and verify it appears under Custom Plugins.
5. Enable/disable a plugin without patches; test a trusted patch plugin and its restart prompt separately.
6. Check native helpers, missing dependencies, duplicate names and startup logs.
7. Restart Discord again and verify settings/theme persistence; uninstall and verify vanilla startup.

Build/type/unit checks do not prove that Discord's current runtime webpack patches all match or that third-party plugins cannot crash. Only mark this checklist complete after testing in the actual client.

## Validation on this machine

Dependencies installed from the frozen upstream lockfile using pnpm 12.8.1 / Node 24.16.0. Unit tests cover template generation, metadata escaping and invalid names/inputs. Desktop/Equibop local and standalone builds and the standalone browser build completed. Type checking, targeted ESLint and the custom tab stylesheet checks were run. The plugin metadata generator was also checked.

The installer was compiled locally using Go 1.27.2 after fixing an inherited non-constant format string in its logger. `go test -tags cli ./...` passes compilation/vet (the Go packages currently contain no tests). The executable is `Installer/build/VoidcordInstallerCli-Equicord.exe`; the distinct filename prevents accidentally running the old cached installer. CI also includes a Windows CLI installer build. Installation into Discord has not been performed.

No Discord runtime smoke test, profile migration or injection was performed. See the clean-history publication scope above; no new binary release is published automatically.
