"""Share pictures (Open Graph, 1200x630) for every tool page, style A "Night Glow".

Chosen by Edmund on 28 Nov 2026 from three samples (docs/og-designs/tool-styles/).
Each tool gets its own headline and its own little scene (payslip, chat, gauge, chart,
code, ...) from scripts/og-tools/tools.json. Output: public/og/tools/<id>.jpg (+ a list
in src/data/toolOgImages.ts that SEOHead uses).

    python scripts/og-tools/render.py            # all tools
    python scripts/og-tools/render.py qr-generator ghana-tax-calculator   # just these

House rule: no f-strings for HTML/CSS; templates use @@NAME@@ placeholders.
Needs: pip install playwright qrcode ; Chrome installed (channel="chrome").
"""
import html, json, os, re, sys
import qrcode
import qrcode.image.svg
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tools.json")
OUT = os.path.join(ROOT, "public", "og", "tools")
LIST_TS = os.path.join(ROOT, "src", "data", "toolOgImages.ts")

TW = {  # tailwind 400/500/600 colours used by the tool gradients
    "red": ("#f87171", "#ef4444", "#dc2626"), "orange": ("#fb923c", "#f97316", "#ea580c"),
    "amber": ("#fbbf24", "#f59e0b", "#d97706"), "yellow": ("#facc15", "#eab308", "#ca8a04"),
    "lime": ("#a3e635", "#84cc16", "#65a30d"), "green": ("#4ade80", "#22c55e", "#16a34a"),
    "emerald": ("#34d399", "#10b981", "#059669"), "teal": ("#2dd4bf", "#14b8a6", "#0d9488"),
    "cyan": ("#22d3ee", "#06b6d4", "#0891b2"), "sky": ("#38bdf8", "#0ea5e9", "#0284c7"),
    "blue": ("#60a5fa", "#3b82f6", "#2563eb"), "indigo": ("#818cf8", "#6366f1", "#4f46e5"),
    "violet": ("#a78bfa", "#8b5cf6", "#7c3aed"), "purple": ("#c084fc", "#a855f7", "#9333ea"),
    "fuchsia": ("#e879f9", "#d946ef", "#c026d3"), "pink": ("#f472b6", "#ec4899", "#db2777"),
    "rose": ("#fb7185", "#f43f5e", "#e11d48"), "slate": ("#94a3b8", "#64748b", "#475569"),
    "zinc": ("#a1a1aa", "#71717a", "#52525b"),
}


def colours(gradient):
    names = re.findall(r"(?:from|to)-([a-z]+)-(\d00)", gradient or "")
    pick = []
    for n, shade in names:
        t = TW.get(n, TW["blue"])
        pick.append(t[0] if shade == "400" else t[1] if shade == "500" else t[2])
    if len(pick) < 2:
        pick = (pick + [TW["cyan"][0], TW["blue"][1]])[:2]
    a1, a2 = pick[0], pick[1]
    if names and names[0][0] in ("slate", "zinc"):  # grey tools get a cyan glow so they don't look dull
        a2 = TW["cyan"][0]
    return a1, a2


def esc(s):
    return html.escape(str(s), quote=False)


def qr_svg(data):
    img = qrcode.make(data, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=0)
    s = img.to_string().decode("utf-8")
    return s[s.index("<svg"):]


# ------------------------------------------------------------------ scenes
def scene_rows(d):
    rows = "".join(
        '<div class="row' + (" neg" if len(r) > 2 and r[2] else "") + '"><span>' + esc(r[0]) + "</span><b>" + esc(r[1]) + "</b></div>"
        for r in d.get("rows", []))
    total = ""
    if d.get("total"):
        total = '<div class="line"></div><div class="row big"><span>' + esc(d["total"][0]) + "</span><b>" + esc(d["total"][1]) + "</b></div>"
    bar = ""
    if d.get("bar") is not None:
        bar = '<div class="bar"><i style="width:' + str(int(d["bar"])) + '%"></i></div>'
    foot = '<div class="muted small">' + esc(d["foot"]) + "</div>" if d.get("foot") else ""
    return ('<div class="card slip"><div class="slip-h"><span>' + esc(d.get("title", "")) + '</span><span class="muted">'
            + esc(d.get("tag", "")) + "</span></div>" + rows + total + bar + foot + "</div>")


