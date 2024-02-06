const isObject = item => typeof item === "object" && !Array.isArray(item) && item !== null;
const isElement = item => isObject(item) && typeof item.name === "string";
const isElementNamed = (name, item) => isObject(item) && item.name === name;

const Patterns = {
    element: isElement,
    text: item => typeof item === "string",
};

function matchPattern(pattern, item) {
    if (isElement(pattern)) {
        return Patterns[pattern.name]?.(item) ?? false;
    }
    return pattern === item;
}

const Environment = {
    apply(items) {
        const path = this.path.concat([this.current]);
        Array.prototype.unshift.apply(this.queue, items.map(item => ([item, path])));
    },

    "content-of": function(element) {
        return (element ?? this.current).content;
    },

    "empty?": function(element) {
        return (element ?? this.current).content.length === 0;
    },

    "name-of": function(element) {
        return (element ?? this.current).name;
    },

    "normalize-space": function(text) {
        return text.replace(/\s+/g, " ");
    },

    "value-of": function(item) {
        return item ?? this.current;
    }
};

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
        case "get":
            return env[expr.content[0]];
        case "if":
            const [p, t, e] = expr.content.filter(unspace);
            return evaluate.call(this, evaluate.call(this, p, env) ? t : e, env);
        default:
            // Apply
            const values = expr.content.filter(unspace).map(x => evaluate.call(this, x, env));
            const f = expr.name ? env[expr.name] : values.shift();
            return f.apply(Object.assign(Object.create(this), env), values);
    }
}

function tag(item) {
    if (typeof item === "string") {
        return `"${item.replace(/"/g, "\\\"")}"`;
    }
    return item.name;
}

export function transform(rules, input, trace = false) {
    if (rules.root.name !== "transform") {
        throw Error(`Expected a transform document, got "${rules.root.name}" instead.`);
    }
    const matches = rules.root.content.filter(x => isElementNamed("match", x)).map(
        element => {
        const [path, ...content] = element.content;
        return [path, content];
    });

    const context = {
        queue: [[input.root, []]],
        output: "",
    };

    while (context.queue.length > 0) {
        const [current, path] = context.queue.shift();
        const match = matches.find(([pattern]) => matchPattern(pattern, current));
        if (match) {
            context.current = current;
            context.path = path;
            const [pattern, content] = match;
            if (trace) {
                console.info(
                    `=== Match! ${tag(current)} [${path.map(tag).join(" :: ")}] matches ${tag(pattern)}`
                );
            }
            for (const item of content.filter(unspace)) {
                context.output += (evaluate.call(context, item, Environment) ?? "");
            }
        }
    }

    return context.output;
}
