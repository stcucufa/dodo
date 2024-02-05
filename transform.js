export function transform(input, rules) {
    if (rules.root.name !== "transform") {
        throw Error(`Expected a transform document, got "${rules.root.name}" instead.`);
    }
    const matches = rules.root.content.filter(
        element => typeof element !== "string" && element.name === "match"
    );
}

function match(element, context) {
    const [path, ...content] = element.content;
}
