import { describe, expect, test } from "bun:test";
import { parse } from "../parser.js";

describe("Document", () => {
    test("Root, text, document", () => {
        const text = `
# A test document
{ hello: world! }
`;
        const document = parse(text);
        expect(document.text).toBe(text);
        expect(document.root.document).toBe(document);
    });

    test("Empty document (error)", () => {
        expect(() => { parse(""); }).toThrow();
    });

    test("No content (error)", () => {
        expect(() => { parse(`# No content, just a comment.
And some text.
Which does not count.`); }).toThrow();
    });
});

describe("Element", () => {
    test("Name", () => {
        const { root } = parse("{ Hello,\\ world! }")
        expect(root.name).toBe("Hello, world!");
    });

    test("Anonymous", () => {
        const { root } = parse("{ { λ: x { + `x `1 } } `2 }");
        expect(root.name).toBe(undefined);
        expect(root.content[0].name).toBe("λ");
        expect(root.content[1]).toBe(2);
    });

    test("Unescaping", () => {
        const { root } = parse(`{ \\{\\ \\wow\\:\\ \\} }`);
        expect(root.name).toBe("{ wow: }");
    });
});

describe("Attributes", () => {
    test("Token and string attributes", () => {
        const { root } = parse(`{ p foo: bar baz: "fum, \\"quux\\", &c." x: y:z a\\:bc: d That’s it! }`);
        expect(root.attributes).toEqual({ foo: "bar", baz: `fum, "quux", &c.`, x: "y:z", "a:bc": "d" });
        expect(root.content).toEqual(["That’s it!"]);
    });

    test("Default attribute and more", () => {
        const { root } = parse("{ hello: world! foo: bar }");
        expect(root.attributes).toEqual({ hello: "world!", foo: "bar" });
        expect(root.content).toEqual([]);
    });

    test("Default attribute, spelled out", () => {
        const { root } = parse("{ hello foo: bar hello: world! }");
        expect(root.attributes).toEqual({ hello: "world!", foo: "bar" });
        expect(root.content).toEqual([]);
    });

    test("Not an attribute (escaped)", () => {
        const { root } = parse("{ p This\\: is not an attribute. That: not an attribute either. }");
        expect(root.attributes).toEqual({});
        expect(root.content).toEqual(["This: is not an attribute. That: not an attribute either."]);
    });

    test("Not an attribute (empty element)", () => {
        const { root } = parse("{ p {} This: is not an attribute. That: not an attribute either. }");
        expect(root.attributes).toEqual({});
        expect(root.content).toEqual(["This: is not an attribute. That: not an attribute either."]);
    });

    // FIXME 2L0M More attributes
    test.todo("Number", () => {
        const { root } = parse("{ constant e: `2.718281828459045 }");
        expect(root.attributes).toEqual({ e: 2.718281828459045 });
    });

    // FIXME 2L0M More attributes
    test.todo("List", () => {
        const { root } = parse("{ constants `{ 1 2 3 }");
        expect(root.attributes).toEqual({ constants: [1, 2, 3] });
    });
});

describe("Content", () => {
    test("Unescaping", () => {
        const { root } = parse("{ p Hello, \\{ \\`world\\# \\}\\ }");
        expect(root.content).toEqual(["Hello, { `world# } "]);
    });

    test("Whitespace handling", () => {
        const { root } = parse(`{ p This is a
            { em paragraph. }
        }`);
        expect(root.content).toHaveLength(3);
        expect(root.content[0]).toEqual("This is a");
        expect(root.content[1]).toEqual(" ");
        expect(root.content[2].content).toEqual(["paragraph."]);
    });

    test("Comments within content", () => {
        const { root } = parse(`{ p This is some content # not this
and \\# some more # but not this
this is more content }`);
        expect(root.content).toEqual(["This is some content", " and # some more", " this is more content"]);
    });

    test("Escaping spaces and newlines", () => {
        const { root } = parse(`{ p With trailing space\\ }`);
        expect(root.content).toEqual(["With trailing space "]);
    });

    test("Unquoting (number)", () => {
        const { root } = parse("{ define: π `3.141592653589793 (half of τ) }");
        expect(root.content).toEqual([3.141592653589793, " (half of τ)"]);
    });

    test("Unquoting (list)", () => {
        const { root } = parse("{ f `{ x 2 } }");
        expect(root.content).toEqual([["x", 2]]);
    });

    test("Mixed content (unquote)", () => {
        const { root } = parse("{ import { as: foo bar } `{ baz fum } }");
        expect(root.content.length).toBe(2);
        expect(root.content[0].name).toBe("as");
        expect(root.content[0].attributes[root.content[0].name]).toBe("foo");
        expect(root.content[0].content).toEqual(["bar"]);
        expect(root.content[1]).toEqual(["baz", "fum"]);
    });

    test("Mixed content (empty element)", () => {
        const { root } = parse("{ import { as: foo bar } baz {} fum }");
        expect(root.content.length).toBe(4);
        expect(root.content[0].name).toBe("as");
        expect(root.content[0].attributes[root.content[0].name]).toBe("foo");
        expect(root.content[0].content).toEqual(["bar"]);
        expect(root.content[1]).toEqual(" baz");
        expect(root.content[2]).toEqual(" ");
        expect(root.content[3]).toEqual(" fum");
    });

    // FIXME 2K05 Better Lisp evaluator
    test.todo("Unquoting (identifier)", () => {
        const { root } = parse("{ f `x }");
        expect(root.content).toHaveLength(1);
        const x = root.content[0];
        expect(x.name).toBe("unquote");
        expect(x.content).toEqual(["x"]);
    });

    describe("CDATA section", () => {

        test("In content (first)", () => {
            const { root } = parse("{ p {: { dodo } ::: hello :} }");
            expect(root.content).toEqual([" { dodo } ::: hello "]);
        });

        test("In content (after space)", () => {
            const { root } = parse("{ p CDATA\\: {: { dodo } ::: hello :} }");
            expect(root.content).toEqual(["CDATA:", "  { dodo } ::: hello "]);
        });

        test("Attribute value with CDATA", () => {
            const { root } = parse("{ p: {:{ value }:} }");
            expect(root.attributes.p).toBe("{ value }");
        });

        test("Unterminated", () => {
            expect(() => parse("{ p: {:{ value } } }")).toThrow();
        });

        test("Unexpected", () => {
            expect(() => parse("{ {: no CDATA section for name :} this: does not work }")).toThrow();
        });

    });

});
