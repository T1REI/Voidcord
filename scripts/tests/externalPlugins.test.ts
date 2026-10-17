import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { compileExternalPlugin, scanExternalPlugins } from "../../src/main/externalPluginCompiler";

function fixture(run: (root: string, plugin: string) => void) {
    const root = mkdtempSync(join(process.env.TEMP ?? tmpdir(), "voidcord-plugins-"));
    const plugin = join(root, "Example");
    mkdirSync(plugin);
    try { run(root, plugin); } finally { rmSync(root, { recursive: true, force: true }); }
}

test("compiles TSX, relative dependencies and CSS without executing source", () => fixture((root, plugin) => {
    writeFileSync(join(plugin, "index.tsx"), 'import definePlugin from "@utils/types"; import { value } from "./value"; import "./style.css"; export default definePlugin({ name: "Example", description: value, authors: [], render() { return <div>Tab</div>; } });');
    writeFileSync(join(plugin, "value.ts"), 'export const value: string = "Hello";');
    writeFileSync(join(plugin, "style.css"), ".example { color: red; }");
    const bundle = compileExternalPlugin(root, "Example");
    assert.match(bundle.modules["index.tsx"], /React.createElement/);
    assert.match(bundle.modules["index.tsx"], /require\("\.\/value.ts"\)/);
    assert.match(bundle.css, /color: red/);
    const cache = new Map();
    function load(name: string): any {
        if (name === "@utils/types") return { __esModule: true, default: (p: unknown) => p };
        const file = name.slice(2);
        if (cache.has(file)) return cache.get(file).exports;
        const module = { exports: {} };
        cache.set(file, module);
        new Function("module", "exports", "require", bundle.modules[file])(module, module.exports, load);
        return module.exports;
    }
    assert.equal(load("./index.tsx").default.description, "Hello");
}));

test("requires approval and invalidates approval when any source changes", () => fixture((root, plugin) => {
    writeFileSync(join(plugin, "index.ts"), 'export default { name: "Example" };');
    const bundle = compileExternalPlugin(root, "Example");
    assert.equal(scanExternalPlugins(root, {}).plugins.length, 0);
    assert.equal(scanExternalPlugins(root, { Example: bundle.hash }).plugins.length, 1);
    writeFileSync(join(plugin, "index.ts"), 'export default { name: "Changed" };');
    assert.equal(scanExternalPlugins(root, { Example: bundle.hash }).plugins.length, 0);
}));

test("isolates bad folders and rejects escapes, native code, npm imports and syntax errors", () => fixture((root, plugin) => {
    for (const source of ['import "../outside";', 'import "fs";', 'const = ;', 'require(variable);']) {
        writeFileSync(join(plugin, "index.ts"), source);
        assert.throws(() => compileExternalPlugin(root, "Example"));
        assert.equal(scanExternalPlugins(root, {}).statuses[0].trusted, false);
        assert.ok(scanExternalPlugins(root, {}).statuses[0].error);
    }
    assert.throws(() => compileExternalPlugin(root, "../Example"));
    writeFileSync(join(plugin, "index.ts"), 'export default {};');
    writeFileSync(join(plugin, "native.ts"), "export const native = true;");
    assert.throws(() => compileExternalPlugin(root, "Example"), /native/);
}));

test("rejects ambiguous entrypoints and remote CSS", () => fixture((root, plugin) => {
    writeFileSync(join(plugin, "index.ts"), 'import "./style.css"; export default {};');
    writeFileSync(join(plugin, "style.css"), '@import "https://example.com/theme.css";');
    assert.throws(() => compileExternalPlugin(root, "Example"), /self-contained/);
    writeFileSync(join(plugin, "index.js"), "export default {};");
    assert.throws(() => compileExternalPlugin(root, "Example"), /exactly one/);
}));

test("handles circular local imports and JSON modules", () => fixture((root, plugin) => {
    writeFileSync(join(plugin, "index.ts"), 'import { value } from "./a"; export default { value };');
    writeFileSync(join(plugin, "a.ts"), 'import "./index"; import data from "./data.json"; export const value = data.value;');
    writeFileSync(join(plugin, "data.json"), '{"value": 42}');
    const bundle = compileExternalPlugin(root, "Example");
    assert.equal(Object.keys(bundle.modules).length, 3);
    assert.match(bundle.modules["data.json"], /42/);
}));

test("rejects oversized sources", () => fixture((root, plugin) => {
    writeFileSync(join(plugin, "index.ts"), " ".repeat(2 * 1024 * 1024 + 1));
    assert.throws(() => compileExternalPlugin(root, "Example"), /exceeds/);
}));

test("bad plugin does not prevent an approved good plugin loading", () => fixture((root, plugin) => {
    writeFileSync(join(plugin, "index.ts"), 'export default {};');
    mkdirSync(join(root, "Broken"));
    writeFileSync(join(root, "Broken", "index.ts"), "const = ;");
    const bundle = compileExternalPlugin(root, "Example");
    const result = scanExternalPlugins(root, { Example: bundle.hash });
    assert.equal(result.plugins.length, 1);
    assert.equal(result.plugins[0].folder, "Example");
    assert.ok(result.statuses.find(status => status.folder === "Broken")?.error);
}));
