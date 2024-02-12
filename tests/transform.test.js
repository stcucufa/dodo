import { expect, test } from "bun:test";
import { parse } from "../parser.js";
import { transform, evaluate } from "../transform.js";

test("To text", () => {
    const rules = parse(`{ transform
        { match { element } { if { empty? } { name-of } { apply { content-of } } } }
        { match { text } { normalize-space { value-of } } }
    }`);
    const input = parse(`{ p { em Hello }, { world }! }`);
    expect(transform(rules, input)).toBe("Hello, world!");
});

test("Evaluate", () => {
    // TODO 2K05 Lisp/custom parens
    expect(evaluate.call({}, parse("{ I `23 }").root, { I: x => x })).toBe(23);
});
