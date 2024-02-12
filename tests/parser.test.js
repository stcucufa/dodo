import { describe, expect, test } from "bun:test";
import { parse } from "../parser.js";

test("Document", () => {
    const text = `{ hello: world! }`;
    const document = parse(text);
    expect(document.text).toBe(text);
    expect(document.root.document).toBe(document);
});

describe("Element", () => {
    test("Name", () => {
        const { root } = parse("{ Hello,\\ world! }")
        expect(root.name).toBe("Hello, world!");
    });

    test("Empty", () => {
        const { root } = parse("{ { λ: x { + `x `1 } } `2 }");
        expect(root.name).toBe(undefined);
        expect(root.content[0].name).toBe("λ");
        expect(root.content[1]).toBe(2);
    });
});

describe("Attributes", () => {
    test("Token and string attributes", () => {
        const { root } = parse(`{ p foo: bar baz: "fum, quux, &c." x: y:z a\\:bc: d That’s it! }`);
        expect(root.attributes).toEqual({ foo: "bar", baz: "fum, quux, &c.", x: "y:z", "a:bc": "d" });
        expect(root.content).toEqual(["That’s it!"]);
    });

    test("Default attribute and more", () => {
        const { root } = parse("{ hello: world! foo: bar }");
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

    test.todo("Number", () => {
        const { root } = parse("{ constant e: `2.718281828459045 }");
        expect(root.attributes).toEqual({ e: 2.718281828459045 });
    });

    test.todo("List", () => {
        const { root } = parse("{ constants `{ 1 2 3 }");
        expect(root.attributes).toEqual({ constants: [1, 2, 3] });
    });
});

describe("Content", () => {
    test("Whitespace handling", () => {
        const { root } = parse(`{ p This is a
            { em paragraph. }
        }`);
        expect(root.content.length).toBe(3);
        expect(root.content[0]).toEqual("This is a");
        expect(root.content[1]).toEqual(" ");
        expect(root.content[2].content).toEqual(["paragraph."]);
    });

    test("Unquoting (number)", () => {
        const { root } = parse("{ define: π `3.141592653589793 (half of τ) }");
        expect(root.content).toEqual([3.141592653589793, " (half of τ)"]);
    });

    test("Unquoting (list)", () => {
        // TODO
    });

    test("Unquoting (identifier)", () => {
        // TODO
    });
});
