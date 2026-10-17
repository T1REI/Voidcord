/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface ExternalPluginBundle {
    folder: string;
    hash: string;
    entry: string;
    modules: Record<string, string>;
    css: string;
}

export interface ExternalPluginStatus {
    folder: string;
    hash?: string;
    trusted: boolean;
    error?: string;
}

export interface ExternalPluginSnapshot {
    plugins: ExternalPluginBundle[];
    statuses: ExternalPluginStatus[];
}

export const externalModuleNames = [
    "@api/DataStore", "@api/Settings", "@api/PluginManager", "@api/Styles",
    "@api/ContextMenu", "@api/MessageEvents", "@api/Notices", "@api/Notifications",
    "@api/HeaderBar", "@utils/types", "@utils/Logger", "@webpack", "@webpack/common",
    "@components/ErrorBoundary", "react"
] as const;
