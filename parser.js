function nop() {
}

const node = (document, tag) => ({ document, tag, attributes: {}, content: [] });

const DefaultAttributes = {
    article: "title",
    link: "href",
};

const Token = {
    Space: Symbol.for("Space"),
    Open: Symbol.for("Open"),
    Close: Symbol.for("Close"),
    Attribute: Symbol.for("Attribute"),
    Value: Symbol.for("Value"),
    String: Symbol.for("String"),
    Tick: Symbol.for("Tick"),
    Text: Symbol.for("Text"),
};

const State = {
    Begin: Symbol.for("Begin"),
    Empty: Symbol.for("Empty"),
    Attribute: Symbol.for("Attribute"),
    Tag: Symbol.for("Tag"),
    Content: Symbol.for("Content"),
    ContentWithSpace: Symbol.for("Content/space"),
    Unquote: Symbol.for("Unquote"),
    List: Symbol.for("List"),
    ClosedList: Symbol.for("List/closed"),
};

function attributeName(stack, value) {
    stack.attribute = value;
}

function setAttribute(stack, value) {
    const node = stack.at(-1);
    const attr = stack.attribute;
    delete stack.attribute;
    if (node.tag) {
        node.attributes[attr] = value;
    } else {
        node.tag = attr;
        node.attributes[DefaultAttributes[attr] ?? attr] = value;
    }
}

function newNode(stack) {
    stack.push(node(this.document));
};

function addChild(stack) {
    const child = stack.pop();
    stack.at(-1).content.push(child);
}

function addText(stack, value) {
    stack.at(-1).content.push(value);
}

function parseNumber(value) {
    const match = value.match(/^[+-]?\d+(\.\d+)?$/);
    if (match) {
        return parseFloat(value);
    }
}

function get(value) {
    const n = node(this.document, "get");
    n.content.push(value);
    return n;
}

const unescape = x => x.replace(/\\(.)/g, "$1");

const Parser = {

    transitions: new Map([
        [State.Begin, new Map([
            [Token.Space, [State.Begin, nop]],
            [Token.Open, [State.Empty, newNode]]
        ])],
        [State.Empty, new Map([
            [Token.Space, [State.Empty, nop]],
            [Token.Open, [State.Empty, newNode]],
            [Token.Close, [State.Content, stack => { stack.pop(); }]],
            [Token.Value, [State.Tag, (stack, tag) => { stack.at(-1).tag = tag }]],
            [Token.Attribute, [State.Attribute, attributeName]],
        ])],
        [State.Attribute, new Map([
            [Token.Space, [State.Attribute, nop]],
            [Token.String, [State.Tag, setAttribute]],
            [Token.Value, [State.Tag, setAttribute]],
        ])],
        [State.Tag, new Map([
            [Token.Space, [State.Tag, nop]],
            [Token.Open, [State.Empty, newNode]],
            [Token.Close, [State.Content, addChild]],
            [Token.Attribute, [State.Attribute, attributeName]],
            [Token.Tick, [State.Unquote, nop]],
            [Token.Text, [State.Content, addText]],
        ])],
        [State.Content, new Map([
            [Token.Space, [State.ContentWithSpace, nop]],
            [Token.Open, [State.Empty, newNode]],
            [Token.Close, [State.Content, addChild]],
            [Token.Tick, [State.Unquote, nop]],
            [Token.Text, [State.Content, addText]],
        ])],
        [State.ContentWithSpace, new Map([
            [Token.Space, [State.ContentWithSpace, nop]],
            [Token.Open, [State.Empty, function(stack) {
                stack.at(-1).content.push(" ");
                newNode.call(this, stack);
            }]],
            [Token.Close, [State.Content, addChild]],
            [Token.Tick, [State.Unquote, nop]],
            [Token.Text, [State.Content, (stack, value) => {
                addText(stack, stack.at(-1).content.length === 0 ? value : ` ${value}`);
            }]],
        ])],
        [State.Unquote, new Map([
            [Token.Open, [State.List, stack => { stack.push([]); }]],
            [Token.Value, [State.Content, function(stack, value) {
                stack.at(-1).content.push(parseNumber(value) ?? get.call(this, value));
            }]],
        ])],
        [State.List, new Map([
            [Token.Space, [State.List, nop]],
            [Token.Open, [State.List, stack => { stack.push([]); }]],
            [Token.Close, [State.Content, stack => {
                const list = stack.pop();
                const top = stack.at(-1);
                if (top.content) {
                    top.content.push(list);
                } else {
                    top.push(list);
                    return State.List;
                }
            }]],
            [Token.Value, [State.List, (stack, value) => {
                stack.at(-1).push(parseNumber(value) ?? value);
            }]],
        ])],
    ]),

    parse() {
        this.input = this.document.text;
        this.state = State.Begin;
        const stack = [{ content: [] }];
        for (const [token, value] of this.tokens()) {
            const transitions = this.transitions.get(this.state);
            if (!transitions.has(token)) {
                throw Error(`Parse error near\n${this.input}`);
            }
            const [q, f] = transitions.get(token);
            this.state = f.call(this, stack, value) ?? q;
        }
        console.assert(stack.length === 1);
        console.assert(stack[0].content.length === 1);
        return stack[0].content[0];
    },

    *tokens() {
        while (this.input.length > 0) {
            const match = this.input.match(/^\s+/);
            if (match) {
                this.input = this.input.substring(match[0].length);
                yield [Token.Space, match[0]];
                continue;
            }
            switch (this.input[0]) {
                case "#":
                    this.input = this.input.replace(/.*\n/, "");
                    break;
                case "{":
                    this.input = this.input.substring(1);
                    yield [Token.Open];
                    break;
                case "}":
                    this.input = this.input.substring(1);
                    yield [Token.Close];
                    break;
                default:
                    const transitions = this.transitions.get(this.state);
                    if (transitions.has(Token.Tick)) {
                        const match = this.input.match(/^\u0060\S/);  // backtick
                        if (match) {
                            this.input = this.input.substring(1);
                            yield [Token.Tick];
                            break;
                        }
                    }
                    if (transitions.has(Token.String)) {
                        const match = this.input.match(/^"((?:[^"\\]|\\.)*)"/);
                        if (match) {
                            this.input = this.input.substring(match[0].length);
                            yield [Token.String, unescape(match[1])];
                            break;
                        }
                    }
                    if (transitions.has(Token.Attribute)) {
                        const match = this.input.match(/^((?:[^\s\{\}#\u0060:\\]|\\.)+):/);
                        if (match) {
                            this.input = this.input.substring(match[0].length);
                            yield [Token.Attribute, unescape(match[1])];
                            break;
                        }
                    }
                    if (this.transitions.get(this.state).has(Token.Value)) {
                        const match = this.input.match(/^((?:[^\s\{\}#\u0060\\]|\\.)+)/);
                        if (match) {
                            this.input = this.input.substring(match[0].length);
                            yield [Token.Value, unescape(match[1])];
                            break;
                        } else {
                            throw Error(`Parse error: expected value near\n${this.input}`);
                        }
                    } else {
                        const match = this.input.match(
                            /^([^\\\s\{\}#\u0060]|\\.)+(\s+([^\\\s\{\}\u0060]|\\.)+)*/
                        );
                        if (match) {
                            this.input = this.input.substring(match[0].length);
                            yield [Token.Text, unescape(match[0])];
                            break;
                        } else {
                            throw Error(`Parse error: expected text near\n${this.input}`);
                        }
                    }
            }
        }
    }
};

export function parse(text) {
    const document = { text };
    const parser = Object.assign(Object.create(Parser), { document });
    document.root = parser.parse();
    return document;
}
