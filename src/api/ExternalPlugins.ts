/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as ContextMenu from "@api/ContextMenu";
import * as DataStore from "@api/DataStore";
import * as HeaderBar from "@api/HeaderBar";
import * as MessageEvents from "@api/MessageEvents";
import * as Notices from "@api/Notices";
import * as Notifications from "@api/Notifications";
import * as PluginManager from "@api/PluginManager";
import * as Settings from "@api/Settings";
import * as Styles from "@api/Styles";
import ErrorBoundary from "@components/ErrorBoundary";
import type { ExternalPluginStatus } from "@shared/externalPlugins";
import * as LoggerModule from "@utils/Logger";
import * as Types from "@utils/types";
import * as Webpack from "@webpack";
import * as Common from "@webpack/common";

import Plugins, { PluginMeta } from "~plugins";

export const externalPluginErrors: ExternalPluginStatus[] = [];

export function loadExternalPlugins() {
    if (IS_WEB || !VencordNative.customPlugins) return;
    const modules: Record<string, unknown> = {
        "@api/DataStore": DataStore, "@api/Settings": Settings, "@api/PluginManager": PluginManager,
        "@api/Styles": Styles, "@api/ContextMenu": ContextMenu, "@api/MessageEvents": MessageEvents,
        "@api/Notices": Notices, "@api/Notifications": Notifications, "@api/HeaderBar": HeaderBar,
        "@utils/types": Types, "@utils/Logger": LoggerModule, "@webpack": Webpack,
        "@webpack/common": Common, "@components/ErrorBoundary": { __esModule: true, default: ErrorBoundary }
    };
    const react = new Proxy({}, { get: (_, key) => key === "__esModule" ? true : key === "default" ? Common.React : Reflect.get(Common.React, key) });
    let snapshot;
    try { snapshot = VencordNative.customPlugins.snapshot(); }
    catch (error) { externalPluginErrors.push({ folder: "Custom Plugins", trusted: false, error: String(error) }); return; }
    const builtInNames = new Set(Object.keys(Plugins));
    for (const bundle of snapshot.plugins) {
        try {
            const cache = new Map<string, { exports: any; }>();
            const requireModule = (name: string): any => {
                if (name === "react") return react;
                if (Object.hasOwn(modules, name)) return new Proxy(modules[name] as object, { get: (target, key) => key === "__esModule" ? true : Reflect.get(target, key) });
                if (!name.startsWith("./") || !Object.hasOwn(bundle.modules, name.slice(2))) throw new Error(`Unknown external module ${name}`);
                const file = name.slice(2);
                if (cache.has(file)) return cache.get(file)!.exports;
                const module = { exports: {} };
                cache.set(file, module);
                const execute = new Function("module", "exports", "require", "React", bundle.modules[file]);
                execute(module, module.exports, requireModule, react);
                return module.exports;
            };
            const plugin = requireModule(`./${bundle.entry}`).default as Types.Plugin;
            if (!plugin || typeof plugin.name !== "string" || !plugin.name.trim() || typeof plugin.description !== "string" || !Array.isArray(plugin.authors)) throw new Error("Invalid default plugin export");
            if (plugin.name in Plugins) throw new Error(`Duplicate plugin name: ${plugin.name}`);
            if (plugin.required || plugin.isDependency) throw new Error("External plugins cannot be required");
            if (plugin.dependencies?.some(name => !builtInNames.has(name))) throw new Error("Missing dependency (external-to-external dependencies are not supported)");
            plugin.requiresRestart = true;
            plugin.enabledByDefault = false;
            const { start } = plugin;
            const { stop } = plugin;
            let style: HTMLStyleElement | undefined;
            plugin.start = function () {
                if (bundle.css && !style) {
                    style = document.createElement("style");
                    style.dataset.voidcordPlugin = plugin.name;
                    style.textContent = bundle.css;
                    (document.head ?? document.documentElement).appendChild(style);
                }
                try { return start?.call(this); }
                catch (error) { style?.remove(); style = undefined; throw error; }
            };
            plugin.stop = function () {
                try { return stop?.call(this); }
                finally { style?.remove(); style = undefined; }
            };
            Plugins[plugin.name] = plugin;
            PluginMeta[plugin.name] = { folderName: bundle.folder, userPlugin: true };
        } catch (error) {
            externalPluginErrors.push({ folder: bundle.folder, hash: bundle.hash, trusted: true, error: String(error) });
            new LoggerModule.Logger("ExternalPlugins").error(bundle.folder, error);
        }
    }
}
