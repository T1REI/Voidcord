/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Button } from "@components/Button";
import { Heading } from "@components/Heading";
import { PluginsIcon } from "@components/Icons";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings";
import PluginSettings from "@components/settings/tabs/plugins";
import SettingsPlugin from "@plugins/_core/settings";
import { Devs } from "@utils/constants";
import definePlugin, { PluginNative } from "@utils/types";
import { React, TextInput, useState } from "@webpack/common";

const Native = VencordNative.pluginHelpers.VoidcordCustomPlugins as PluginNative<typeof import("./native")>;

function CustomPluginsTab() {
    const [name, setName] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [created, setCreated] = useState("");
    const [busy, setBusy] = useState(false);

    async function run(action: () => Promise<unknown>) {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            await action();
        } catch (err) {
            setError(String(err));
        } finally {
            setBusy(false);
        }
    }

    return <SettingsTab>
        <div className="vc-voidcord-custom-plugins">
        <Heading>Custom Plugins</Heading>
        <Notice.Warning>Plugins run with access to your Discord client. Only use source code you trust.</Notice.Warning>
        <Paragraph>Powered by Equicord's plugin API. Add plugins to src/userplugins, run pnpm build, then fully restart Discord. Patches, dependencies and native helpers use the standard Equicord lifecycle.</Paragraph>
        <Button variant="secondary" onClick={() => VencordNative.native.openExternal("https://docs.equicord.org/installing/custom-plugin/")}>Plugin documentation</Button>
        {!IS_STANDALONE && <>
            <Paragraph>Create a plugin template in your local source tree. Existing folders are never overwritten.</Paragraph>
            <TextInput placeholder="Plugin name" value={name} onChange={setName} />
            <TextInput placeholder="Author" value={author} onChange={setAuthor} />
            <TextInput placeholder="Description" value={description} onChange={setDescription} />
            <Button disabled={busy || !name.trim() || !author.trim() || !description.trim()} onClick={() => void run(async () => {
                const folder = await Native.create(name, author, description);
                setCreated(`Created src/userplugins/${folder}/index.ts. Run pnpm build and restart Discord to load it.`);
            })}>Create Plugin</Button>
            <Button variant="secondary" disabled={busy} onClick={() => void run(() => Native.openFolder())}>Open Plugins Folder</Button>
        </>}
        {IS_STANDALONE && <Paragraph>This release can manage bundled plugins. To add plugin sources, use a local source build; runtime compilation is not supported.</Paragraph>}
        {error && <Notice.Warning>{error}</Notice.Warning>}
        {created && <Notice.Info>{created}</Notice.Info>}
        <PluginSettings userPluginsOnly />
        </div>
    </SettingsTab>;
}

const section = {
    key: "voidcord_custom_plugins",
    title: "Custom Plugins",
    Component: wrapTab(CustomPluginsTab, "Custom Plugins"),
    Icon: PluginsIcon
};

export default definePlugin({
    name: "VoidcordCustomPlugins",
    description: "Manage custom plugins using the Equicord plugin system",
    authors: [Devs.Voidcord],
    required: true,
    dependencies: ["Settings"],
    start() {
        if (!SettingsPlugin.customEntries.includes(section)) SettingsPlugin.customEntries.push(section);
    },
    stop() {
        const index = SettingsPlugin.customEntries.indexOf(section);
        if (index !== -1) SettingsPlugin.customEntries.splice(index, 1);
    }
});
