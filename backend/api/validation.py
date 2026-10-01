import json
import math
from django.core.exceptions import ValidationError

KEYS = {
 "neuroLift_history", "neuroLift_journal", "neuroLift_templates",
 "neuroLift_cal_history", "neuroLift_cal_date", "neuroLift_daily_cal",
 "neuroLift_user_profile", "neuroLift_userGoal", "neuroLift_units",
 "neuroLift_hasCompletedOnboarding", "neuroLift_onboarding_completed",
}
ARRAYS = {"neuroLift_history", "neuroLift_journal", "neuroLift_templates", "neuroLift_cal_history"}

def number(value):
    return type(value) in (int, float) and math.isfinite(value) and value >= 0

def validate_snapshot(data):
    if not isinstance(data, dict) or set(data) - KEYS:
        raise ValidationError("Unsupported data categories.")
    if len(json.dumps(data)) > 1_500_000:
        raise ValidationError("Account data exceeds the preview limit. Export a backup.")
    for key, raw in data.items():
        if not isinstance(raw, str) or len(raw) > 1_500_000:
            raise ValidationError("Data values must be serialized strings.")
        if key in ARRAYS:
            try:
                items = json.loads(raw)
            except (ValueError, TypeError):
                raise ValidationError("Invalid collection.")
            if not isinstance(items, list) or len(items) > 5000:
                raise ValidationError("Invalid collection size.")
            seen = set()
            for item in items:
                if not isinstance(item, dict):
                    raise ValidationError("Collection items must be objects.")
                if key != "neuroLift_cal_history":
                    identity = item.get("id")
                    if not isinstance(identity, str) or not identity or len(identity) > 128 or identity in seen:
                        raise ValidationError("Records require unique IDs.")
                    seen.add(identity)
                if key == "neuroLift_history":
                    if not number(item.get("durationSeconds")) or not number(item.get("totalVolume")):
                        raise ValidationError("Invalid workout totals.")
                    if not isinstance(item.get("date"), str) or not isinstance(item.get("exercises"), list):
                        raise ValidationError("Invalid workout.")
                    for exercise in item["exercises"]:
                        if not isinstance(exercise, dict) or not isinstance(exercise.get("name"), str) or not isinstance(exercise.get("sets"), list):
                            raise ValidationError("Invalid exercise.")
                        for s in exercise["sets"]:
                            if not isinstance(s, dict) or not number(s.get("weight")) or not number(s.get("reps")) or type(s.get("completed")) is not bool:
                                raise ValidationError("Invalid set.")
                if key == "neuroLift_templates":
                    if not isinstance(item.get("name"), str) or not isinstance(item.get("exercises"), list):
                        raise ValidationError("Invalid template.")
                    for e in item["exercises"]:
                        if not isinstance(e, dict) or not isinstance(e.get("name"), str) or not number(e.get("targetSets")) or not isinstance(e.get("targetReps"), str):
                            raise ValidationError("Invalid template exercise.")
                if key == "neuroLift_journal" and not isinstance(item.get("date"), str):
                    raise ValidationError("Invalid journal date.")
                if key == "neuroLift_cal_history" and (not isinstance(item.get("date"), str) or not number(item.get("calories"))):
                    raise ValidationError("Invalid nutrition entry.")
        if key == "neuroLift_daily_cal":
            try:
                if not number(float(raw)):
                    raise ValueError()
            except ValueError:
                raise ValidationError("Invalid daily calories.")
        if key == "neuroLift_user_profile":
            try:
                if not isinstance(json.loads(raw), dict):
                    raise ValueError()
            except ValueError:
                raise ValidationError("Invalid profile.")
