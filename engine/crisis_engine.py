"""
Crisis triage playbooks.
Returns structured step-by-step actions for each crisis type.
These are the BASE steps — Claude AI enhances them with personalization.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

def get_crisis_playbook(crisis_type: str, state: str = "AZ") -> dict:
    """Get base crisis playbook for a given crisis type."""
    with open(DATA_DIR / "crisis_playbooks.json") as f:
        playbooks = json.load(f)
    
    playbook = playbooks.get(crisis_type, playbooks["general"])
    
    # Add state-specific URLs/info
    state_info = get_state_info(state)
    for step in playbook["steps"]:
        if step.get("state_specific_key"):
            key = step["state_specific_key"]
            if key in state_info:
                step["action_url"] = state_info[key]
                step["description"] += f" In {state}: {state_info.get(key + '_note', '')}"
    
    return playbook


def get_state_info(state: str) -> dict:
    """State-specific URLs and info."""
    state_data = {
        "AZ": {
            "unemployment_url": "https://des.az.gov/services/employment/unemployment-individual",
            "unemployment_url_note": "File at des.az.gov. Weekly benefit: $117-$320.",
            "medicaid_url": "https://www.healthearizonaplus.gov",
            "medicaid_url_note": "Apply through Health-e-Arizona Plus.",
            "snap_url": "https://www.healthearizonaplus.gov",
            "snap_url_note": "Apply through Health-e-Arizona Plus.",
            "liheap_url": "https://des.az.gov/liheap",
            "liheap_url_note": "Utility assistance through LIHEAP.",
            "insurance_dept_url": "https://insurance.az.gov/consumers/file-complaint",
            "insurance_dept_note": "File insurance complaints with AZ Dept of Insurance.",
        }
    }
    return state_data.get(state, state_data["AZ"])
