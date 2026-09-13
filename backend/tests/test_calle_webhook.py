"""The webhook trust boundary.

CALL-E does not sign webhooks, so these tests pin the three things that stand in
for a signature: the secret path, the event-id check, and the independent
re-fetch of the call from the API before any side effect.
"""
import pytest
from fastapi.testclient import TestClient

from conftest import full_result, make_call

import api.calle_webhook as hook

TOKEN = "test-token"
EVENT_ID = "evt_123"


# ── Minimal stand-ins for Supabase and the CALL-E client ─────────────────────

class FakeQuery:
    """Filters narrow `_rows`; update/delete apply at execute(), as in supabase-py."""

    def __init__(self, table):
        self.table = table
        self._rows = list(table.rows)
        self._patch = None
        self._delete = False
        self._single = False

    def select(self, *_a, **_k):
        return self

    def order(self, *_a, **_k):
        return self

    def eq(self, field, value):
        self._rows = [r for r in self._rows if str(r.get(field)) == str(value)]
        return self

    def neq(self, field, value):
        self._rows = [r for r in self._rows if str(r.get(field)) != str(value)]
        return self

    def insert(self, row):
        key = self.table.unique_on
        if key and any(r.get(key) == row.get(key) for r in self.table.rows):
            raise RuntimeError("duplicate key value violates unique constraint")
        self.table.rows.append(dict(row))
        self._rows = [row]
        return self

    def update(self, patch):
        self._patch = patch
        return self

    def delete(self):
        self._delete = True
        return self

    def single(self):
        self._single = True
        return self

    def execute(self):
        if self._patch is not None:
            self.table.updates.append(self._patch)
            for r in self._rows:
                r.update(self._patch)
        if self._delete:
            for r in self._rows:
                if r in self.table.rows:
                    self.table.rows.remove(r)
        # supabase-py returns one object (not a list) for .single()
        data = (self._rows[0] if self._rows else None) if self._single else self._rows
        return type("Res", (), {"data": data})()


class FakeTable:
    def __init__(self, rows=None, unique_on=None):
        self.rows = rows or []
        self.updates = []
        self.unique_on = unique_on


class FakeDB:
    def __init__(self):
        self.tables = {
            "calle_webhook_events": FakeTable(unique_on="event_id"),
            "references": FakeTable(
                [{"id": "ref-1", "candidate_id": "cand-1", "call_status": "calling"}]
            ),
            "candidates": FakeTable(
                [{"id": "cand-1", "recruiter_id": "rec-1", "name": "Maria Chen",
                  "role_applied_for": "Senior Software Engineer", "profiles": {"email": "r@x.io"}}]
            ),
            "audit_log": FakeTable(),
        }

    def table(self, name):
        return FakeQuery(self.tables.setdefault(name, FakeTable()))


class FakeCalle:
    """Stands in for CalleClient; records what was fetched."""

    def __init__(self, call=None, raises=None):
        self.calls = self
        self._call = call
        self._raises = raises
        self.fetched = []

    def get(self, call_id):
        self.fetched.append(call_id)
        if self._raises:
            raise self._raises
        return self._call


@pytest.fixture
def db(monkeypatch):
    fake = FakeDB()
    monkeypatch.setattr(hook, "db", lambda: fake)
    return fake


@pytest.fixture
def calle(monkeypatch):
    holder = {}

    def install(call=None, raises=None):
        client = FakeCalle(call=call, raises=raises)
        holder["client"] = client
        monkeypatch.setattr(hook, "get_calle", lambda: client)
        return client

    install(make_call(structured_result=full_result()))
    return type(
        "C",
        (),
        {"install": staticmethod(install), "get": staticmethod(lambda: holder["client"])},
    )()


@pytest.fixture
def client(db, calle, monkeypatch):
    monkeypatch.setattr(hook, "send_check_complete_email", lambda **_: None)
    import main

    return TestClient(main.app)


def event(event_id=EVENT_ID, type_="call.completed", call_id="call_abc123"):
    return {
        "id": event_id,
        "type": type_,
        "created_at": "2026-06-08T18:30:00Z",
        "data": {"id": call_id, "status": "completed"},
    }


def post(client, body, *, token=TOKEN, event_id=EVENT_ID):
    headers = {"CALL-E-Event-Id": event_id} if event_id is not None else {}
    return client.post(f"/api/calle/webhook/{token}", json=body, headers=headers)


