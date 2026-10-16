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

1. Для подключения исходников нужен локальный проект Voidcord, Node.js 22+ и pnpm из package.json.
2. Поместите эту папку в src/userplugins/ вашего проекта. Если она уже там, перемещать ничего не нужно.
3. Из корня проекта выполните pnpm install --frozen-lockfile, затем pnpm testTsc и pnpm build.
4. Полностью закройте Discord и подключите локальную сборку командой pnpm inject. Нужен обновлённый локальный установщик: инструкции в README проекта.
5. Откройте Discord → Voidcord Settings → Custom Plugins и включите плагин.

Создание папки в готовом релизе не устанавливает исходники в Discord. Не копируйте их в app.asar и не запускайте через eval/require.

## Удобный рабочий процесс

- Запустите pnpm watch в корне проекта для автоматической пересборки после сохранения.
- После изменения кода дождитесь завершения сборки и перезагрузите клиент. Это не hot reload.
- После добавления нового плагина перезапустите watch и полностью перезапустите Discord.
- После изменения native.ts всегда полностью закрывайте и открывайте Discord.
- Проверяйте типы командой pnpm testTsc и смотрите ошибки сборки в терминале.

## Структура и API

- index.ts — точка входа. Для React-интерфейса переименуйте её в index.tsx, не оставляйте оба файла.
- start() — включение. stop() — очистка собственных таймеров, обработчиков и других ресурсов.
- Настройки: definePluginSettings из @api/Settings, обязательно передайте settings в definePlugin.
- Дополнительные данные: @api/DataStore. Не храните токены и секреты в коде.
- UI и кнопки: используйте готовые компоненты и API Equicord; примеры в src/equicordplugins.
- CSS можно хранить рядом и подключать импортом.
- native.ts используйте только при необходимости Node.js; обращайтесь к нему через VencordNative.pluginHelpers и проверяйте все аргументы IPC.
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
