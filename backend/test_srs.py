import pytest
from datetime import date, timedelta

# Simple mock of your SM-2 logic for the test
def calculate_next_review(quality, repetitions, interval, ease_factor):
    if quality < 3:
        return 1, 0, 2.5  # Reset on failure
    
    if repetitions == 0:
        new_interval = 1
    elif repetitions == 1:
        new_interval = 6
    else:
        new_interval = round(interval * ease_factor)
        
    new_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if new_ease_factor < 1.3:
        new_ease_factor = 1.3
        
    return new_interval, repetitions + 1, new_ease_factor

def test_sm2_progression():
    """Tests the core exponential growth of the SM-2 algorithm."""
    # Start: Fresh lesson
    interval, reps, ef = calculate_next_review(quality=5, repetitions=0, interval=0, ease_factor=2.5)
    assert interval == 1
    assert reps == 1
    
    # Second successful review
    interval, reps, ef = calculate_next_review(quality=5, repetitions=1, interval=1, ease_factor=2.5)
    assert interval == 6
    assert reps == 2
    
    # Third successful review (Exponential growth)
    # $I(n) = Round(I(n-1) \times EF)$
    interval, reps, ef = calculate_next_review(quality=5, repetitions=2, interval=6, ease_factor=2.5)
    assert interval == 15 # 6 * 2.5
    assert reps == 3