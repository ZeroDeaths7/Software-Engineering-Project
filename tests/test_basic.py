import requests

BASE = "http://localhost:3000"


def test_homepage_up():
    r = requests.get(f"{BASE}/")
    # Depending on auth redirects, allow 200 or 302
    assert r.status_code in (200, 302)


def test_create_post_page():
    r = requests.get(f"{BASE}/posts/create")
    assert r.status_code in (200, 302)
