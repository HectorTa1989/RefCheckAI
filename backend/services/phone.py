"""Destination validation, operator authorization, and masking.

Three separate jobs, deliberately kept apart:

* `normalize_e164` decides whether a string is a phone number we are willing to
  dial at all. It is strict about ASCII: a number containing Arabic-Indic or
  fullwidth digits is rejected rather than transliterated, because a confusable
  digit is a *different destination*, and silently "fixing" it would dial
  someone who was never authorized.
* `assert_authorized` applies the optional dial allowlist. Unlike the CLI tool,
  the web app takes referee numbers from recruiters at runtime, so an allowlist
  cannot be mandatory in production. When `CALLE_DIAL_ALLOWLIST` is set it is
  enforced strictly — set it in every non-production environment so a staging
  deploy pointed at real data cannot dial real people.
* `mask` decides what a human is allowed to read back. Applied to preview and
  live output alike, so a terminal recording or a CI log never carries a full
  referee number.
"""
from __future__ import annotations

import os
import re

# E.164: '+', a non-zero country digit, then 7-14 more digits. ASCII only.
E164 = re.compile(r"^\+[1-9][0-9]{7,14}$")

ALLOWLIST_ENV = "CALLE_DIAL_ALLOWLIST"


class DestinationError(ValueError):
    """The number is malformed, non-ASCII, or not operator-authorized."""


def normalize_e164(raw: str) -> str:
    """Return `raw` as a validated ASCII E.164 number, or raise.

    Whitespace around the value is stripped; nothing inside it is. In
    particular no separators are removed and no digits are transliterated —
    if it is not already E.164, it is rejected.
    """
    if not isinstance(raw, str):
        raise DestinationError("Phone number must be a string.")

    value = raw.strip()
    if not value:
        raise DestinationError("Phone number is empty.")

    if not value.isascii():
        offenders = sorted({c for c in value if not c.isascii()})
        raise DestinationError(
            "Phone number must be ASCII E.164. Refusing to transliterate "
            f"non-ASCII character(s): {offenders!r}. A confusable digit is a "
            "different destination."
        )

    if not E164.match(value):
        raise DestinationError(
            f"Phone number {mask(value)!r} is not valid E.164. Expected a "
            "leading '+', a country code starting 1-9, and 8-15 digits total, "
            "with no spaces, hyphens, or parentheses."
        )
    return value


def allowlist(env: str | None = None) -> list[str]:
    """Operator-authorized destinations, from `REFCHECK_ALLOWED_DESTINATIONS`.

    Comma-separated E.164 values. Unset or empty authorizes nothing.
    """
    raw = os.environ.get(ALLOWLIST_ENV, "") if env is None else env
    entries = [item.strip() for item in raw.split(",")]
    return [normalize_e164(item) for item in entries if item]


def assert_authorized(phone: str, allowed: list[str] | None = None) -> str:
    """Validate `phone` and apply the dial allowlist when one is configured.

    Returns the normalized number. Raises `DestinationError` if the number is
    malformed, or if an allowlist is configured and does not contain it.
    """
    number = normalize_e164(phone)
    permitted = allowlist() if allowed is None else [normalize_e164(a) for a in allowed]

    if not permitted:
        # Unset means "no allowlist configured" — production behaviour, where
        # the recruiter supplies the number and asserts consent themselves.
        return number
    if number not in permitted:
        raise DestinationError(
            f"{mask(number)} is not in {ALLOWLIST_ENV}. Add it there if you are "
            "authorized to call it."
        )
    return number


def mask(phone: str) -> str:
    """Redact the subscriber digits, keeping enough to tell numbers apart.

    `+15555550142` -> `+1*******0142`. Never returns the full number, and is
    safe to call on values that failed validation.
    """
    if not isinstance(phone, str):
        return "<invalid>"
    value = phone.strip()
    if not value:
        return "<empty>"

    digits = [i for i, c in enumerate(value) if c.isdigit() or not c.isascii()]
    if len(digits) <= 5:
        # Too short to reveal a meaningful prefix; hide all of it.
        return value[0] + "*" * (len(value) - 1) if len(value) > 1 else "*"

    keep_head, keep_tail = digits[:1], digits[-4:]
    out = []
    for i, c in enumerate(value):
        if i in digits and i not in keep_head and i not in keep_tail:
            out.append("*")
        else:
            out.append(c)
    return "".join(out)


def mask_all(text: str) -> str:
    """Mask anything in `text` that looks like an E.164 number.

    Used on free text that may quote a destination back — error messages,
    transcript lines, task previews.
    """
    return re.sub(r"\+[1-9][0-9]{7,14}", lambda m: mask(m.group(0)), text)

# Characters people type into a phone field that carry no meaning in E.164.
_FORMATTING = str.maketrans("", "", " 	()-. /")


def parse_user_phone(raw: str) -> str:
    """Normalize a number a human typed into a form, then validate it strictly.

    Recruiters paste numbers as `+1 (555) 555-0142`. Stripping ASCII spacing and
    punctuation is safe and expected. Non-ASCII characters are still refused
    rather than transliterated — that check happens first, so a confusable digit
    can never be laundered through this function.
    """
    if not isinstance(raw, str):
        raise DestinationError("Phone number must be a string.")
    value = raw.strip()
    if value and not value.isascii():
        offenders = sorted({c for c in value if not c.isascii()})
        raise DestinationError(
            "Phone number must be ASCII E.164. Refusing to transliterate "
            f"non-ASCII character(s): {offenders!r}. A confusable digit is a "
            "different destination."
        )
    return normalize_e164(value.translate(_FORMATTING))
