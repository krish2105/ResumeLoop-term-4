def test_recovery_priorities():
    from app.domain import choose_recovery_actions, DEMO_INPUT
    assert [x["id"] for x in choose_recovery_actions(DEMO_INPUT["actions"], 45)] == ["recap", "exercise"]
