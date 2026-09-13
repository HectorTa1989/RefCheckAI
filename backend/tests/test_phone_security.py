"""Destination validation, dial allowlist, masking, and origin pinning."""
import pytest
from pydantic import ValidationError

from models.schemas import ReferenceCreate
from services.phone import (
    DestinationError,
    assert_authorized,
    mask,
    mask_all,
    normalize_e164,
    parse_user_phone,
)

GOOD = "+15555550142"


class TestApiBoundary:
    def test_valid_number_is_accepted(self):
        assert ReferenceCreate(
            referee_name="Jordan", referee_phone=GOOD, relationship="Manager"
        ).referee_phone == GOOD

    def test_formatted_input_is_normalized_not_rejected(self):
        """The wizard accepts what a recruiter would paste."""
        assert ReferenceCreate(
            referee_name="Jordan", referee_phone="+1 (555) 555-0142", relationship="Manager"
        ).referee_phone == GOOD

    @pytest.mark.parametrize(
        "value",
        ["5555550142", "+1555555014a", "+١٥٥٥٥٥٥٠١٤٢", ""],
    )
    def test_bad_numbers_are_rejected_at_the_api_boundary(self, value):
        with pytest.raises(ValidationError):
            ReferenceCreate(
                referee_name="Jordan", referee_phone=value, relationship="Manager"
            )


class TestUserTypedInput:
    """Recruiters paste formatted numbers; stripping ASCII punctuation is safe."""

    @pytest.mark.parametrize(
        "typed",
        ["+1 (555) 555-0142", "+1-555-555-0142", " +15555550142 ", "+1.555.555.0142"],
    )
    def test_formatting_is_stripped(self, typed):
        assert parse_user_phone(typed) == GOOD

    @pytest.mark.parametrize("typed", ["+١٥٥٥٥٥٥٠١٤٢", "5555550142", "+1555a550142"])
    def test_confusables_and_malformed_still_refused(self, typed):
        """Punctuation stripping must not become a laundering path."""
        with pytest.raises(DestinationError):
            parse_user_phone(typed)


class TestAllowlist:
    def test_unset_allowlist_permits_any_valid_number(self):
        """Production: recruiters supply referee numbers and assert consent."""
        assert assert_authorized(GOOD, None) == GOOD

    def test_configured_allowlist_is_enforced(self):
        with pytest.raises(DestinationError):
            assert_authorized(GOOD, ["+15555550188"])
        assert assert_authorized(GOOD, [GOOD]) == GOOD

    def test_refusal_does_not_leak_the_full_number(self):
        with pytest.raises(DestinationError) as exc:
            assert_authorized(GOOD, ["+15555550188"])
        assert GOOD not in str(exc.value)


class TestMasking:
    def test_never_returns_the_full_number(self):
        assert mask(GOOD) == "+1******0142"
        assert GOOD not in mask(GOOD)

    def test_mask_all_redacts_numbers_in_free_text(self):
        assert GOOD not in mask_all(f"dialing {GOOD} now")


class TestOriginPinning:
    @pytest.mark.parametrize(
        "value",
        [
            "http://api.heycall-e.com",
            "https://api.heycall-e.com.evil.example",
            "https://evil.example",
            "https://user:pass@api.heycall-e.com",
            "https://api.heycall-e.com/v1",
        ],
    )
    def test_hostile_base_urls_are_refused(self, value, monkeypatch):
        from db.client import Settings
        monkeypatch.setenv("CALLE_BASE_URL", value)
        with pytest.raises(Exception):
            Settings(_env_file=None)

    def test_official_origin_is_accepted(self, monkeypatch):
        from db.client import Settings
        monkeypatch.setenv("CALLE_BASE_URL", "https://api.heycall-e.com/")
        assert Settings(_env_file=None).calle_base_url == "https://api.heycall-e.com"
