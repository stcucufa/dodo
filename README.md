# The Dodo 🦤 markup language

Dodo 🦤 is a lightweight markup language that I created because I can never remember how to make [links in
Markdown](https://daringfireball.net/projects/markdown/syntax#link), and HTML is too heavy to author by
hand. It looks like a stripped-down XML and is easy to parse, with the goal to also make it easy to
extend and transform into other output formats (such as HTML but also _e.g._, plain text or LaTeX) with
an XSLT-like language (using the Dodo syntax, of course). **This is only a fun experiment with no claim of
being of any use to anyone, anywhere, ever.**

A Dodo document looks like this:

```
{ article: "The Dodo 🦤 markup language" lang: en

    # Comments start with a # and run to the end of the line. Special
    # characters like #, {, }, and : can be escaped with \ so that they are
    # treated like regular content.

    { p Dodo 🦤 is a lightweight markup language that I created
    because I can never remember how to make { link:
    https://daringfireball.net/projects/markdown/syntax\#link links in
    Markdown }, and HTML is too heavy to author by hand. It looks like
    a stripped-down XML and is easy to parse, with the goal to also
    make it easy to extend and transform into other output formats
    (such as HTML but also { eg } plain text or { latex }) with an
    XSLT-like language (using the Dodo syntax, of course). { strong
    This is only a fun experiment with no claim of being of any use to
    anyone, anywhere, ever.} }

    { p A Dodo document looks like this: }

    { figure

        # Dodo also has CDATA (character data) sections, like XML,
        # delimited by {: and :} where characters all characters are
        # interpreted as normal data, which is convenient to show Dodo
        # markup inside Dodo markup.

        { pre {:

{ article: "The Dodo 🦤 markup language" lang: en

    # Comments start with a # and run to the end of the line. Special
    # characters like #, {, }, and : can be escaped with \ so that they are
    # treated like regular content.

    { p Dodo 🦤 is a lightweight markup language that I created
    because I can never remember how to make { link:
    https://daringfireball.net/projects/markdown/syntax\#link links in
    Markdown }, and HTML is too heavy to author by hand. It looks like
    a stripped-down XML and is easy to parse, with the goal to also
    make it easy to extend and transform into other output formats
    (such as HTML but also { eg } plain text or { latex }) with an
    XSLT-like language (using the Dodo syntax, of course). { strong
    This is only a fun experiment with no claim of being of any use to
    anyone, anywhere, ever.} }

    { p A Dodo document looks like this: }

    # (...)

        :} }
        { figcaption A sample Dodo document }
    }

    # (...)

}
```

A Dodo document consists of a tree of elements. Elements are delimited by a pair of matching braces
`{ ... }`. Each element has a name, which is the first non-whitespace string of characters in the element
(like `article`, `p`, `link` and `pre` in this sample), zero or more attributes (which are `name: value`
pairs), and content, which can be text or more elements.

Attributes are introduced by a colon, and may have an unquoted value (the first non-whitespace string of
characters that follows, like in `lang: en`) or a quoted value, that may contain any string of characters
(like in `title: "The Dodo 🦤 markup language"`). Elements may have a _default_ attribute, with the same
name as the element itself, if the name of the element is followed by a colon (like
`{ link: https://... }`).

The content of the element starts at the first non-whitespace character that is not a name or an attribute
value, and ends at the last non-whitespace character before the closing brace of the element. Anything
other than a brace is treated like a regular character within the content of the element, and special
characters may be escaped by a backslash to be treated like a regular character. Character data (CDATA)
sections can also be used where content or attribute values appear to prevent any character from being
interpreted by the parser; these are delimited by `{:` and `:}` and cannot be nested. Comments may appear
anywhere outside of strings; they start with a pound sign and run to the end of the line.

## Transforming Dodo documents

Dodo has a syntax but no semantics. The point is for the markup to be extensible, and make it easy to
_transform_ it into other output formats. For instance, a custom “article” format for page-length blog
posts defines elements such as `article`, `p`, `link`, and so on; this is then transformed to HTML by
mapping these custom elements with HTML . Transforming the root `article` element outputs a whole HTML
tree with common header, footer, and so on; `p` maps directly to an HTML `p` element; `link` (with its
default attribute) is translated to `a` with an `href` attribute; text produces text with the right HTML
escapes (for ampersand and angle brackets).

A JS parser and transformer for Dodo documents is provided and runs on the command line with
[Bun](https://bun.sh). There are no dependencies, so just run `bun run dodo.js transform.dodo input.dodo`
to apply the transform to the input document, or specify only one argument to check whether that is a
syntactically correct Dodo file (see transform examples in the [transform](transform) directory). There is
a test suite which runs with `bun test`, and also a simple [HTML test page](tests/dodo.html).
