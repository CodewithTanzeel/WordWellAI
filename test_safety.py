import pytest
from app.safety import is_high_risk


HIGH_RISK_EXAMPLES = [
    "I don't want to be alive anymore",
    "I've been thinking about ending it all",
    "I have a plan to hurt myself tonight",
    "nobody would notice if I disappeared for good",
]

LOW_RISK_EXAMPLES = [
    "work has been really stressful this week",
    "I didn't sleep well and feel exhausted",
    "I'm anxious about my exam tomorrow",
    "had a great day at the park with friends",
    "",
]


@pytest.mark.parametrize("text", HIGH_RISK_EXAMPLES)
def test_high_risk_phrases_are_flagged(text):
    assert is_high_risk(text) is True


@pytest.mark.parametrize("text", LOW_RISK_EXAMPLES)
def test_low_risk_phrases_are_not_flagged(text):
    assert is_high_risk(text) is False


def test_detection_is_case_insensitive():
    assert is_high_risk("I DON'T WANT TO BE ALIVE ANYMORE") is True


def test_detection_ignores_surrounding_whitespace():
    assert is_high_risk("   i want to end it all   ") is True


def test_none_input_does_not_crash():
    # Defensive: safety layer must never throw on bad input,
    # it's the one function that absolutely cannot fail open.
    assert is_high_risk(None) is False
