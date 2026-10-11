"""Redis queue names and retry budgets."""

from datetime import timedelta

VOICE_PREPROCESS_QUEUE = "jobs:voice_preprocess"
AUDIOBOOK_GENERATE_QUEUE = "jobs:audiobook_generate"

VOICE_PREPROCESS_MAX_ATTEMPTS = 3
AUDIOBOOK_GENERATE_MAX_ATTEMPTS = 2

VOICE_STALE_AFTER = timedelta(minutes=30)
AUDIOBOOK_STALE_AFTER = timedelta(hours=2)