class TestTrustBoundary:
    def test_wrong_path_token_is_not_found(self, client):
        assert post(client, event(), token="guessed").status_code == 404

    def test_missing_event_id_header_is_rejected(self, client):
        assert post(client, event(), event_id=None).status_code == 400

    def test_event_id_header_must_match_the_body(self, client):
        """A forged body cannot be laundered through a valid header."""
        assert post(client, event(event_id="evt_other")).status_code == 400

    def test_malformed_json_is_rejected(self, client):
        r = client.post(
            f"/api/calle/webhook/{TOKEN}",
            content=b"{not json",
            headers={"CALL-E-Event-Id": EVENT_ID, "Content-Type": "application/json"},
        )
        assert r.status_code == 400

    def test_body_is_never_trusted_the_call_is_refetched(self, client, calle):
        """The posted payload is only a notification; state comes from the API."""
        post(client, event())
        assert calle.get().fetched == ["call_abc123"]

    def test_forged_payload_cannot_write_a_score(self, client, db, calle):
        """A caller who guesses the URL still cannot inject results."""
        forged = event()
        forged["data"]["structured_result"] = full_result(referee_enthusiasm="negative")
        post(client, forged)
        # Persisted values come from the API snapshot, not the forged body.
        update = db.tables["references"].updates[-1]
        assert update["referee_enthusiasm"] == "very_enthusiastic"


class TestDelivery:
    def test_happy_path_persists_the_result(self, client, db):
        r = post(client, event())
        assert r.status_code == 200
        update = db.tables["references"].updates[0]
        assert update["call_status"] == "completed"
        assert update["would_rehire"] is True
        assert update["overall_reference_score"] > 9
        assert update["calle_call_sid"] == "call_abc123"
        assert update["calle_provider_call_id"] == "provider_001"
        assert "Agent: Is this James?" in update["transcript"]

    def test_duplicate_delivery_is_ignored(self, client, db):
        """Delivery is at-least-once; the second one must not double-write."""
        assert post(client, event()).status_code == 200
        second = post(client, event())
        assert second.status_code == 200
        assert second.json()["duplicate"] is True
        assert len(db.tables["references"].updates) == 1

    def test_non_terminal_event_is_acked_not_retried(self, client):
        r = post(client, event(type_="call.started"))
        assert r.status_code == 200 and r.json()["ignored"] == "call.started"

    def test_api_failure_returns_5xx_so_calle_retries(self, client, calle):
        calle.install(raises=RuntimeError("upstream down"))
        assert post(client, event()).status_code == 502

    def test_a_retry_after_api_failure_is_not_swallowed_as_duplicate(self, client, calle, db):
        """The event claim must be released when verification fails."""
        calle.install(raises=RuntimeError("upstream down"))
        assert post(client, event()).status_code == 502
        calle.install(make_call(structured_result=full_result()))
        assert post(client, event()).status_code == 200
        assert len(db.tables["references"].updates) == 1

    def test_unknown_reference_is_acked_not_errored(self, client, calle):
        calle.install(make_call(structured_result=full_result(), reference_id="ref-gone"))
        r = post(client, event())
        assert r.status_code == 200 and "unknown reference" in r.json()["ignored"]


class TestResultHandling:
    def test_failed_call_is_not_guessed_as_no_answer_or_declined(self, client, db, calle):
        """The Calls API does not publish no-answer/decline codes — do not invent them."""
        calle.install(make_call(status="failed", structured_result=None))
        post(client, event(type_="call.failed"))
        update = db.tables["references"].updates[0]
        assert update["call_status"] == "failed"
        assert update["call_status"] not in ("no_answer", "declined")

    def test_null_structured_result_does_not_crash(self, client, db, calle):
        calle.install(make_call(structured_result=None))
        assert post(client, event()).status_code == 200
        assert db.tables["references"].updates[0]["overall_reference_score"] is None

    def test_policy_limited_reference_is_recorded_as_completed(self, client, db, calle):
        calle.install(
            make_call(
                structured_result=full_result(
                    call_outcome="only_confirmed_employment",
                    referee_enthusiasm="neutral",
                )
            )
        )
        post(client, event())
        update = db.tables["references"].updates[0]
        assert update["call_status"] == "completed"
        assert update["call_outcome"] == "only_confirmed_employment"

    def test_declined_reference_maps_to_declined(self, client, db, calle):
        calle.install(make_call(structured_result=full_result(call_outcome="declined")))
        post(client, event())
        assert db.tables["references"].updates[0]["call_status"] == "declined"

    def test_finalises_the_candidate_once_every_reference_is_terminal(self, client, db):
        post(client, event())
        final = db.tables["candidates"].updates
        assert final and final[-1]["status"] == "complete"
        assert final[-1]["recommendation"] == "strong_yes"

    def test_answers_are_stored_in_the_shape_the_api_reads(self, client, db):
        """CALL-E returns {response, rating}; the API, UI and PDF read {text, score}."""
        post(client, event())
        answers = db.tables["references"].updates[0]["answers"]
        assert answers["q_strengths"] == {"text": "Owned the payments migration.", "score": 5}

    def test_a_second_terminal_event_does_not_email_twice(self, client, monkeypatch):
        """A distinct event id for an already-finalised check must not re-notify."""
        sent = []
        monkeypatch.setattr(hook, "send_check_complete_email", lambda **kw: sent.append(kw))
        post(client, event(event_id="evt_first"), event_id="evt_first")
        post(client, event(event_id="evt_second"), event_id="evt_second")
        assert len(sent) == 1