def scene_chat(d):
    stamp = '<div class="stamp" style="--sc:' + d.get("stamp_colour", "#ef4444") + '">' + esc(d["stamp"]) + "</div>" if d.get("stamp") else ""
    good = d.get("good")
    verdict = ('<div class="verdict ' + ("ok" if good else "bad") + '"><span class="dot"></span>' + esc(d["verdict"]) + "</div>") if d.get("verdict") else ""
    msgs = "".join('<div class="bubble' + (" me" if m.startswith(">") else "") + '">' + esc(m.lstrip(">")) + "</div>"
                   for m in (d["msgs"] if "msgs" in d else [d["msg"]]))
    return ('<div class="phone"><div class="notch"></div><div class="chat-h"><div class="av">' + esc(d.get("av", "?"))
            + "</div><div><b>" + esc(d.get("from", "")) + '</b><div class="muted small">' + esc(d.get("sub", "now"))
            + "</div></div></div>" + msgs + stamp + verdict + "</div>")


def scene_qr(d):
    chips = "".join("<span>" + esc(c) + "</span>" for c in d.get("chips", []))
    return ('<div class="card qrcard"><div class="qrbox">' + qr_svg(d["data"]) + '</div><div class="qrlabel">'
            + esc(d.get("label", "Scan me")) + '</div><div class="chips">' + chips + "</div></div>")


def scene_gauge(d):
    pct = max(0, min(100, float(d.get("pct", 70))))
    dash = 471.24 * pct / 100
    rows = "".join('<div class="kv"><span>' + esc(a) + "</span><b>" + esc(b) + "</b></div>" for a, b in d.get("rows", []))
    return ('<div class="card gauge"><svg viewBox="0 0 200 120" class="arc"><path d="M20 110 A80 80 0 0 1 180 110" class="track"/>'
            '<path d="M20 110 A80 80 0 0 1 180 110" class="val" style="stroke-dasharray:' + str(round(dash / 1.885, 1)) + ' 400"/></svg>'
            '<div class="gnum">' + esc(d["value"]) + '<small>' + esc(d.get("unit", "")) + '</small></div><div class="glabel">'
            + esc(d.get("label", "")) + "</div>" + rows + "</div>")


def scene_bars(d):
    bars = d.get("bars", [])
    mx = max([float(v) for _, v in bars] or [1]) or 1
    cols = "".join('<div class="col"><i style="height:' + str(int(8 + 92 * float(v) / mx)) + '%"></i><span>' + esc(l) + "</span></div>"
                   for l, v in bars)
    head = '<div class="slip-h"><span>' + esc(d.get("title", "")) + '</span><span class="muted">' + esc(d.get("tag", "")) + "</span></div>"
    big = '<div class="bignum">' + esc(d["big"]) + "</div>" if d.get("big") else ""
    return '<div class="card barsc">' + head + big + '<div class="cols">' + cols + "</div></div>"


def scene_line(d):
    pts = [float(x) for x in d.get("points", [1, 2, 3, 5, 8])]
    lo, hi = min(pts), max(pts)
    w, h = 380, 170
    coords = [(i * w / (len(pts) - 1), h - (p - lo) / ((hi - lo) or 1) * (h - 10) - 5) for i, p in enumerate(pts)]
    path = "M" + " L".join(str(round(x, 1)) + " " + str(round(y, 1)) for x, y in coords)
    area = path + " L" + str(w) + " " + str(h) + " L0 " + str(h) + " Z"
    head = '<div class="slip-h"><span>' + esc(d.get("title", "")) + '</span><span class="muted">' + esc(d.get("tag", "")) + "</span></div>"
    big = '<div class="bignum">' + esc(d.get("big", "")) + '</div><div class="muted small">' + esc(d.get("caption", "")) + "</div>"
    return ('<div class="card linec">' + head + big + '<svg viewBox="0 0 380 170" class="lsvg"><path d="' + area + '" class="area"/>'
            '<path d="' + path + '" class="ln"/></svg></div>')


