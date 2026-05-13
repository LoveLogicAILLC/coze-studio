"""Markdown contract parser — extracts YAML frontmatter from CONTRACT.md files."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml

_FRONTMATTER_RE = re.compile(
    r"```yaml\s*\n---\n(.*?)\n---\s*\n```", re.DOTALL
)


def parse_contract(path: Path | str) -> dict[str, Any]:
    """Parse a CONTRACT.md file and return its YAML frontmatter as a dict.

    The expected format wraps the YAML block inside a fenced code block:

    .. code-block:: markdown

        ```yaml
        ---
        module:
          name: "example"
        ---
        ```
    """
    text = Path(path).read_text()
    match = _FRONTMATTER_RE.search(text)
    if not match:
        return {}
    raw = match.group(1)
    try:
        parsed = yaml.safe_load(raw) or {}
    except yaml.YAMLError:
        return {}
    if not isinstance(parsed, dict):
        return {}
    return parsed


def validate_contract_fields(data: dict[str, Any]) -> list[str]:
    """Validate required fields in parsed contract data."""
    errors: list[str] = []
    module = data.get("module", {})
    if not module.get("name"):
        errors.append("module.name is required")
    if not module.get("version"):
        errors.append("module.version is required")
    if not module.get("description"):
        errors.append("module.description is required")
    return errors
