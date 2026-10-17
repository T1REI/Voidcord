/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { createHash } from "crypto";
import { lstatSync, readdirSync, readFileSync, realpathSync } from "fs";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "path";
import ts from "typescript";

import { externalModuleNames, ExternalPluginBundle, ExternalPluginSnapshot } from "../shared/externalPlugins";

const extensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".css"];
const allowedModules = new Set<string>(externalModuleNames);
const maxBytes = 2 * 1024 * 1024;

export function compileExternalPlugin(root: string, folder: string): ExternalPluginBundle {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(folder)) throw new Error("Invalid folder name");
    const base = join(root, folder);
    if (lstatSync(base).isSymbolicLink()) throw new Error("Linked plugin folders are not supported");
    const files = new Map<string, string>();
    let bytes = 0;
    function collect(directory: string, depth = 0) {
        if (depth > 16) throw new Error("Plugin directory nesting exceeds 16 levels");
        for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
            const path = join(directory, entry.name);
            if (entry.isSymbolicLink()) throw new Error("Symbolic links are not supported");
            const real = relative(realpathSync(base), realpathSync(path));
            if (real.startsWith(`..${sep}`) || real === ".." || isAbsolute(real)) throw new Error("File escapes plugin directory");
            if (entry.isDirectory()) { collect(path, depth + 1); continue; }
            if (!extensions.includes(extname(entry.name))) continue;
            if (entry.name === "native.ts" || real.replaceAll("\\", "/").startsWith("native/")) throw new Error("External native modules are not supported");
            bytes += lstatSync(path).size;
            if (bytes > maxBytes || files.size >= 128) throw new Error("Plugin exceeds 2 MiB or 128 files");
            files.set(real.replaceAll("\\", "/"), readFileSync(path, "utf8"));
        }
    }
    collect(base);
    const entries = ["index.ts", "index.tsx", "index.js", "index.jsx"].filter(file => files.has(file));
    if (entries.length !== 1) throw new Error("Provide exactly one index.ts, index.tsx, index.js or index.jsx");
    const hash = createHash("sha256");
    for (const pair of [...files].sort(([a], [b]) => a.localeCompare(b))) hash.update(JSON.stringify(pair));
    const modules: Record<string, string> = Object.create(null);
    const styles = new Map<string, string>();
    function resolveImport(from: string, specifier: string) {
        if (allowedModules.has(specifier)) return specifier;
        if (!specifier.startsWith("./") && !specifier.startsWith("../")) throw new Error(`Unsupported import: ${specifier}`);
        const path = relative(base, resolve(base, dirname(from), specifier)).replaceAll("\\", "/");
        if (path.startsWith("../") || isAbsolute(path)) throw new Error("Import escapes plugin directory");
        const candidates = [path, ...extensions.map(ext => path + ext), ...extensions.map(ext => `${path}/index${ext}`)];
        const found = candidates.find(file => files.has(file));
        if (!found) throw new Error(`Cannot resolve ${specifier} from ${from}`);
        visit(found);
        return `./${found}`;
    }
    function visit(file: string) {
        if (Object.hasOwn(modules, file)) return;
        modules[file] = "";
        const source = files.get(file)!;
        if (file.endsWith(".css")) {
            if (/@import\b|url\s*\(/i.test(source)) throw new Error("External CSS must be self-contained (no @import or url)");
            styles.set(file, source);
            return;
        }
        if (file.endsWith(".json")) { modules[file] = `module.exports = ${JSON.stringify(JSON.parse(source))};`; return; }
        const result = ts.transpileModule(source, {
            fileName: file,
            reportDiagnostics: true,
            compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
            transformers: { after: [context => node => {
                const visitor: ts.Visitor = child => {
                    if (ts.isCallExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === "require") {
                        if (child.arguments.length !== 1 || !ts.isStringLiteral(child.arguments[0])) throw new Error("Dynamic require is not supported");
                        return ts.factory.updateCallExpression(child, child.expression, child.typeArguments, [ts.factory.createStringLiteral(resolveImport(file, child.arguments[0].text))]);
                    }
                    return ts.visitEachChild(child, visitor, context);
                };
                return ts.visitNode(node, visitor) as ts.SourceFile;
            }] }
        });
        const errors = result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error);
        if (errors?.length) throw new Error(`${file}: ${errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, "\n")).join("\n")}`);
        modules[file] = result.outputText;
    }
    visit(entries[0]);
    return { folder, hash: hash.digest("hex"), entry: entries[0], modules, css: [...styles.values()].join("\n") };
}

export function scanExternalPlugins(root: string, trusted: Record<string, string>): ExternalPluginSnapshot {
    const snapshot: ExternalPluginSnapshot = { plugins: [], statuses: [] };
    for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
        try {
            const plugin = compileExternalPlugin(root, entry.name);
            const approved = Object.hasOwn(trusted, entry.name) && trusted[entry.name] === plugin.hash;
            snapshot.statuses.push({ folder: entry.name, hash: plugin.hash, trusted: approved });
            if (approved) snapshot.plugins.push(plugin);
        } catch (error) {
            snapshot.statuses.push({ folder: entry.name, trusted: false, error: String(error) });
        }
    }
    return snapshot;
}
