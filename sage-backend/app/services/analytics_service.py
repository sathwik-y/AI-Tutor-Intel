# app/services/analytics_service.py
from typing import Dict

# A simple in-memory store for usage statistics.
usage_stats: Dict[str, int] = {
    "voice": 0,
    "text": 0,
    "image": 0,
}

def record_query(query_type: str):
    """Increments the counter for a given query type."""
    if query_type in usage_stats:
        usage_stats[query_type] += 1
    print(f"Analytics: Recorded '{query_type}' query. New stats: {usage_stats}")

def get_usage_stats() -> Dict[str, int]:
    """Returns the current usage statistics."""
    return usage_stats

def reset_usage_stats():
    """Resets all usage statistics to zero."""
    for key in usage_stats:
        usage_stats[key] = 0
    print("Analytics: Usage stats have been reset.")
