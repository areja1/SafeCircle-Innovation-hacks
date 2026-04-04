
import pytest
from engine.crisis_engine import get_crisis_playbook

def test_load_car_accident_playbook():
    """
    Tests that the 'car_accident' playbook is loaded correctly
    and contains the expected structure.
    """
    playbook = get_crisis_playbook("car_accident", state="AZ")
    
    assert playbook is not None
    assert playbook["crisis_type"] == "car_accident"
    assert len(playbook["steps"]) > 0
    assert "dont_sign_warning" in playbook
    
    # Check that a step has the expected structure
    first_step = playbook["steps"][0]
    assert "id" in first_step
    assert "priority" in first_step
    assert "title" in first_step
    assert "description" in first_step

def test_state_specific_url_injection():
    """
    Tests that a state-specific URL is correctly injected into a playbook step.
    The 'job_loss' playbook has a step with 'state_specific_key': 'unemployment_url'.
    """
    playbook = get_crisis_playbook("job_loss", state="AZ")
    
    unemployment_step = next((step for step in playbook["steps"] if step.get("state_specific_key") == "unemployment_url"), None)
    
    assert unemployment_step is not None
    # Check that the placeholder was replaced with the actual URL for Arizona
    assert unemployment_step["action_url"] == "https://des.az.gov/services/employment/unemployment-individual"
    # Check that the note was added to the description
    assert "File at des.az.gov" in unemployment_step["description"]

def test_fallback_to_general_playbook():
    """
    Tests that if a crisis type does not exist, the system gracefully returns the 'general' playbook.
    """
    playbook = get_crisis_playbook("non_existent_crisis", state="AZ")
    
    assert playbook is not None
    assert playbook["crisis_type"] == "general"
    assert len(playbook["steps"]) > 0

def test_playbook_structure_and_content():
    """
    Performs a high-level check on all defined crisis playbooks to ensure they have steps.
    """
    playbook_types = ["car_accident", "job_loss", "medical_emergency", "death_in_family", "home_damage"]
    for crisis_type in playbook_types:
        playbook = get_crisis_playbook(crisis_type, state="AZ")
        assert playbook is not None, f"Playbook for {crisis_type} should not be null"
        assert len(playbook["steps"]) > 5, f"Playbook for {crisis_type} should have a reasonable number of steps"

