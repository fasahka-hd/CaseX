#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
site_mirror.py — выкачивает публично доступные статические ресурсы сайта
(HTML, CSS, JS, картинки, шрифты, SVG, JSON...) в локальную папку, повторяя
структуру путей сервера. Защита от зацикливания и от выкачки всего интернета.

Пример:
    python3 site_mirror.py https://ggdrop.com --out ggdrop_mirror --depth 3
"""

import argparse
import os
import re
import sys
import time
from urllib.parse import urljoin, urlparse, unquote, urldefrag
from urllib.robotparser import RobotFileParser

try:
    import requests
except ImportError:
    sys.exit("Установите requests:  pip install requests")

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Установите beautifulsoup4:  pip install beautifulsoup4")

# Расширения ресурсов, которые имеет смысл качать
RESOURCE_EXT = {
    "css", "js", "mjs", "png", "jpg", "jpeg", "webp", "gif", "svg", "ico",
    "woff", "woff2", "ttf", "otf", "eot", "json", "map", "webmanifest",
    "mp4", "webm", "avif",
}

# Расширения страниц (которые могут ссылаться на другие страницы)
PAGE_EXT = {"html", "htm", ""}

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36 mirror-bot",
    "Accept": "*/*",
})

robots_cache = {}
robots_ok = True  # станет False, если явно запрещено


def can_fetch(url):
    """Проверяем robots.txt для заданного URL (best-effort)."""
    global robots_ok
    try:
        parts = urlparse(url)
        host = f"{parts.scheme}://{parts.netloc}"
        if host not in robots_cache:
            rp = RobotFileParser()
            try:
                r = session.get(urljoin(host, "/robots.txt"), timeout=15)
                if r.status_code == 200:
                    rp.parse(r.text.splitlines())
                else:
                    robots_cache[host] = True
                    return True
            except Exception:
                robots_cache[host] = True
                return True
            robots_cache[host] = rp
        rp = robots_cache[host]
        if rp is True:
            return True
        if rp is False:
            return False
        allow = rp.can_fetch("*", url)
        if not allow:
            robots_ok = False
        return allow
    except Exception:
        return True


def safe_path(root, url_path):
    """Превращает url-path в безопасный путь внутри root (без выхода наружу)."""
    decoded = unquote(url_path)
    # убираем повторные слэши, "..", "." — предотвращаем path traversal
    parts = []
    for seg in decoded.split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            if parts:
                parts.pop()
            continue
        parts.append(seg)
    if not parts:
        parts = ["index.html"]
    rel = os.path.join(*parts)
    if rel.endswith("/") or "." not in os.path.basename(rel):
        rel = os.path.join(rel, "index.html")
    return os.path.join(root, rel)


def classify(ext, ctype):
    """CSS/JS/шрифты/картинки — ресурсы; html — страницы."""
    if ext in ("css",):
        return "css"
    if ext in ("js", "mjs", "map"):
        return "js"
    if ext in ("html", "htm", ""):
        return "page"
    return "asset"


def extract_assets(soup, url, base_url):
    """Извлекаем URL из тегов страницы."""
    found = set()
    base_href = soup.find("base")
    base = urljoin(url, base_href.get("href", "")) if base_href and base_href.get("href") else url

    # link[href] (css, иконки, preload, fonts)
    for tag in soup.find_all("link", href=True):
        found.add(urljoin(base, tag["href"]))
    # script[src]
    for tag in soup.find_all("script", src=True):
        found.add(urljoin(base, tag["src"]))
    # img[src] / img[srcset] / source[srcset]
    for tag in soup.find_all(["img", "source", "video", "audio"]):
        if tag.get("src"):
            found.add(urljoin(base, tag["src"]))
        if tag.get("srcset"):
            for part in tag["srcset"].split(","):
                piece = part.strip().split()[0]
                if piece and piece != "data:":
                    found.add(urljoin(base, piece))
    # iframe
    for tag in soup.find_all("iframe", src=True):
        found.add(urljoin(base, tag["src"]))
    # meta og:image
    for tag in soup.find_all("meta", attrs={"content": True}):
        if (tag.get("property") or tag.get("name", "")) in ("og:image", "twitter:image"):
            found.add(urljoin(base, tag["content"]))
    return found


def extract_css_urls(text, url):
    """URL из CSS: url(...) и @import."""
    found = set()
    for m in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", text):
        raw = m.group(2).strip()
        if raw.startswith(("data:", "#", "blob:")):
            continue
        found.add(urljoin(url, raw))
    for m in re.finditer(r"@import\s+(['\"])?(.*?)\1", text):
        raw = m.group(2).strip()
        if raw.startswith("url("):
            continue
        found.add(urljoin(url, raw))
    return found


def download_file(url, root, depth, state, force=False):
    """Скачивает один файл и возвращает (path, content_type)."""
    url, _ = urldefrag(url)
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return None, None
    ext = parsed.path.rsplit(".", 1)[-1].lower() if "." in parsed.path else ""
    host = parsed.netloc
    if host != state["host"]:
        # внешние ресурсы качаем, но не углубляемся в них как в страницы
        pass

    fpath = safe_path(root, parsed.path)
    if fpath in state["done"] and not force:
        return state["done"][fpath], state["content_types"].get(fpath)
    state["done"].add(fpath)

    if not can_fetch(url):
        state["skipped"] += 1
        return None, None

    # лёгкая защита от огромных файлов (видео/бинарники) — не качаем > 80 МБ
    for attempt in range(3):
        try:
            r = session.get(url, timeout=25, stream=True)
            r.raise_for_status()
            length = int(r.headers.get("Content-Length", 0) or 0)
            if length > 80 * 1024 * 1024:
                state["skipped"] += 1
                return None, None
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip()
            with open(fpath, "wb") as f:
                r.raw.decode_content = True
                for chunk in r.iter_content(65536):
                    f.write(chunk)
            state["downloaded"] += 1
            state["content_types"][fpath] = ctype
            state["urls_by_ext"].setdefault(ext, set()).add(url)
            return fpath, ctype
        except Exception as e:
            state["errors"].append((url, str(e)))
            if attempt == 2:
                return None, None
            time.sleep(1.0)
    return None, None


def process_css(fpath, url, root, depth, state):
    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    for child in extract_css_urls(text, url):
        if state["visited_urls"].get(child):
            continue
        state["visited_urls"][child] = True
        cpath, _ = download_file(child, root, depth, state)
        if cpath and child.rsplit(".", 1)[-1].lower() == "css":
            process_css(cpath, child, root, depth, state)


def process_page(fpath, url, root, depth, state):
    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    soup = BeautifulSoup(text, "html.parser")
    for child in extract_assets(soup, url, url):
        if state["visited_urls"].get(child):
            continue
        state["visited_urls"][child] = True
        cpath, ctype = download_file(child, root, depth, state)
        if not cpath:
            continue
        ext = child.rsplit(".", 1)[-1].lower() if "." in urlparse(child).path else ""
        kind = classify(ext, ctype or "")
        if kind == "css":
            process_css(cpath, child, root, depth, state)
        elif kind == "page" and depth > 0:
            process_page(cpath, child, root, depth - 1, state)


def main():
    ap = argparse.ArgumentParser(description="Зеркало статики сайта")
    ap.add_argument("url", help="Начальный URL (например https://ggdrop.com)")
    ap.add_argument("--out", default="mirror", help="Папка для сохранения")
    ap.add_argument("--depth", type=int, default=2, help="Глубина обхода страниц")
    ap.add_argument("--ignore-robots", action="store_true", help="Игнорировать robots.txt")
    args = ap.parse_args()

    global robots_ok
    if args.ignore_robots:
        robots_cache[urlparse(args.url).netloc] = True

    root = os.path.abspath(args.out)
    os.makedirs(root, exist_ok=True)

    state = {
        "host": urlparse(args.url).netloc,
        "done": set(),
        "visited_urls": {},
        "content_types": {},
        "urls_by_ext": {e: set() for e in RESOURCE_EXT},
        "downloaded": 0,
        "skipped": 0,
        "errors": [],
    }

    print(f"[*] Старт: {args.url}\n[*] Папка: {root}\n[*] Глубина: {args.depth}\n")

    first_path, ctype = download_file(args.url, root, args.depth, state)
    if not first_path:
        print("[!] Не удалось скачать стартовую страницу")
        sys.exit(1)
    process_page(first_path, args.url, root, args.depth, state)

    print(f"\n[+] Скачано файлов: {state['downloaded']}")
    print(f"[-] Пропущено (robots/размер): {state['skipped']}")
    if state["errors"]:
        print(f"[!] Ошибок: {len(state['errors'])}")
        for u, e in state["errors"][:10]:
            print(f"      {u} -> {e}")
    if not robots_ok and not args.ignore_robots:
        print("[i] Внимание: часть URL была запрещена robots.txt (можно отключить --ignore-robots)")

    # красивый отчёт по типам
    print("\n[Типы файлов]")
    for ext in sorted(RESOURCE_EXT):
        n = len(state["urls_by_ext"].get(ext, set()))
        if n:
            print(f"    .{ext:<12} {n}")

    print(f"\nГотово. Структура сохранена в: {root}")


if __name__ == "__main__":
    main()
