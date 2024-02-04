Dodo 🦤 is a lightweight markup language that I created because I can never remember how to make [links in
Markdown](https://daringfireball.net/projects/markdown/syntax#link), and HTML is too heavy to author by
hand. It looks like a stripped-down XML and is easy to parse, with the goal to also make it easy to
extend and transform into other output formats (like HTML but also _e.g._, plain text or LaTeX) using an
XSLT-like language (which should use the Dodo syntax, of course; this is future work). This is only a fun
experiment and should remain so in the foreseeable future; it is _not_ claiming to be of any use to anyone,
anywhere, ever.

A Dodo document looks like this:

```
{ article title: "The Dodo 🦤 markup language" lang: en

    # Comments start with a # and run to the end of the line. Special
    # characters like #, {, }, and : can be escaped with \ so that they are
    # treated like regular content.

    { p Dodo 🦤 is a lightweight markup language that I created
    because I can never remember how to make { link:
    https://daringfireball.net/projects/markdown/syntax\#link links in
    Markdown }, and HTML is too heavy to author by hand. It looks like
    a stripped-down XML and is easy to parse, with the goal to also
    make it easy to extend and transform into other output formats
    (like HTML but also { eg } plain text or { latex }) using an
    XSLT-like language (which should use the Dodo syntax, of course;
    this is future work). This is mostly a fun experiment and should
    remain so in the foreseeable future; it is { em not } claiming to
    be of any use to anyone, anywhere, ever. }

    { p A Dodo document looks like this: }

    { figure
        { pre

\{ article title: "The Dodo 🦤 markup language"

    \# Comments start with a \# and run to the end of the line. Special
    \# characters like \#, \{, \} and \: can be escaped with \\ so that they
    \# are treated like regular content.

    \{ p Dodo 🦤 is a lightweight markup language that I created
    because I can never remember how to make \{ link:
    https://daringfireball.net/projects/markdown/syntax\#link links in
    Markdown \}, and HTML is too heavy to author by hand. It looks like
    a stripped-down XML and is easy to parse, with the goal to also
    make it easy to extend and transform into other output formats
    (like HTML but also \{ eg \} plain text or \{ latex \}) using an
    XSLT-like language (which should use the Dodo syntax, of course;
    this is future work). This is mostly a fun experiment and should
    remain so in the foreseeable future; it is \{ em not \} claiming to
    be of any use to anyone, anywhere, ever. \}

    \{ p A Dodo document looks like this: \}

    \# (...)

\}

        }
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
name as the element itself, if the name of the element is followed by a colon (like `{ link: href://... }`).

The content of the element starts at the first non-whitespace character that is not a name or an attribute
value, and ends at the last non-whitespace character before the closing brace of the element. Anything
other than a brace is treated like a regular character within the content of the element, and special
characters may be escaped by a backslash to be treated like a regular character. Comments may appear
anywhere; they start with a pound sign and run to the end of the line.
