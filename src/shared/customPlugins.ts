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

    return {
        folderName: folderName[0].toLowerCase() + folderName.slice(1),
        source: `import definePlugin from "@utils/types";\n\nexport default definePlugin({\n    name: ${JSON.stringify(name.trim())},\n    description: ${JSON.stringify(description.trim())},\n    authors: [{ name: ${JSON.stringify(author.trim())}, id: 0n }],\n    start() {},\n    stop() {}\n});\n`
    };
}
