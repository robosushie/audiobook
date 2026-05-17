"""Inngest functions registered with the API server."""

from src.services.event.functions.audiobook_generate import audiobook_generate
from src.services.event.functions.voice_preprocess import voice_preprocess

inngest_functions = [voice_preprocess, audiobook_generate]
