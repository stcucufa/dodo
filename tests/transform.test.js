import { expect, test } from "bun:test";
import { parse } from "../parser.js";
import { transform, evaluate } from "../transform.js";

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

test("Evaluate", () => {
    expect(evaluate.call({}, parse("{ I `23 }").root, { I: x => x })).toBe(23);
});
