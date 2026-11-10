"""Guardrails: check every agent output before anything downstream trusts it.

The schema check is deliberately small. It covers the subset of JSON Schema
the agents use, with no third-party dependency, so a reader can see exactly
what is enforced.
"""

from __future__ import annotations

from typing import Any

_TYPES = {
    "object": dict,
    "array": list,
    "string": str,
    "boolean": bool,
    "integer": int,
    "number": (int, float),
}


class GuardrailViolation(ValueError):
    pass


def validate(data: Any, schema: dict[str, Any], path: str = "$") -> None:
    """Raise ``GuardrailViolation`` if ``data`` does not match ``schema``."""
    expected = schema.get("type")
    if expected:
        py_type = _TYPES[expected]
        is_bool = isinstance(data, bool)
        if not isinstance(data, py_type) or (is_bool and expected in ("integer", "number")):
            raise GuardrailViolation(f"{path}: expected {expected}, got {type(data).__name__}")

    if "enum" in schema and data not in schema["enum"]:
        raise GuardrailViolation(f"{path}: {data!r} not in {schema['enum']}")

    if isinstance(data, (int, float)) and not isinstance(data, bool):
        if "minimum" in schema and data < schema["minimum"]:
            raise GuardrailViolation(f"{path}: {data} below minimum {schema['minimum']}")
        if "maximum" in schema and data > schema["maximum"]:
            raise GuardrailViolation(f"{path}: {data} above maximum {schema['maximum']}")

    if isinstance(data, dict):
        props = schema.get("properties", {})
        for key in schema.get("required", []):
            if key not in data:
                raise GuardrailViolation(f"{path}: missing required field {key!r}")
        if schema.get("additionalProperties") is False:
            extra = set(data) - set(props)
            if extra:
                raise GuardrailViolation(f"{path}: unexpected fields {sorted(extra)}")
        for key, value in data.items():
            if key in props:
                validate(value, props[key], f"{path}.{key}")

    if isinstance(data, list) and "items" in schema:
        for i, item in enumerate(data):
            validate(item, schema["items"], f"{path}[{i}]")


def check_references(ids: list[str], allowed: set[str], what: str) -> list[str]:
    """Return the ids that are not in ``allowed``.

    Agents may only cite things that exist. A cited control that is not in the
    library is an invented control, which is the most dangerous failure here.
    """
    return [i for i in ids if i not in allowed]


def needs_human(confidence: float, threshold: float) -> bool:
    return confidence < threshold
