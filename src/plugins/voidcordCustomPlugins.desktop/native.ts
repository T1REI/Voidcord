/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EXTERNAL_PLUGINS_DIR } from "@main/externalPlugins";
import { createPluginTemplate } from "@shared/customPlugins";
import { IpcMainInvokeEvent, shell } from "electron";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

async function getSourceDirectory() {
    const directory = EXTERNAL_PLUGINS_DIR;
    await mkdir(directory, { recursive: true });
    return directory;
}

export async function openFolder(_: IpcMainInvokeEvent) {
    const error = await shell.openPath(await getSourceDirectory());
    if (error) throw new Error(error);
}

export async function create(_: IpcMainInvokeEvent, name: string, author: string, description: string) {
    const template = createPluginTemplate(name, author, description);
    const directory = join(await getSourceDirectory(), template.folderName);
    await mkdir(directory);
    await writeFile(join(directory, "index.ts"), template.source, { flag: "wx" });
    await writeFile(join(directory, "README.md"), template.guide, { flag: "wx" });
    return template.folderName;
}
