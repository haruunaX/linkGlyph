from __future__ import annotations

import re
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


app = FastAPI(
    title="LinkGlyph Scan Proof API",
    description="Local quality checks for LinkGlyph QR configurations.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:4173", "http://localhost:4173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ScanCheckRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4096)
    foreground: str = "#0B1220"
    background: str = "#FFFFFF"
    size: int = Field(default=1024, ge=128, le=4096)
    margin: int = Field(default=4, ge=0, le=20)
    error_correction: Literal["L", "M", "Q", "H"] = "M"

    @field_validator("foreground", "background")
    @classmethod
    def valid_hex_color(cls, value: str) -> str:
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
            raise ValueError("Color must use six-digit hex format")
        return value.upper()


class ScanCheckResponse(BaseModel):
    score: int
    grade: Literal["Excellent", "Good", "Needs work"]
    contrast_ratio: float
    recommendations: list[str]
    source: Literal["python"] = "python"


def relative_luminance(color: str) -> float:
    channels = [int(color[index : index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [channel / 12.92 if channel <= 0.03928 else ((channel + 0.055) / 1.055) ** 2.4 for channel in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast_ratio(first: str, second: str) -> float:
    light, dark = sorted((relative_luminance(first), relative_luminance(second)), reverse=True)
    return (light + 0.05) / (dark + 0.05)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "linkglyph-scan-proof"}


@app.post("/api/qr/inspect", response_model=ScanCheckResponse)
def inspect_qr(payload: ScanCheckRequest) -> ScanCheckResponse:
    ratio = contrast_ratio(payload.foreground, payload.background)
    score = 100
    recommendations: list[str] = []

    if ratio < 4.5:
        score -= 42 if ratio < 3 else 24
        recommendations.append("Increase contrast between the code and its background.")
    if payload.margin < 4:
        score -= 18
        recommendations.append("Use a quiet zone of at least 4 modules for reliable scanning.")
    if len(payload.content) > 500:
        score -= 16
        recommendations.append("Shorten the content or use a redirect URL to reduce QR density.")
    elif len(payload.content) > 220:
        score -= 8
        recommendations.append("This is a dense code; test it at the final print size.")
    if payload.size < 512:
        score -= 10
        recommendations.append("Export at 512 px or larger for sharper results.")
    if payload.error_correction == "L" and len(payload.content) > 180:
        score -= 5
        recommendations.append("Use Medium or higher error correction for dense content.")

    if not recommendations:
        recommendations.append("Strong contrast and spacing — ready for a real-device scan test.")

    score = max(0, score)
    grade: Literal["Excellent", "Good", "Needs work"]
    grade = "Excellent" if score >= 90 else "Good" if score >= 72 else "Needs work"
    return ScanCheckResponse(
        score=score,
        grade=grade,
        contrast_ratio=round(ratio, 2),
        recommendations=recommendations,
    )