def scene_checklist(d):
    items = "".join('<div class="ck ' + ("done" if done else "") + '"><span class="box">' + ("&#10003;" if done else "")
                    + "</span>" + esc(t) + "</div>" for t, done in d.get("items", []))
    head = '<div class="slip-h"><span>' + esc(d.get("title", "")) + '</span><span class="muted">' + esc(d.get("tag", "")) + "</span></div>"
    return '<div class="card checklist">' + head + items + "</div>"


CODE_CLASSES = [(r"^(\s*)(//.*)$", r'\1<i class="c-cm">\2</i>')]


def scene_code(d):
    lines = []
    for ln in d.get("lines", []):
        e = esc(ln)
        e = re.sub(r"(&quot;|\")([^\"]*?)(\"|&quot;)", r'<i class="c-s">"\2"</i>', e)
        e = re.sub(r"\b(\d+)\b", r'<i class="c-n">\1</i>', e)
        e = re.sub(r"^(\s*)(#.*|//.*)$", r'\1<i class="c-cm">\2</i>', e)
        lines.append('<div class="cl">' + (e or "&nbsp;") + "</div>")
    out = '<div class="out">' + esc(d["out"]) + "</div>" if d.get("out") else ""
    return ('<div class="card codec"><div class="dots3"><i></i><i></i><i></i><span>' + esc(d.get("file", ""))
            + "</span></div>" + "".join(lines) + out + "</div>")


def scene_doc(d):
    lines = "".join('<div class="dl' + (" h" if l.startswith("#") else "") + '">' + esc(l.lstrip("# ")) + "</div>" for l in d.get("lines", []))
    sign = '<div class="sign"><span>' + esc(d["sign"]) + "</span></div>" if d.get("sign") else ""
    badge = '<div class="dbadge">' + esc(d["badge"]) + "</div>" if d.get("badge") else ""
    return '<div class="card doc"><div class="dtitle">' + esc(d.get("title", "")) + "</div>" + lines + sign + badge + "</div>"


def scene_chips(d):
    chips = "".join('<span class="' + ("hot" if i == 0 else "") + '">' + esc(c) + "</span>" for i, c in enumerate(d.get("chips", [])))
    head = '<div class="slip-h"><span>' + esc(d.get("title", "")) + '</span><span class="muted">' + esc(d.get("tag", "")) + "</span></div>"
    return '<div class="card chipsc">' + head + '<div class="cwrap">' + chips + "</div></div>"


def scene_timer(d):
    pct = float(d.get("pct", 65))
    dash = round(691.15 * pct / 100, 1)
    return ('<div class="card timer"><svg viewBox="0 0 240 240" class="ring"><circle cx="120" cy="120" r="110" class="track"/>'
            '<circle cx="120" cy="120" r="110" class="val" style="stroke-dasharray:' + str(dash) + ' 700"/></svg>'
            '<div class="tnum">' + esc(d["time"]) + '</div><div class="tlabel">' + esc(d.get("label", "")) + "</div></div>")


def scene_compare(d):
    def side(s, cls):
        rows = "".join('<div class="kv"><span>' + esc(a) + "</span><b>" + esc(b) + "</b></div>" for a, b in s.get("rows", []))
        return '<div class="cmp ' + cls + '"><div class="cname">' + esc(s["name"]) + "</div>" + rows + "</div>"
    vs = '<div class="vs">' + esc(d.get("vs", "VS")) + "</div>"
    return '<div class="cmpwrap">' + side(d["left"], "l") + vs + side(d["right"], "r") + "</div>"


