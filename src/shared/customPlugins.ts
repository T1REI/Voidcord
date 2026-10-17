/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function createPluginTemplate(name: string, author: string, description: string) {
    for (const [label, value] of Object.entries({ name, author, description })) {
        if (typeof value !== "string" || !value.trim() || value.length > 500 || /[\u0000-\u001f]/.test(value))
            throw new Error(`Invalid plugin ${label}`);
    }

    const folderName = name.trim().replace(/[^a-zA-Z0-9]/g, "");
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,63}$/.test(folderName) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(folderName))
        throw new Error("Use a plugin name starting with a Latin letter (maximum 64 letters and digits)");

    const authors = [...new Set(author.split(",").map(value => value.trim()).filter(Boolean))];
    if (!authors.length || authors.length > 20)
        throw new Error("Enter between 1 and 20 developers separated by commas");

    return {
        folderName: folderName[0].toLowerCase() + folderName.slice(1),
        source: `import definePlugin from "@utils/types";\n\nexport default definePlugin({\n    name: ${JSON.stringify(name.trim())},\n    description: ${JSON.stringify(description.trim())},\n    authors: [${authors.map(value => `{ name: ${JSON.stringify(value)}, id: 0n }`).join(", ")}],\n    start() {},\n    stop() {}\n});\n`,
        guide: createPluginGuide()
    };
}

function createPluginGuide() {
    return `# Разработка плагина Voidcord / Equicord

## Быстрый старт

В этой папке находится index.ts — пустой плагин. Откройте папку в VS Code.
Название, описание и разработчики уже заполнены. Замените id: 0n своим Discord ID с окончанием n, если хотите указать свой аккаунт.

1. Храните папку в %APPDATA%/Voidcord/Custom Plugins. Open Folder открывает нужное расположение.
2. Отредактируйте index.ts или index.tsx и сохраните файлы.
3. В Custom Plugins нажмите Refresh folders, проверьте исходники и Review & trust. Подтвердите доверие в системном диалоге.
4. Полностью перезапустите Discord. Плагин появится в списке; включите его и перезапустите клиент.
5. После изменения исходников повторите подтверждение доверия и перезапуск. pnpm install и сборка проекта для этого не нужны.

Клиент автоматически компилирует TS/TSX при запуске. Это не изолированная среда: доверенный код получает доступ к Discord.

## Удобный рабочий процесс

- После изменения кода подтвердите новую версию и полностью перезапустите клиент. Это не hot reload.
- Ошибки компиляции и загрузки отображаются в Custom Plugins.
- Компиляция проверяет синтаксис, но не заменяет полную проверку типов.
- Старый способ src/userplugins и pnpm watch остаётся доступным для плагинов, требующих полной сборки.

## Структура и API

- index.ts — точка входа. Для React-интерфейса переименуйте её в index.tsx, не оставляйте оба файла.
- start() — включение. stop() — очистка собственных таймеров, обработчиков и других ресурсов.
- Настройки: definePluginSettings из @api/Settings, обязательно передайте settings в definePlugin.
- Дополнительные данные: @api/DataStore. Не храните токены и секреты в коде.
- UI и кнопки: используйте готовые компоненты и API Equicord; примеры в src/equicordplugins.
- CSS можно хранить рядом и подключать импортом. CSS должен быть самодостаточным, без url() и @import.
- native.ts во внешних плагинах не поддерживается. Произвольные npm-модули также не поддерживаются.
- Поддержанные импорты: @utils/types, @utils/Logger, @webpack, @webpack/common, react, @components/ErrorBoundary; @api/DataStore, Settings, PluginManager, Styles, ContextMenu, MessageEvents, Notices, Notifications, HeaderBar.
- Допускаются относительные импорты TS/TSX/JS/JSX/JSON/CSS внутри папки плагина. Не более 128 файлов и 2 MiB исходников, без символьных ссылок.
- VencordNative — корректное имя API в Equicord, переименовывать его не нужно.
- Начинайте без webpack-патчей: они чувствительны к обновлениям Discord. Для патчей требуется перезапуск.

## Сохранность и безопасность

Плагины выполняют доверенный вами код. Не устанавливайте неизвестные исходники без проверки.
src/userplugins обычно исключён из Git Voidcord. Храните плагин в отдельном репозитории или делайте резервные копии.

## Документация

- https://docs.equicord.org/plugins/
- https://docs.equicord.org/plugins/common/
- https://docs.equicord.org/installing/custom-plugin/
- https://docs.equicord.org/plugins/native/
`;
}
