"""Vercel serverless entrypoint for the LinkGlyph FastAPI backend.

Vercel routes every /api/* request here (see vercel.json). The original
request path is preserved, so FastAPI's /api/... routes match unchanged.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import app  # noqa: E402,F401