def scene_big(d):
    rows = "".join('<div class="kv"><span>' + esc(a) + "</span><b>" + esc(b) + "</b></div>" for a, b in d.get("rows", []))
    return ('<div class="card bigc"><div class="blabel">' + esc(d.get("label", "")) + '</div><div class="bval">' + esc(d["value"])
            + '</div><div class="muted small">' + esc(d.get("caption", "")) + "</div>" + rows + "</div>")


def scene_swatches(d):
    sw = "".join('<div class="sw"><i style="background:' + c + '"></i><span>' + esc(c.upper()) + "</span></div>" for c in d.get("colors", []))
    grad = ""
    if d.get("gradient"):
        grad = '<div class="gradbar" style="background:linear-gradient(90deg,' + ",".join(d["colors"]) + ')"></div>'
    return '<div class="card swc"><div class="slip-h"><span>' + esc(d.get("title", "")) + "</span></div>" + grad + '<div class="sws">' + sw + "</div></div>"


def scene_quiz(d):
    opts = ""
    for i, o in enumerate(d.get("options", [])):
        cls = "right" if i == d.get("answer") else ("wrong" if i == d.get("picked") else "")
        opts += '<div class="opt ' + cls + '"><span class="ol">' + "ABCD"[i] + "</span>" + esc(o) + "</div>"
    head = '<div class="slip-h"><span>' + esc(d.get("title", "")) + '</span><span class="muted">' + esc(d.get("tag", "")) + "</span></div>"
    return '<div class="card quiz">' + head + '<div class="qq">' + esc(d["q"]) + "</div>" + opts + "</div>"


def scene_image(d):
    a = '<div class="imgbox"><div class="ph" style="--h:' + d.get("hue", "200") + '"></div><div class="tag2">' + esc(d.get("before", "")) + "</div></div>"
    b = '<div class="imgbox"><div class="ph" style="--h:' + d.get("hue", "200") + '"></div><div class="tag2 good">' + esc(d.get("after", "")) + "</div></div>"
    cap = '<div class="muted small center">' + esc(d.get("caption", "")) + "</div>"
    return '<div class="card imgc"><div class="imgs">' + a + '<div class="arrow">&rarr;</div>' + b + "</div>" + cap + "</div>"


SCENES = {"rows": scene_rows, "chat": scene_chat, "qr": scene_qr, "gauge": scene_gauge, "bars": scene_bars,
          "line": scene_line, "checklist": scene_checklist, "code": scene_code, "doc": scene_doc, "chips": scene_chips,
          "timer": scene_timer, "compare": scene_compare, "big": scene_big, "swatches": scene_swatches,
          "quiz": scene_quiz, "image": scene_image}

# ------------------------------------------------------------------ page
CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #050b18; color: #fff;
  font-family: "Segoe UI", "Inter", Arial, sans-serif; }
.muted { opacity: .66; } .small { font-size: 17px; } .center { text-align: center; }
.glow1 { position:absolute; left:-220px; top:-280px; width:780px; height:780px; border-radius:50%;
  background: radial-gradient(circle, @@A1@@a0 0%, transparent 62%); }
.glow2 { position:absolute; right:-240px; bottom:-320px; width:840px; height:840px; border-radius:50%;
  background: radial-gradient(circle, @@A2@@60 0%, transparent 62%); }
