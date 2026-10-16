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
import { RenderModalProps } from "@vencord/discord-types";
import { Modal, openModal, React, TextInput, useState } from "@webpack/common";

const Native = VencordNative.pluginHelpers.VoidcordCustomPlugins as PluginNative<typeof import("./native")>;

function NewPluginModal({ onClose, transitionState, onCreated }: RenderModalProps & { onCreated(folder: string): void; }) {
    const [name, setName] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function create() {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const folder = await Native.create(name, author, description);
            onCreated(folder);
            onClose();
        } catch (err) {
            setError(String(err));
        } finally {
            setBusy(false);
        }
    }

    return <Modal title="New empty plugin" size="small" onClose={onClose} transitionState={transitionState}>
        <form className="vc-voidcord-custom-plugins" onSubmit={event => {
            event.preventDefault();
            void create();
        }}>
            <label>Plugin name<TextInput placeholder="MyPlugin" value={name} onChange={setName} /></label>
            <label>Description<TextInput placeholder="What does your plugin do?" value={description} onChange={setDescription} /></label>
            <label>Developers<TextInput placeholder="Developer one, Developer two" value={author} onChange={setAuthor} /></label>
            <Paragraph>Separate developers with commas. Creates index.ts and a README.md development guide. Existing folders are never overwritten.</Paragraph>
            {error && <Notice.Warning>{error}</Notice.Warning>}
            <div className="vc-voidcord-custom-plugins-actions">
                <Button type="submit" disabled={busy || !name.trim() || !author.trim() || !description.trim()}>{busy ? "Creating…" : "Create plugin"}</Button>
                <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
            </div>
        </form>
    </Modal>;
}

function CustomPluginsTab() {
    const [error, setError] = useState("");
    const [created, setCreated] = useState("");
    const [opening, setOpening] = useState(false);

    async function openFolder() {
        setOpening(true);
        setError("");
        try {
            await Native.openFolder();
        } catch (err) {
            setError(String(err));
        } finally {
            setOpening(false);
        }
    }

    return <SettingsTab>
        <div className="vc-voidcord-custom-plugins">
            <Heading>Custom Plugins</Heading>
            <Notice.Warning>Plugins run with access to your Discord client. Only use source code you trust.</Notice.Warning>
            <div className="vc-voidcord-custom-plugins-actions">
                <Button variant="secondary" disabled={opening} onClick={() => void openFolder()}>Open Folder</Button>
                <Button onClick={() => openModal(props => <NewPluginModal {...props} onCreated={setCreated} />)}>New empty plugin</Button>
            </div>
            {IS_STANDALONE && <Paragraph>Templates are saved in the Voidcord data folder. Move them to src/userplugins in a local source build, rebuild and restart Discord to load them.</Paragraph>}
            {error && <Notice.Warning>{error}</Notice.Warning>}
            {created && <Notice.Info>Created {created}/index.ts and README.md. Open Folder to edit them and read the guide. A rebuild and full Discord restart are required to load the plugin.</Notice.Info>}
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
