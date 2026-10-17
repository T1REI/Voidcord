# Voidcord

**Discord с возможностями Equicord и внешними пользовательскими плагинами.**

[Скачать для Windows](https://github.com/T1REI/Voidcord/releases/latest) · [Установка](WINDOWS.md) · [Custom Plugins](CUSTOM-PLUGINS.md) · [Изменения v0.2.0](RELEASE-NOTES.md)

Voidcord основан на [Equicord](https://github.com/Equicord/Equicord). Код и авторство Equicord/Vencord сохранены по лицензии GPL-3.0-or-later. Исходная upstream-ревизия указана в `UPSTREAM.json`.

## Быстрая установка

1. Полностью закройте Discord, включая значок в трее.
2. Скачайте **VoidcordInstallerCli.exe** из [последнего релиза](https://github.com/T1REI/Voidcord/releases/latest).
3. Выберите **Install Voidcord**, а при обновлении — **Repair Voidcord**, затем свою установку Discord.
4. Запустите Discord и откройте **Voidcord Settings**.

Node.js, pnpm и Go для готового релиза не нужны. Установщик не подписан: проверяйте SHA-256 по файлу релиза и не отключайте защиту Windows. Подробности, удаление и восстановление — в [WINDOWS.md](WINDOWS.md).

## Внешние плагины без пересборки

Папка: `%APPDATA%\Voidcord\Custom Plugins`. Внутри — отдельная папка для каждого плагина с `index.ts`, `index.tsx`, `index.js` или `index.jsx`.

**Open Folder → добавить папку → Refresh folders → проверить код → Review & trust → полный перезапуск Discord → включить плагин.** После включения примените запрошенный перезапуск.

TS/TSX, локальные импорты, JSON и самодостаточный CSS обрабатываются автоматически. При редактировании исходников требуется подтвердить новую версию. Есть создание заготовок с несколькими авторами и Markdown-инструкцией.

Это не hot reload и не универсальный загрузчик любых Equicord-плагинов: `native.ts`, произвольные npm-зависимости и часть алиасов не поддерживаются. Плагины не изолированы от Discord. Формат, ограничения и восстановление описаны в [CUSTOM-PLUGINS.md](CUSTOM-PLUGINS.md).

Личные плагины не входят в релиз. Старые шаблоны из `%APPDATA%\Voidcord\userplugins` не перемещаются автоматически. Традиционная сборка через `src/userplugins` остаётся доступной; не устанавливайте один плагин одновременно обоими способами.

## Сборка из исходников

Requires Node.js 22 or newer and the pnpm version specified in `package.json`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm test:custom-plugins
pnpm testTsc
pnpm build
```

Desktop output is now `dist/desktop/` and `dist/desktop.asar`, not the old loose files in `dist/`. Existing Voidcord settings and themes remain in the Voidcord data directory. Upstream's automatic development-profile copy/restart is disabled to avoid overwriting an existing Voidcord profile.

## Подключение локальной сборки

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

Use `pnpm uninject` to uninstall. The updated installer understands `dist/desktop/`; do not use an older downloaded installer with this source layout.

## Проверки и обновления

Автоматические проверки: 10 тестов шаблонов и внешнего компилятора, TypeScript, сборки desktop/Equibop/browser; релизный CI также проверяет Go-установщик. Полный runtime smoke test внешних плагинов в Discord ещё не завершён.

Релизы публикуются отдельным workflow с неизменяемым тегом. Перед обновлением сохраните `%APPDATA%\Voidcord` и личные плагины. [MIGRATION.md](MIGRATION.md) содержит сведения о переходе на Equicord и восстановлении.

## Disclaimer

Not affiliated with Discord, Equicord or Vencord. Client modifications violate Discord's Terms of Service; use at your own risk.
