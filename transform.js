import { date, timestamp } from "./date.js";
import { existsSync } from 'node:fs';

const Environment = {
};

const isObject = item => typeof item === "object" && !Array.isArray(item) && item !== null;
const isAttribute = item => Array.isArray(item) && item.length > 0;
const isElement = item => isObject(item) && typeof item.name === "string";
const isElementNamed = (name, item) => isObject(item) && item.name === name;
const isEmpty = item => isElement(item) ? item.content.length === 0 : item.length === 0;

const Patterns = {
    attribute: (item, pattern) => isAttribute(item) && (
        isEmpty(pattern) || item[0] === evaluate(pattern.content[0], Environment)
    ),

    element: (item, pattern) => isElement(item) && (
        isEmpty(pattern) || item.name === evaluate(pattern.content[0], Environment)
    ),

    text: item => typeof item === "string",

    number: item => typeof item === "number",
};

function matchPattern(pattern, item) {
    if (isElement(pattern)) {
        return Patterns[pattern.name]?.(item, pattern) ?? false;
    }
    return pattern === item;
}

const OutputEnvironment = Object.assign(Object.create(Environment), {
    attribute(name, element) {
        return (element ?? this.item).attributes[name];
    },

    apply(items) {
        const path = this.path.concat([this.item]);
        const context = Object.create(this);
        return items.map(item => context.applyTransform(Object.assign(context, { item, path }))).join("");
    },

    "attributes-of": function (element) {
        return [...Object.entries((element ?? this.item).attributes)];
    },

    "content-of": function(element) {
        return (element ?? this.item).content;
    },

    date,

    document: function() {
        return this.item.document;
    },

    "empty?": function(item) {
        return isEmpty(item ?? this.item);
    },

    "escape-html": t => (t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    "escape-string": t => (t ?? "").replace(/\u0022/g, "&#22;"),

    "name-of": function(item) {
        const it = item ?? this.item;
        return isAttribute(it) ? it[0] : it.name;
    },

    "normalize-space": text => text.replace(/\s+/g, " "),

    "property-of": (object, property) => object[property],

    "resolve-xref": function(item) {
        const element = item ?? this.item;
        const xref = element.attributes.xref;
        const path = element.document.path.replace(/\/\w+\.dodo$/, `/${xref}.dodo`);
        return existsSync(path) ? `${xref}.html` : "#";
    },

    space: () => " ",

    timestamp,

    "value-of": function(item) {
        const it = item ?? this.item;
        return isAttribute(it) ? it[1] : it;
    }
});

function lambda(args, body) {
    return function(...values) {
        const env = Object.create(this.env);
        args.forEach((arg, i) => { env[arg] = values[i]; });
        return evaluate.call(this, body, env);
    };
}

const unspace = x => typeof x !== "string" || /\S/.test(x);

export function evaluate(expr, env) {
    if (!isElement(expr)) {
        return expr;
    }

    switch (expr.name) {
        case "λ": {
            // Anonymous function definition: { λ: x <body> } or { λ `{ x y z } <body> }
            const content = expr.content.filter(unspace);
            const args = "λ" in expr.attributes ? [expr.attributes["λ"]] : expr.shift();
            return lambda(args, content[0]);
        }
        case "define": {
            if (expr.attributes.define) {
                // Single definition: { define: <name> <value> }
                const value = evaluate.call(this, expr.content[0], env);
                env[expr.attributes.define] = value;
                return value;
            }
            // Function definition: { define { f x y z } <body> }
            const [[f, ...args], body] = expr.content.filter(unspace);
            const value = lambda(args, body);
            env[f] = value;
            return value;
        }
        case "unquote":
            return env[expr.content[0]];
        case "if":
            const [p, t, e] = expr.content.filter(unspace);
            return evaluate.call(this, evaluate.call(this, p, env) ? t : e, env);
        case "or":
            for (const x of expr.content) {
                if (unspace(x)) {
                    const v = evaluate.call(this, x, env);
                    if (v) {
                        return v;
                    }
                }
            }
            break;
        default:
            // Apply
            const values = expr.content.filter(unspace).map(x => evaluate.call(this, x, env));
            const f = expr.name ? env[expr.name] : values.shift();
            if (!f) {
                throw Error(`Nothing to apply (${expr.name})`);
            }
            return f.apply(Object.assign(Object.create(this), env), values);
    }
}

function tag(item) {
    if (typeof item === "string") {
        return `"${item.replace(/"/g, "\\\"")}"`;
    }
    if (Array.isArray(item)) {
        return `${item[0]}="${item[1].replace(/"/g, "\\\"")}"`;
    }
    return item.name;
}

export function transform(rules, input, trace = false) {
    if (rules.root.name !== "transform") {
        throw Error(`Expected a transform document, got "${rules.root.name}" instead.`);
    }

    const matches = rules.root.content.filter(x => isElementNamed("match", x)).map(element => {
        const [path, ...content] = element.content;
        return [path, content];
    });

    function applyTransform(context) {
        const { item, path } = context;
        const match = matches.find(([pattern]) => matchPattern(pattern, item));
        if (!match) {
            return "";
        }
        const [pattern, content] = match;
        if (trace) {
            console.info(
                `=== Match! ${tag(item)} [${path.map(tag).join(" :: ")}] matches ${tag(pattern)}`
            );
        }
        return content.reduce((content, item, i, items) => {
            if (typeof item === "string") {
                if (i === 0) {
                    item = item.replace(/^\s+/, "");
                }
                if (i == items.length - 1) {
                    item = item.replace(/\s+$/, "");
                }
                if (typeof content.at(-1) === "string") {
                    content.push(content.pop() + item);
                    return content;
                }
            }
            content.push(item);
            return content;
        }, []).map(item => evaluate.call(context, item, OutputEnvironment) ?? "").join("");
    }

    return applyTransform({ item: input.root, path: [], applyTransform });
}