.grid { position:absolute; inset:0; opacity:.09; background-image:
  linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
  background-size: 48px 48px; -webkit-mask-image: radial-gradient(ellipse at 72% 50%, #000 10%, transparent 70%); }
.copy { position:absolute; left:64px; top:64px; width:560px; }
.kick { display:inline-block; font-size:19px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
  color:@@A2L@@; border:2px solid @@A2@@99; background:@@A2@@1f; padding:8px 18px; border-radius:999px; max-width:560px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
h1 { font-size:@@H1@@px; line-height:1.03; font-weight:900; letter-spacing:-.025em; margin-top:24px; }
h1 em { font-style:normal; background: linear-gradient(90deg, @@A1L@@, @@A2L@@); -webkit-background-clip:text; background-clip:text; color:transparent; }
.sub { font-size:25px; line-height:1.36; color:#cbd5e1; font-weight:600; margin-top:20px; max-width:540px; }
.free { margin-top:24px; display:flex; gap:20px; font-size:20px; font-weight:800; color:#e2e8f0; }
.free span:before { content:"\\2713"; color:#34d399; margin-right:8px; }
.foot { position:absolute; left:64px; bottom:36px; font-size:20px; font-weight:700; color:#94a3b8; }
.brand { position:absolute; right:56px; bottom:30px; font-size:32px; font-weight:900; }
.brand span { color:#22d3ee; }
.scene { position:absolute; right:66px; top:56px; width:450px; height:470px; display:flex; align-items:center; justify-content:center;
  transform: perspective(1400px) rotateY(-14deg) rotateX(4deg) rotateZ(.6deg); }
.card { width:440px; padding:28px 30px; border-radius:28px; background:linear-gradient(160deg,#ffffff21,#ffffff09);
  border:2px solid #ffffff2e; box-shadow:0 30px 80px #000b, 0 0 70px @@A1@@33; font-size:21px; }
.slip-h { display:flex; justify-content:space-between; font-weight:900; letter-spacing:.12em; font-size:17px; margin-bottom:16px; color:@@A2L@@; text-transform:uppercase; }
.row, .kv { display:flex; justify-content:space-between; gap:14px; padding:8px 0; color:#e2e8f0; white-space:nowrap; }
.row span, .kv span { overflow:hidden; text-overflow:ellipsis; } .row b, .kv b { flex-shrink:0; }
.row.neg b { color:#fca5a5; } .row.big { font-size:27px; font-weight:900; } .row.big b { color:#4ade80; }
.line { height:2px; background:#ffffff26; margin:10px 0; }
.bar { height:14px; border-radius:99px; background:#ffffff1a; margin:14px 0 10px; overflow:hidden; }
.bar i { display:block; height:100%; background:linear-gradient(90deg,@@A1@@,@@A2L@@); border-radius:99px; }
/* chat */
.phone { position:relative; width:330px; height:470px; border-radius:46px; background:#0f172a; border:10px solid #1e293b;
  box-shadow:0 30px 90px #000c, 0 0 60px @@A1@@55; padding:54px 18px 18px; }
.notch { position:absolute; top:12px; left:50%; width:110px; height:24px; margin-left:-55px; border-radius:20px; background:#1e293b; }
.chat-h { display:flex; gap:12px; align-items:center; font-size:18px; margin-bottom:14px; }
.av { width:42px; height:42px; border-radius:50%; background:#334155; display:flex; align-items:center; justify-content:center; font-weight:900; }
.bubble { background:#1e293b; border-radius:18px 18px 18px 6px; padding:13px 15px; font-size:18px; line-height:1.36; color:#e2e8f0; margin-bottom:10px; max-width:92%; }
.bubble.me { margin-left:auto; background:@@A1@@; color:#fff; border-radius:18px 18px 6px 18px; }
.stamp { position:absolute; left:50%; top:232px; transform:translateX(-50%) rotate(-13deg); font-size:52px; font-weight:900; letter-spacing:.06em;
  color:var(--sc); border:6px solid var(--sc); border-radius:14px; padding:0 18px; background:#050818b3; white-space:nowrap; }
.verdict { position:absolute; left:18px; right:18px; bottom:18px; border-radius:14px; padding:12px 14px; font-size:17px; font-weight:800; display:flex; align-items:center; gap:10px; }
.verdict.bad { background:#7f1d1d; color:#fecaca; } .verdict.ok { background:#064e3b; color:#a7f3d0; }
.dot { width:13px; height:13px; border-radius:50%; background:currentColor; flex-shrink:0; }
/* qr */
.qrcard { width:340px; text-align:center; padding:22px 26px; } .qrbox { background:#fff; border-radius:18px; padding:18px; } .qrbox svg { width:100%; height:auto; display:block; }
.qrlabel { margin-top:14px; font-size:26px; font-weight:900; letter-spacing:.05em; }
.chips { margin-top:12px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
.chips span { font-size:16px; font-weight:800; padding:5px 12px; border-radius:99px; background:@@A1@@33; border:1.5px solid @@A1@@88; }
/* gauge */
.gauge { text-align:center; } .arc { width:300px; height:180px; display:block; margin:0 auto -34px; }
.arc .track, .arc .val { fill:none; stroke-width:18; stroke-linecap:round; } .arc .track { stroke:#ffffff1f; }
.arc .val { stroke:url(#g); stroke:@@A2L@@; filter: drop-shadow(0 0 10px @@A2@@); }
.gnum { font-size:70px; font-weight:900; line-height:1; } .gnum small { font-size:26px; margin-left:6px; opacity:.75; }
.glabel { font-size:20px; font-weight:800; color:@@A2L@@; margin:8px 0 12px; text-transform:uppercase; letter-spacing:.1em; }
/* bars + line */
.cols { display:flex; align-items:flex-end; gap:12px; height:190px; margin-top:10px; }
.col { flex:1; height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:8px; }
.col i { display:block; width:100%; border-radius:10px 10px 4px 4px; background:linear-gradient(180deg,@@A2L@@,@@A1@@); box-shadow:0 0 20px @@A1@@55; }
.col span { font-size:15px; opacity:.75; white-space:nowrap; }
.bignum { font-size:36px; font-weight:900; line-height:1.05; } .lsvg { width:100%; height:170px; margin-top:14px; display:block; }
.lsvg .ln { fill:none; stroke:@@A2L@@; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; filter: drop-shadow(0 0 8px @@A2@@); }
.lsvg .area { fill:@@A1@@33; }
/* checklist */
.ck { display:flex; align-items:center; gap:14px; padding:9px 0; font-size:20px; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.box { width:28px; height:28px; border-radius:8px; border:2.5px solid #ffffff55; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; flex-shrink:0; }
.ck.done .box { background:#22c55e; border-color:#22c55e; } .ck.done { color:#94a3b8; text-decoration: line-through; text-decoration-color:#ffffff55; }
/* code */
.codec { font-family: Consolas, "Cascadia Mono", monospace; font-size:19px; background:#0b1220e6; }
.dots3 { display:flex; gap:8px; align-items:center; margin-bottom:16px; } .dots3 i { width:13px; height:13px; border-radius:50%; background:#ef4444; }
.dots3 i:nth-child(2) { background:#f59e0b; } .dots3 i:nth-child(3) { background:#22c55e; } .dots3 span { margin-left:10px; font-family:"Segoe UI"; font-size:16px; opacity:.6; }
.cl { white-space:pre; line-height:1.6; color:#e2e8f0; overflow:hidden; } .c-s { font-style:normal; color:#86efac; } .c-n { font-style:normal; color:#fbbf24; } .c-cm { font-style:normal; color:#64748b; }
.out { margin-top:14px; padding:12px 14px; border-radius:12px; background:@@A1@@26; border:1.5px solid @@A1@@77; font-size:18px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
/* doc */
.doc { background:#f8fafc; color:#0f172a; box-shadow:0 30px 80px #000c, 0 0 70px @@A1@@44; position:relative; }
.dtitle { font-size:24px; font-weight:900; margin-bottom:14px; color:#0f172a; }
.dl { height:auto; font-size:17px; color:#475569; padding:5px 0; border-bottom:1px solid #e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dl.h { font-weight:800; color:#0f172a; border:none; padding-top:10px; }
.sign { margin-top:18px; font-family: "Segoe Script", "Brush Script MT", cursive; font-size:28px; color:#1d4ed8; }
.dbadge { position:absolute; right:-14px; top:-16px; background:@@A1@@; color:#fff; font-weight:900; font-size:16px; padding:8px 14px; border-radius:12px; transform:rotate(6deg); box-shadow:0 10px 24px #0007; }
/* chips */
.cwrap { display:flex; flex-wrap:wrap; gap:10px; }
.cwrap span { font-size:20px; font-weight:800; padding:10px 16px; border-radius:14px; background:#ffffff14; border:1.5px solid #ffffff2e; }
.cwrap span.hot { background:@@A1@@; border-color:@@A1@@; box-shadow:0 0 24px @@A1@@88; }
/* timer */
.timer { width:400px; text-align:center; position:relative; } .ring { width:300px; height:300px; display:block; margin:0 auto; transform:rotate(-90deg); }
.ring .track, .ring .val { fill:none; stroke-width:16; stroke-linecap:round; } .ring .track { stroke:#ffffff1a; } .ring .val { stroke:@@A2L@@; filter: drop-shadow(0 0 10px @@A2@@); }
.tnum { position:absolute; left:0; right:0; top:128px; font-size:62px; font-weight:900; font-variant-numeric: tabular-nums; }
.tlabel { position:absolute; left:0; right:0; top:206px; font-size:19px; font-weight:800; color:@@A2L@@; text-transform:uppercase; letter-spacing:.12em; }
/* compare */
.cmpwrap { display:flex; align-items:center; gap:0; transform:scale(1.18); } .cmp { width:215px; padding:22px 18px; border-radius:24px; background:linear-gradient(160deg,#ffffff21,#ffffff09); border:2px solid #ffffff2e; box-shadow:0 26px 70px #000b; }
.cmp.r { border-color:@@A1@@99; box-shadow:0 26px 70px #000b, 0 0 40px @@A1@@55; } .cname { font-size:20px; font-weight:900; margin-bottom:10px; color:@@A2L@@; }
.cmp .kv { font-size:16px; padding:6px 0; border-bottom:1px solid #ffffff14; } .vs { width:56px; height:56px; margin:0 -14px; z-index:2; border-radius:50%; background:@@A1@@; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:17px; box-shadow:0 0 30px @@A1@@; flex-shrink:0; }
/* big */
.bigc { text-align:left; } .blabel { font-size:17px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; color:@@A2L@@; }
.bval { font-size:62px; font-weight:900; line-height:1.05; margin:8px 0 4px; background: linear-gradient(90deg,#fff,@@A2L@@); -webkit-background-clip:text; background-clip:text; color:transparent; }
.bigc .kv { border-top:1px solid #ffffff17; }
/* swatches */
.sws { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:14px; } .sw i { display:block; height:82px; border-radius:16px; box-shadow:0 10px 24px #0006; }
.sw span { display:block; font-family:Consolas,monospace; font-size:15px; margin-top:6px; opacity:.8; } .gradbar { height:70px; border-radius:16px; margin-top:4px; }
/* quiz */
.qq { font-size:21px; font-weight:700; line-height:1.35; margin-bottom:14px; } .opt { display:flex; align-items:center; gap:12px; padding:11px 14px; margin-bottom:9px; border-radius:14px; background:#ffffff12; border:1.5px solid #ffffff22; font-size:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ol { width:30px; height:30px; border-radius:9px; background:#ffffff1f; display:flex; align-items:center; justify-content:center; font-weight:900; flex-shrink:0; }
.opt.right { background:#16a34a40; border-color:#22c55e; } .opt.right .ol { background:#22c55e; } .opt.wrong { background:#dc262640; border-color:#ef4444; } .opt.wrong .ol { background:#ef4444; }
/* image */
.imgs { display:flex; align-items:center; gap:10px; } .imgbox { flex:1; } .arrow { font-size:34px; font-weight:900; color:@@A2L@@; }
.ph { height:200px; border-radius:16px; background: radial-gradient(circle at 70% 30%, hsl(calc(var(--h) + 40) 90% 70%), transparent 40%), linear-gradient(160deg, hsl(var(--h) 80% 55%), hsl(calc(var(--h) + 60) 70% 30%)); box-shadow:0 12px 30px #0007; }
.tag2 { margin-top:10px; text-align:center; font-weight:900; font-size:19px; } .tag2.good { color:#4ade80; }
.imgc .small { margin-top:12px; }
"""

BODY = """
<div class="glow1"></div><div class="glow2"></div><div class="grid"></div>
<div class="copy">
  <div class="kick">@@KICK@@</div>
  <h1>@@TITLE@@</h1>
  <div class="sub">@@SUB@@</div>
  <div class="free"><span>Free</span><span>No sign-up</span><span>Works on phone</span></div>
</div>
<div class="scene">@@SCENE@@</div>
<div class="foot">techtrendi.com/tools/@@ID@@</div>
<div class="brand">Tech<span>Trendi</span></div>
"""


def lighten(hexc):
    """Brighter version of a colour for text on the dark background."""
    h = hexc.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    r, g, b = (int(c + (255 - c) * 0.35) for c in (r, g, b))
    return "#%02x%02x%02x" % (r, g, b)


def page(t, gradient):
    a1, a2 = colours(gradient)
    title = t["h"]
    plain = re.sub(r"<[^>]+>", "", title)
    size = 66 if len(plain) <= 30 else 60 if len(plain) <= 40 else 54
    scene = SCENES[t["sc"]](t["d"])
    out = "<!doctype html><html><head><meta charset='utf-8'><style>" + CSS + "</style></head><body>" + BODY + "</body></html>"
    for k, v in [("@@A1L@@", lighten(a1)), ("@@A2L@@", lighten(a2)), ("@@A1@@", a1), ("@@A2@@", a2), ("@@H1@@", str(size)),
                 ("@@KICK@@", esc(t["k"])), ("@@TITLE@@", title), ("@@SUB@@", esc(t["s"])), ("@@ID@@", t["id"]),
                 ("@@SCENE@@", scene)]:
        out = out.replace(k, v)
    return out


def catalog_gradients():
    s = open(os.path.join(ROOT, "src", "data", "tools.ts"), encoding="utf-8").read()
    return {m.group(1): m.group(2) for m in re.finditer(r'\{ id: "([^"]+)",.*?gradient: "([^"]+)"', s)}


def main(only):
    tools = json.load(open(DATA, encoding="utf-8"))
    grads = catalog_gradients()
    os.makedirs(OUT, exist_ok=True)
    done = []
    with sync_playwright() as p:
        br = p.chromium.launch(channel="chrome")
        pg = br.new_page(viewport={"width": 1200, "height": 630})
        for t in tools:
            if only and t["id"] not in only:
                done.append(t["id"])
                continue
            pg.set_content(page(t, grads.get(t["id"], "from-blue-500 to-cyan-600")))
            pg.wait_for_timeout(60)
            pg.screenshot(path=os.path.join(OUT, t["id"] + ".jpg"), type="jpeg", quality=82)
            done.append(t["id"])
            print("ok", t["id"])
        br.close()
    ids = sorted(i for i in done if os.path.exists(os.path.join(OUT, i + ".jpg")))
    with open(LIST_TS, "w", encoding="utf-8", newline="\n") as f:
        f.write("// Tools that have their own share picture at /og/tools/<id>.jpg.\n"
                "// Made by scripts/og-tools/render.py (style A \"Night Glow\", chosen 28 Nov 2026). Do not edit by hand.\n"
                "export const TOOL_OG_IMAGES: ReadonlySet<string> = new Set([\n")
        for i in ids:
            f.write('  "' + i + '",\n')
        f.write("]);\n")
    print(len(ids), "pictures listed in", os.path.relpath(LIST_TS, ROOT))


if __name__ == "__main__":
    main(set(sys.argv[1:]))
