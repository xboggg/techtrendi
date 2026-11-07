"""HTML to plain text and short summaries, standard library only."""
from __future__ import annotations

import html
import re
from html.parser import HTMLParser

_BLOCK = {"p", "br", "div", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "section"}


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._skip += 1
        elif tag in _BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._skip:
            self._skip -= 1
        elif tag in _BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def html_to_text(value: str | None) -> str:
    if not value:
        return ""
    if "<" not in value:
        return clean(html.unescape(value))
    p = _Text()
    p.feed(value)
    p.close()
    return clean("".join(p.parts))


def clean(value: str | None) -> str:
    if not value:
        return ""
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r"\n\s*\n+", "\n", value)
    return value.strip()


def one_line(value: str | None, limit: int) -> str | None:
    """Collapse to one line and cut at a word boundary; None when empty."""
    if not value:
        return None
    value = re.sub(r"\s+", " ", value).strip()
    if not value:
        return None
    if len(value) <= limit:
        return value
    cut = value[: limit - 1]
    if " " in cut[limit // 2:]:
        cut = cut[: cut.rfind(" ")]
    return cut.rstrip(" ,.;:-") + "…"


def summarise(text: str | None, limit: int = 280) -> str | None:
    return one_line(text, limit)
