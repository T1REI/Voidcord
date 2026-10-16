import assert from "node:assert/strict";
import { test } from "node:test";

import { createPluginTemplate } from "../../src/shared/customPlugins";

test("generates an Equicord plugin with escaped metadata", () => {
    const result = createPluginTemplate("My Plugin", "An \"author\"", "Text with \\ and quotes \"");
    assert.equal(result.folderName, "myPlugin");
    assert.ok(result.source.includes('import definePlugin from "@utils/types"'));
    assert.ok(result.source.includes(JSON.stringify('An "author"')));
    assert.ok(result.source.includes('name: "My Plugin"'));
    assert.ok(result.source.includes("id: 0n"));
});

test("supports multiple trimmed unique developers and includes a development guide", () => {
    const result = createPluginTemplate("Team Plugin", " Alice, Bob, Alice, , Carol ", "Description");
    assert.ok(result.source.includes('authors: [{ name: "Alice", id: 0n }, { name: "Bob", id: 0n }, { name: "Carol", id: 0n }]'));
    assert.ok(result.guide.includes("pnpm watch"));
    assert.ok(result.guide.includes("src/userplugins"));
    assert.ok(result.guide.includes("https://docs.equicord.org/plugins/"));
    assert.throws(() => createPluginTemplate("Test", " , , ", "Description"));
    assert.throws(() => createPluginTemplate("Test", Array.from({ length: 21 }, (_, i) => `Dev${i}`).join(","), "Description"));
});

test("rejects invalid names and unsafe input", () => {
    for (const name of ["", "../", "123test", "CON", "LPT1", "a".repeat(65), "test\nplugin"]) {
        assert.throws(() => createPluginTemplate(name, "Author", "Description"));
    }
    assert.throws(() => createPluginTemplate("Test", "", "Description"));
    assert.throws(() => createPluginTemplate("Test", "Author", "a".repeat(501)));
    assert.throws(() => createPluginTemplate(null as unknown as string, "Author", "Description"));
});
