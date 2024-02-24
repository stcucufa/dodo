import { describe, expect, test } from "bun:test";

import { parse } from "../parser.js";
import { transform, evaluate } from "../transform.js";

describe("Patterns", () => {
    test("choice", async () => {
        const rules = parse(`{ transform
            { match { element { choice \`{ bar baz } } } { apply { content-of } } }
            { match { text } { value-of } }
        }`);
        const input = parse(`{ bar Hello, { foo suckers! } { baz world! } }`);
        expect(await transform(rules, input)).toMatch(/Hello,\s+world!/);
    });
});

describe("Output", () => {
    test("Select element", async () => {
        const rules = parse(`{ transform
            { match { element foo } { apply { element bar } } }
            { match { element bar } { apply { content-of } } }
            { match { text } { value-of } }
        }`);
        const input = parse(`{ foo { baz So long, suckers! } { bar Hello, world! } }`);
        expect(await transform(rules, input)).toBe("Hello, world!");
    });

    test("choice", async () => {
        const rules = parse(`{ transform
            { match { element foo } { apply { element { choice \`{ bar baz } } } } }
            { match { element bar } { apply { content-of } } }
            { match { text } { value-of } }
        }`);
        const input = parse(`{ foo , { fum So long, suckers! } { bar Hello, world! } }`);
        expect((await transform(rules, input)).replace(/\s+/g, " ")).toBe("Hello, world!");
    });
});

test("To text", async () => {
    const rules = parse(`{ transform
        { match { element } { if { empty? } { name-of } { apply { content-of } } } }
        { match { text } { normalize-space { value-of } } }
    }`);
    const input = parse(`{ p { em Hello }, { world }! }`);
    expect(await transform(rules, input)).toBe("Hello, world!");
});

test("Whitespace and newlines", async () => {
    const rules = parse(`
{ transform

    { match { element article }
        \\# { attribute title }\\
\\
{ apply { content-of } }
    }

    { match { element p } { apply { content-of } } }
    { match { text } { value-of } }
}
`);
    const input = parse(`
{ article title: "This is a test"
    { p This is a paragraph. }
}
`);
    expect(await transform(rules, input)).toBe(
`# This is a test

This is a paragraph.`);
});

describe("Import JS", () => {
    const input = parse("{ test }");

    test("Import everything", async () => {
        const rules = parse(`
{ transform
    { import-js: ./tests/import.js }
    { match { element test } { myName } { foo } }
}
`);
        expect(await transform(rules, input)).toBe("test bar");
    });

    test("Import selected", async () => {
        const rules = parse(`
{ transform
    { import-js: ./tests/import.js myName }
    { match { element test } { myName } }
}
`);
        expect(await transform(rules, input)).toBe("test");
    });

    test("Import as", async () => {
        const rules = parse(`
{ transform
    { import-js: ./tests/import.js { as: my-name myName } \`{ foo } }
    { match { element test } { my-name } { foo } }
}
`);
        expect(await transform(rules, input)).toBe("test bar");
    });

});

test("Evaluate", () => {
    expect(evaluate.call({}, parse("{ I `23 }").root, { I: x => x })).toBe(23);
});
