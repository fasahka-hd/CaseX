import argparse
import os
import re
import time
import urllib.parse as up
from collections import deque

import requests
from bs4 import BeautifulSoup

ASSET_TAGS = {
    "link": "href",     
    "script": "src",    
    "img": "src",        
    "source": "src",     
}

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SiteMirrorBot/1.0; +https://example.com/bot)"
}


class SiteMirror:
    def __init__(self, start_url, out_dir, max_pages=100, delay=0.3, same_domain_only=True, respect_robots=True):
        self.start_url = start_url
        self.base = up.urlparse(start_url)
        self.out_dir = out_dir
        self.max_pages = max_pages
        self.delay = delay
        self.same_domain_only = same_domain_only
        self.visited_pages = set()
        self.visited_assets = set()
        self.session = requests.Session()
        self.session.headers.update(DEFAULT_HEADERS)
        self.disallowed = []
        if respect_robots:
            self._load_robots()

    # ---------- robots.txt ----------
    def _load_robots(self):
        robots_url = f"{self.base.scheme}://{self.base.netloc}/robots.txt"
        try:
            r = self.session.get(robots_url, timeout=10)
            if r.status_code == 200:
                ua_block = False
                for line in r.text.splitlines():
                    line = line.strip()
                    if line.lower().startswith("user-agent"):
                        ua_block = line.split(":", 1)[1].strip() == "*"
                    elif ua_block and line.lower().startswith("disallow"):
                        path = line.split(":", 1)[1].strip()
                        if path:
                            self.disallowed.append(path)
                print(f"[robots.txt] запрещённые пути: {self.disallowed}")
        except requests.RequestException:
            pass

    def _allowed(self, url):
        path = up.urlparse(url).path
        return not any(path.startswith(d) for d in self.disallowed)

    # ---------- helpers ----------
    def _same_domain(self, url):
        return up.urlparse(url).netloc in ("", self.base.netloc)

    def _local_path(self, url):
        """Преобразует URL в локальный путь внутри out_dir."""
        parsed = up.urlparse(url)
        path = parsed.path
        if path == "" or path.endswith("/"):
            path += "index.html"
        # убираем ведущий слэш, чтобы os.path.join работал корректно
        path = path.lstrip("/")
        local = os.path.join(self.out_dir, parsed.netloc or self.base.netloc, path)
        return local

    def _save(self, url, content, binary=True):
        local_path = self._local_path(url)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        mode = "wb" if binary else "w"
        with open(local_path, mode, encoding=None if binary else "utf-8") as f:
            f.write(content)
        return local_path

    def _fetch(self, url):
        try:
            r = self.session.get(url, timeout=15)
            if r.status_code != 200:
                print(f"  [skip {r.status_code}] {url}")
                return None
            return r
        except requests.RequestException as e:
            print(f"  [error] {url}: {e}")
            return None

    # ---------- crawling ----------
    def run(self):
        queue = deque([self.start_url])
        pages_done = 0

        while queue and pages_done < self.max_pages:
            url = queue.popleft()
            url = url.split("#")[0]
            if url in self.visited_pages or not self._allowed(url):
                continue
            self.visited_pages.add(url)

            print(f"[page] {url}")
            resp = self._fetch(url)
            time.sleep(self.delay)
            if resp is None:
                continue

            content_type = resp.headers.get("Content-Type", "")
            if "text/html" not in content_type:
                # это не html-страница, а какой-то файл — просто сохраняем
                self._save(url, resp.content, binary=True)
                continue

            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            # скачать связанные ресурсы (css, js, картинки, шрифты)
            for tag, attr in ASSET_TAGS.items():
                for node in soup.find_all(tag):
                    src = node.get(attr)
                    if not src:
                        continue
                    asset_url = up.urljoin(url, src)
                    self._download_asset(asset_url)

            # найти css внутри @import и inline <style> — по желанию можно расширить
            for style_tag in soup.find_all("style"):
                for m in re.finditer(r'url\(["\']?(.*?)["\']?\)', style_tag.text):
                    asset_url = up.urljoin(url, m.group(1))
                    self._download_asset(asset_url)

            # сохранить саму HTML-страницу
            self._save(url, html.encode("utf-8"), binary=True)
            pages_done += 1

            # найти ссылки на другие страницы того же домена
            for a in soup.find_all("a", href=True):
                next_url = up.urljoin(url, a["href"]).split("#")[0]
                if self.same_domain_only and not self._same_domain(next_url):
                    continue
                if next_url not in self.visited_pages:
                    queue.append(next_url)

        print(f"\nГотово. Скачано страниц: {pages_done}, ресурсов: {len(self.visited_assets)}")
        print(f"Результат в: {os.path.abspath(self.out_dir)}")

    def _download_asset(self, asset_url):
        if asset_url in self.visited_assets:
            return
        if self.same_domain_only and not self._same_domain(asset_url):
            return
        if not self._allowed(asset_url):
            return
        self.visited_assets.add(asset_url)

        resp = self._fetch(asset_url)
        time.sleep(self.delay)
        if resp is None:
            return
        self._save(asset_url, resp.content, binary=True)
        print(f"  [asset] {asset_url}")

        if asset_url.endswith(".css"):
            for m in re.finditer(r'url\(["\']?(.*?)["\']?\)', resp.text):
                inner = m.group(1)
                if inner.startswith("data:"):
                    continue
                inner_url = up.urljoin(asset_url, inner)
                self._download_asset(inner_url)


def main():
    parser = argparse.ArgumentParser(description="Скачать публичные HTML/CSS/JS/картинки с сайта")
    parser.add_argument("url", help="Стартовый URL, например https://example.com")
    parser.add_argument("--out", default="./site_copy", help="Папка для сохранения")
    parser.add_argument("--max-pages", type=int, default=100, help="Максимум HTML-страниц для обхода")
    parser.add_argument("--delay", type=float, default=0.3, help="Пауза между запросами, сек")
    parser.add_argument("--any-domain", action="store_true", help="Не ограничиваться исходным доменом (осторожно!)")
    parser.add_argument("--ignore-robots", action="store_true", help="Игнорировать robots.txt (не рекомендуется)")
    args = parser.parse_args()

    mirror = SiteMirror(
        start_url=args.url,
        out_dir=args.out,
        max_pages=args.max_pages,
        delay=args.delay,
        same_domain_only=not args.any_domain,
        respect_robots=not args.ignore_robots,
    )
    mirror.run()


if __name__ == "__main__":
    main()