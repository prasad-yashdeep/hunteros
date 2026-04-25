"""Intent router — regex-first, cheap, deterministic."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, Field


class Intent(BaseModel):
    name: str
    slots: dict[str, Any] = Field(default_factory=dict)
    destructive: bool = False
    confidence: float = 1.0
    raw: str = ""

    def model_dump(self, **kw):  # type: ignore[override]
        return super().model_dump(**kw)


# Known agent ids & aliases
AGENT_ALIASES = {
    "main": "main", "builder": "main", "claw": "main", "clawbuilder": "main",
    "jobhunt": "jobhunt", "job": "jobhunt", "hunter": "jobhunt",
    "cinderella": "cinderella", "cinder": "cinderella", "fashion": "cinderella",
    "mem0claw": "mem0claw", "memory": "mem0claw",
    "cinbackend": "cin-backend", "backend": "cin-backend",
    "cinfrontend": "cin-frontend", "frontend": "cin-frontend",
    "cinios": "cin-ios", "ios": "cin-ios",
    "cinmarketing": "cin-marketing", "marketing": "cin-marketing",
    "cinoutreach": "cin-outreach", "outreach": "cin-outreach",
    "cinuiux": "cin-uiux", "uiux": "cin-uiux", "ui": "cin-uiux",
    "hpc": "hpc",
}


def _find_agent(text: str) -> str | None:
    words = re.findall(r"[a-zA-Z0-9_-]+", text.lower())
    for w in words:
        if w in AGENT_ALIASES:
            return AGENT_ALIASES[w]
    # also allow hyphenated names
    for alias, agent in AGENT_ALIASES.items():
        if re.search(rf"\b{re.escape(alias)}\b", text.lower()):
            return agent
    return None


def route_intent(text: str) -> Intent:
    t = (text or "").strip()
    low = t.lower()
    if not t:
        return Intent(name="unknown", raw=t, confidence=0)

    # kill / dismiss
    if re.search(r"\b(kill|dismiss|terminate|end|banish|stop)\b", low):
        agent = _find_agent(t)
        return Intent(name="kill", slots={"agent": agent or ""}, destructive=True, raw=t)

    # spawn / arise / summon
    if re.search(r"\b(arise|spawn|summon|awaken|invoke)\b", low):
        agent = _find_agent(t) or "main"
        # capture "with task ..." or "to ..."
        task = None
        m = re.search(r"(?:with task|to|for)\s+(.+)$", t, re.IGNORECASE)
        if m:
            task = m.group(1).strip(" .")
        return Intent(name="spawn", slots={"agent": agent, "task": task}, raw=t)

    # send / dispatch
    if re.search(r"\b(send|dispatch|tell|ask)\b", low) and re.search(r"\bto\b|\bquest\b|:", low):
        agent = _find_agent(t)
        m = re.search(r"(?:quest:|task:|to\s+\w+\s+[:,]?\s*)(.+)$", t, re.IGNORECASE)
        task = m.group(1).strip(" .") if m else None
        return Intent(name="dispatch", slots={"agent": agent or "", "task": task}, raw=t)

    # status / report
    if re.search(r"\b(status|report|info|details|profile)\b", low):
        agent = _find_agent(t)
        return Intent(name="status", slots={"agent": agent or ""}, raw=t)

    # presence / who
    if re.search(r"\b(who(?:'s| is)?\s+online|presence|active|alive)\b", low):
        return Intent(name="presence", raw=t)

    # cron list / quests
    if re.search(r"\b(quests?|crons?|jobs|schedule)\b", low) and not re.search(r"\brun\b", low):
        return Intent(name="crons", raw=t)

    # run cron
    m = re.search(r"\brun\s+(?:quest|cron|job)\s+([a-zA-Z0-9_\-]+)", low)
    if m:
        return Intent(name="cron.run", slots={"cronId": m.group(1)}, raw=t)

    # snapshot
    if re.search(r"\b(snapshot|screenshot|capture)\b", low):
        return Intent(name="snapshot", raw=t)

    # theme
    if re.search(r"\b(shadow mode|dark mode|theme)\b", low):
        theme = "shadow" if "shadow" in low else "default"
        return Intent(name="theme", slots={"theme": theme}, raw=t)

    return Intent(name="unknown", raw=t, confidence=0.2)
