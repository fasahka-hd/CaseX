import os
import time
import urllib.request

urls = """https://s3.caser.one/cdn/cases/1ffae148b49584b49aa27aa70d5b7835-69f234302cf04.webp
https://s3.caser.one/cdn/cases/b03140a16b92d2f08882c0eda62e7c53-6a5a8714b069b.webp
https://s3.caser.one/cdn/cases/bc61edd4a117b3ea9de48b7090f06f3c-69f2361d0fd29.webp
https://s3.caser.one/cdn/cases/df4d5606781c7891d5f313ab6f3e4479-69f2334902591.webp
https://s3.caser.one/cdn/cases/6a26f96b3db50d9e54063e66e94de104-69f235c7882a9.webp
https://s3.caser.one/cdn/cases/dfcf1c2e66db26305afa02b38f186016-69f237420bd01.webp
https://s3.caser.one/cdn/cases/693fab58189d4a26ed6a386109f41510-69f23a65ebef3.webp
""".split()

out_dir = "cases"
os.makedirs(out_dir, exist_ok=True)

headers = {"User-Agent": "Mozilla/5.0"}

for i, url in enumerate(urls, 1):
    filename = url.split("/")[-1]
    path = os.path.join(out_dir, filename)
    if os.path.exists(path):
        print(f"[{i}/{len(urls)}] пропущено (уже есть): {filename}")
        continue
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp, open(path, "wb") as f:
            f.write(resp.read())
        print(f"[{i}/{len(urls)}] скачано: {filename}")
    except Exception as e:
        print(f"[{i}/{len(urls)}] ОШИБКА {filename}: {e}")
    time.sleep(0.2)  # чтобы не спамить сервер запросами

print("Готово.")