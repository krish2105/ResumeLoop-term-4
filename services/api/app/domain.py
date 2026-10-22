from typing import Sequence

def choose_recovery_actions(actions: Sequence[dict], available_minutes: int, completed_ids: set[str] | None = None) -> list[dict]:
    """Rule-only demo planner: prerequisites and time budget, never predicts learner outcomes."""
    if available_minutes < 0: raise ValueError("available_minutes must be nonnegative")
    done = set(completed_ids or set()); chosen = []; budget = available_minutes
    for action in sorted(actions, key=lambda a: (a.get("priority",99), a.get("minutes",0))):
        needed = set(action.get("prerequisites", []))
        minutes = int(action.get("minutes",0))
        if minutes <= 0 or minutes > budget or not needed.issubset(done): continue
        chosen.append(action); done.add(str(action["id"])); budget -= minutes
    return chosen

DEMO_INPUT = {"actions":[{"id":"recap","priority":1,"minutes":15,"prerequisites":[]},{"id":"exercise","priority":2,"minutes":25,"prerequisites":["recap"]},{"id":"optional","priority":3,"minutes":20,"prerequisites":[]}],"available_minutes":45}

def domain_example():
    return {"method":"deterministic schedule demo, not AI", "selected":choose_recovery_actions(DEMO_INPUT["actions"], DEMO_INPUT["available_minutes"]),"source":"SYNTHETIC sample only"}
