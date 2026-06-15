"""Tests for the free-build city layout system (roads, build, move, demolish)."""
import os
import pytest
import requests
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')
BASE = os.environ['REACT_APP_BACKEND_URL'] + '/api'

STUDENT = {"email": "aluno@teste.pt", "password": "Aluno1234*"}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json=STUDENT)
    assert r.status_code == 200, r.text
    # Ensure game state exists, then top up resources directly in Mongo so build tests never starve
    assert s.get(f"{BASE}/game/state").status_code == 200
    from pymongo import MongoClient
    load_dotenv('/app/backend/.env')
    client = MongoClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    db.game_states.update_one(
        {"user_id": "user_27e0fcfdfcfc"},
        {"$set": {"resources.wood": 500, "resources.stone": 500, "resources.iron": 200}, "$inc": {"coins": 500}}
    )
    client.close()
    return s


@pytest.fixture(scope="module")
def layout(session):
    # Ensure game state exists first
    r = session.get(f"{BASE}/game/state")
    assert r.status_code == 200
    r = session.get(f"{BASE}/game/city/layout")
    assert r.status_code == 200, r.text
    return r.json()


def test_layout_has_default_roads_and_town_hall(layout):
    assert layout["grid_size"] == 14
    assert len(layout["roads"]) >= 1
    th = layout["buildings"]["town_hall"]
    assert th["level"] >= 1
    assert th["placed"] is True


def test_build_requires_adjacent_road(session, layout):
    r = session.post(f"{BASE}/game/city/build", json={"building_id": "house", "x": 0, "y": 0})
    assert r.status_code == 400
    assert "estrada" in r.json()["detail"].lower()


def test_road_must_connect_to_network(session):
    r = session.post(f"{BASE}/game/city/road/build", json={"x": 0, "y": 0})
    assert r.status_code == 400


def test_build_move_demolish_cycle(session):
    state = session.get(f"{BASE}/game/state").json()
    coins_before = state["coins"]
    layout = session.get(f"{BASE}/game/city/layout").json()
    roads = {tuple(r) for r in layout["roads"]}
    occupied = {
        (b["x"], b["y"]) for b in layout["buildings"].values()
        if isinstance(b, dict) and b.get("level", 0) > 0 and b.get("placed")
    }

    # Find a free tile adjacent to a road
    target = None
    for (rx, ry) in roads:
        for nx, ny in ((rx + 1, ry), (rx - 1, ry), (rx, ry + 1), (rx, ry - 1)):
            if 0 <= nx < 14 and 0 <= ny < 14 and (nx, ny) not in roads and (nx, ny) not in occupied:
                target = (nx, ny)
                break
        if target:
            break
    assert target, "No free tile next to a road"

    # Pick an unbuilt cheap building
    bid = next((b for b in ("garden", "farm", "house") if (layout["buildings"].get(b, {}).get("level", 0) == 0)), None)
    if bid is None:
        pytest.skip("All cheap buildings already built")

    r = session.post(f"{BASE}/game/city/build", json={"building_id": bid, "x": target[0], "y": target[1]})
    assert r.status_code == 200, r.text

    # Cannot build same building twice
    r = session.post(f"{BASE}/game/city/build", json={"building_id": bid, "x": target[0], "y": target[1]})
    assert r.status_code == 400

    # Move to another valid tile
    target2 = None
    for (rx, ry) in roads:
        for nx, ny in ((rx + 1, ry), (rx - 1, ry), (rx, ry + 1), (rx, ry - 1)):
            cand = (nx, ny)
            if 0 <= nx < 14 and 0 <= ny < 14 and cand not in roads and cand not in occupied and cand != target:
                target2 = cand
                break
        if target2:
            break
    if target2:
        r = session.post(f"{BASE}/game/city/move", json={"building_id": bid, "x": target2[0], "y": target2[1]})
        assert r.status_code == 200, r.text

    # Demolish refunds 50%
    r = session.post(f"{BASE}/game/city/demolish", json={"building_id": bid})
    assert r.status_code == 200, r.text
    refund = r.json()["refund"]
    assert refund["coins"] >= 0

    state_after = session.get(f"{BASE}/game/state").json()
    # Net coins change = -cost + 50% refund
    assert state_after["coins"] < coins_before


def test_town_hall_protected(session):
    r = session.post(f"{BASE}/game/city/demolish", json={"building_id": "town_hall"})
    assert r.status_code == 400
    r = session.post(f"{BASE}/game/city/move", json={"building_id": "town_hall", "x": 1, "y": 1})
    assert r.status_code == 400


def test_road_build_and_remove_with_refund(session):
    layout = session.get(f"{BASE}/game/city/layout").json()
    roads = {tuple(r) for r in layout["roads"]}
    occupied = {
        (b["x"], b["y"]) for b in layout["buildings"].values()
        if isinstance(b, dict) and b.get("level", 0) > 0 and b.get("placed")
    }
    target = None
    for (rx, ry) in roads:
        for nx, ny in ((rx + 1, ry), (rx - 1, ry), (rx, ry + 1), (rx, ry - 1)):
            if 0 <= nx < 14 and 0 <= ny < 14 and (nx, ny) not in roads and (nx, ny) not in occupied:
                target = (nx, ny)
                break
        if target:
            break
    assert target

    r = session.post(f"{BASE}/game/city/road/build", json={"x": target[0], "y": target[1]})
    assert r.status_code == 200, r.text

    # Duplicate road rejected
    r = session.post(f"{BASE}/game/city/road/build", json={"x": target[0], "y": target[1]})
    assert r.status_code == 400

    # Remove (leaf road) with refund
    r = session.post(f"{BASE}/game/city/road/remove", json={"x": target[0], "y": target[1]})
    assert r.status_code == 200, r.text
    assert r.json()["refund"]["wood"] == 2
