/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcEvents } from "@shared/IpcEvents";
import { BrowserWindow, dialog, ipcMain } from "electron";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { compileExternalPlugin, scanExternalPlugins } from "./externalPluginCompiler";
import { DATA_DIR } from "./utils/constants";

export const EXTERNAL_PLUGINS_DIR = join(DATA_DIR, "Custom Plugins");
const trustFile = join(DATA_DIR, "custom-plugin-trust.json");
mkdirSync(EXTERNAL_PLUGINS_DIR, { recursive: true });

function readTrust(): Record<string, string> {
    try {
        const value = JSON.parse(readFileSync(trustFile, "utf8"));
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch { return {}; }
}

ipcMain.on(IpcEvents.GET_EXTERNAL_PLUGINS, event => {
    try { event.returnValue = scanExternalPlugins(EXTERNAL_PLUGINS_DIR, readTrust()); }
    catch (error) { event.returnValue = { plugins: [], statuses: [{ folder: "Custom Plugins", trusted: false, error: String(error) }] }; }
});

ipcMain.handle(IpcEvents.TRUST_EXTERNAL_PLUGIN, async (event, folder: string, hash: string, revoke: boolean) => {
    const plugin = compileExternalPlugin(EXTERNAL_PLUGINS_DIR, folder);
    if (plugin.hash !== hash) throw new Error("Plugin files changed. Refresh and review them again.");
    const trust = readTrust();
    if (revoke) delete trust[folder];
    else {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) throw new Error("No client window");
        const result = await dialog.showMessageBox(window, {
            type: "warning", title: "Trust external plugin?", message: `Allow ${folder} to run inside Discord?`,
            detail: "This code can access your Discord session and data. This is not a sandbox. Only approve source code you have reviewed and trust. Changes require approval again. Restart Discord after approval or revocation.",
            buttons: ["Cancel", "Trust this version"], defaultId: 0, cancelId: 0
        });
        if (result.response !== 1) return false;
        if (compileExternalPlugin(EXTERNAL_PLUGINS_DIR, folder).hash !== hash) throw new Error("Plugin changed during approval");
        trust[folder] = hash;
    }
    writeFileSync(trustFile, JSON.stringify(trust, null, 2));
    return true;
});
