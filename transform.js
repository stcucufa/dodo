// Matching

const isElementNamed = (name, item) => typeof item !== "string" && item.name === name;

const Patterns = {
    element: item => typeof item !== "string",
    text: item => typeof item === "string",
};

function matchPattern(pattern, item) {
    if (typeof pattern === "string") {
        return pattern === item;
    }
    return Patterns[pattern.name]?.(item) ?? false;
}

const Environment = {
    apply(items) {
        const path = this.path.concat([this.current]);
        for (const item of items) {
            this.queue.push([item, path]);
        }
    },

    content(element) {
        return (element ?? this.current).content;
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

const space = x => !(typeof x === "string" && x.trim() === "");

export function evaluate(expr, env) {
    if (!expr || typeof expr === "number" || typeof expr === "string" || Array.isArray(expr)) {
        return expr;
    }

    switch (expr.name) {
        case "λ": {
            // Anonymous function definition: { λ: x <body> } or { λ `{ x y z } <body> }
            const content = expr.content.filter(space);
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
            const [[f, ...args], body] = expr.content.filter(space);
            const value = lambda(args, body);
            env[f] = value;
            return value;
        }
        case "get":
            return env[expr.content[0]];
        case "if":
            const [p, t, e] = expr.content.filter(space);
            return evaluate.call(this, evaluate.call(this, p, env) ? t : e, env);
        default:
            // Apply
            const values = expr.content.filter(space).map(x => evaluate.call(this, x, env));
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

export function transform(rules, input) {
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
            for (const item of content.filter(space)) {
                context.output += (evaluate.call(context, item, Environment) ?? "");
            }
        }
    }

    console.log(context.output);
}
