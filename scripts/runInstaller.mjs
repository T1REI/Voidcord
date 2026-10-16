/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./checkNodeVersion.js";

import { execFileSync } from "child_process";
import { chmodSync, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { fileURLToPath } from "url";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE_DIR = join(BASE_DIR, "Installer", "build");
const LOCAL_INSTALLER = process.env.VOIDCORD_USE_LOCAL_INSTALLER === "1" || process.argv.includes("--install");

if (process.argv.includes("--install") && !existsSync(join(BASE_DIR, "dist", "desktop", "patcher.js")))
    throw new Error("Equicord-based Voidcord build not found. Run pnpm build before installing.");

function getFilename() {
    switch (process.platform) {
        case "win32":
            return LOCAL_INSTALLER ? "VoidcordInstallerCli-Equicord.exe" : "VoidcordInstallerCli.exe";
        case "darwin":
            return LOCAL_INSTALLER ? "VoidcordInstallerCli-Equicord-darwin" : "VoidcordInstallerCli-darwin";
        case "linux":
            return LOCAL_INSTALLER ? "VoidcordInstallerCli-Equicord-linux" : "VoidcordInstallerCli-linux";
        default:
            throw new Error("Unsupported platform: " + process.platform);
    }
}

async function ensureBinary() {
    const filename = getFilename();
    mkdirSync(FILE_DIR, { recursive: true });

    const outputFile = join(FILE_DIR, filename);
    const localEtagFile = `${outputFile}.etag`;
    if (LOCAL_INSTALLER && existsSync(outputFile)) {
        console.log("Using locally built Voidcord Installer CLI");
        return outputFile;
    }
    if (LOCAL_INSTALLER)
        throw new Error("Build the updated local installer first: cd Installer && go build -tags cli -o build/" + filename + " .");

    console.log("Downloading " + filename);

    const releaseResponse = await fetch("https://api.github.com/repos/T1REI/Voidcord/releases/latest", {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "Voidcord (https://github.com/T1REI/Voidcord)"
        }
    });
    if (!releaseResponse.ok)
        throw new Error(`Failed to fetch latest Voidcord release: ${releaseResponse.status} ${releaseResponse.statusText}`);

    const release = await releaseResponse.json();
    const asset = release.assets?.find(asset => asset.name === filename);
    if (!asset?.browser_download_url)
        throw new Error(`Latest Voidcord release does not include ${filename}`);
    if (existsSync(outputFile) && existsSync(localEtagFile) && readFileSync(localEtagFile, "utf8") === `${asset.updated_at ?? release.published_at ?? "unknown"}:${release.target_commitish ?? ""}`)
        return outputFile;

    const res = await fetch(asset.browser_download_url, {
        headers: { "User-Agent": "Voidcord (https://github.com/T1REI/Voidcord)" }
    });

    if (!res.ok)
        throw new Error(`Failed to download installer: ${res.status} ${res.statusText}`);

    const temporaryFile = `${outputFile}.download`;
    try {
        const body = Readable.fromWeb(res.body);
        await finished(body.pipe(createWriteStream(temporaryFile, {
            mode: 0o755,
            autoClose: true
        })));
        renameSync(temporaryFile, outputFile);
        if (process.platform !== "win32")
            chmodSync(outputFile, 0o755);
        writeFileSync(localEtagFile, `${asset.updated_at ?? release.published_at ?? "unknown"}:${release.target_commitish ?? ""}`);
    } catch (error) {
        if (existsSync(temporaryFile))
            rmSync(temporaryFile);
        throw error;
    }

    console.log("Finished downloading!");

    return outputFile;
}



const installerBin = await ensureBinary();

console.log("Now running Installer...");

const argStart = process.argv.indexOf("--");
const args = argStart === -1 ? [] : process.argv.slice(argStart + 1);

try {
    execFileSync(installerBin, args, {
        stdio: "inherit",
        env: {
            ...process.env,
            VOIDCORD_USER_DATA_DIR: BASE_DIR,
            VOIDCORD_DEV_INSTALL: "1"
        }
    });
} catch {
    console.error("Something went wrong. Please check the logs above.");
    process.exitCode = 1;
}
