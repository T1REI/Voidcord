/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DATA_DIR } from "@main/utils/constants";
import { createPluginTemplate } from "@shared/customPlugins";
import { IpcMainInvokeEvent, shell } from "electron";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";

async function getSourceDirectory() {
    if (IS_STANDALONE) {
        const directory = join(DATA_DIR, "userplugins");
        await mkdir(directory, { recursive: true });
        return directory;
    }
    const root = resolve(__dirname, "../..");
    const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    if (pkg.name !== "voidcord") throw new Error("Voidcord source directory could not be located");
    const directory = join(root, "src", "userplugins");
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
