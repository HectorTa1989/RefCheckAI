"""Getting a real CALL-E result all the way onto the recruiter's screen.

Three things a webhook-only happy path never exercised:
  * results reach the app when CALL-E has no public URL to post to (sync),
  * the stored answers are the shape the API response model validates,
  * the create request the real SDK sends omits a webhook CALL-E cannot reach.
"""
import json
import uuid

import httpx
import pytest
from fastapi.testclient import TestClient

from calle import CalleClient
from conftest import full_result, make_call
from test_calle_webhook import FakeCalle, FakeDB, FakeTable, event, post

import api.calle_webhook as hook
import api.candidates as candidates_api
import services.calle_service as svc
from models.schemas import AnswerItem, ReferenceOut


# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def db(monkeypatch):
    fake = FakeDB()
    fake.tables["references"] = FakeTable(
        [{"id": "ref-1", "candidate_id": "cand-1", "call_status": "calling",
          "calle_call_sid": "call_abc123"}]
    )
    monkeypatch.setattr(hook, "db", lambda: fake)
    monkeypatch.setattr(candidates_api, "db", lambda: fake)
    return fake


@pytest.fixture
def emails(monkeypatch):
    sent = []
    monkeypatch.setattr(hook, "send_check_complete_email", lambda **kw: sent.append(kw))
    return sent


def install_calle(monkeypatch, call=None, raises=None):
    client = FakeCalle(call=call, raises=raises)
    monkeypatch.setattr(hook, "get_calle", lambda: client)
    return client


@pytest.fixture
def client(db, emails):
    import main

    return TestClient(main.app)


def sync(client, user="rec-1"):
    headers = {"X-User-Id": user} if user else {}
    return client.post("/api/candidates/cand-1/sync", headers=headers)


# ── Sync ────────────────────────────────────────────────────────────────────

class TestSync:
    def test_pulls_a_finished_call_and_completes_the_check(self, client, db, emails, monkeypatch):
        fetched = install_calle(monkeypatch, make_call(structured_result=full_result()))
        r = sync(client)
        assert r.status_code == 200
        body = r.json()
        assert body["updated"] == ["ref-1"] and body["finalized"] is True
        assert fetched.fetched == ["call_abc123"]
        ref = db.tables["references"].rows[0]
        assert ref["call_status"] == "completed"
        assert ref["answers"]["q_rehire"] == {"text": "Absolutely, first call I make.", "score": 5}
        assert db.tables["candidates"].rows[0]["status"] == "complete"
        assert len(emails) == 1

    def test_a_call_still_running_is_left_pending(self, client, db, monkeypatch):
        install_calle(monkeypatch, make_call(status="in_progress", structured_result=None))
        body = sync(client).json()
        assert body["pending"] == ["ref-1"] and body["updated"] == []
        assert db.tables["references"].rows[0]["call_status"] == "calling"
        assert body["finalized"] is False

    def test_a_call_for_another_reference_is_refused(self, client, db, monkeypatch):
        """The snapshot must name this reference — a wrong sid never writes a result."""
        install_calle(monkeypatch, make_call(structured_result=full_result(), reference_id="ref-9"))
        body = sync(client).json()
        assert body["errors"] == ["ref-1"] and body["updated"] == []
        assert db.tables["references"].updates == []

    def test_an_api_failure_is_reported_not_raised(self, client, monkeypatch):
        install_calle(monkeypatch, raises=RuntimeError("upstream down"))
        r = sync(client)
        assert r.status_code == 200 and r.json()["errors"] == ["ref-1"]

    def test_references_already_terminal_are_not_refetched(self, client, db, monkeypatch):
        db.tables["references"].rows[0]["call_status"] = "completed"
        fetched = install_calle(monkeypatch, make_call(structured_result=full_result()))
        sync(client)
        assert fetched.fetched == []

    def test_requires_the_owning_recruiter(self, client, monkeypatch):
        install_calle(monkeypatch, make_call(structured_result=full_result()))
        assert sync(client, user=None).status_code == 401
        assert sync(client, user="someone-else").status_code == 404

    def test_webhook_after_sync_does_not_notify_twice(self, client, emails, monkeypatch):
        """Both paths can see the last reference land; only one may send the email."""
        install_calle(monkeypatch, make_call(structured_result=full_result()))
        sync(client)
        assert post(client, event()).status_code == 200
        assert len(emails) == 1


# ── What the API returns ────────────────────────────────────────────────────

def reference_row(answers):
    return {
        "id": str(uuid.uuid4()), "candidate_id": str(uuid.uuid4()),
        "referee_name": "James Okafor", "referee_phone": "+14155550142",
        "referee_email": None, "relationship": "Former direct manager",
        "company_at_time": None, "call_status": "completed", "calle_call_sid": "call_abc123",
        "transcript": "Agent: Is this James?\nReferee: Speaking.", "answers": answers,
        "red_flags": [], "strengths": [], "notable_quotes": [],
        "referee_enthusiasm": "very_enthusiastic", "overall_reference_score": 9.4,
        "would_rehire": True, "call_duration_seconds": 480, "call_outcome": "completed",
        "spoke_with_referee": True, "summary": "Strong.", "completed_at": None,
        "created_at": "2026-09-11T10:00:00Z",
    }


class TestResponseShape:
    def test_stored_answers_validate(self):
        ref = ReferenceOut.model_validate(reference_row({"q_fit": {"text": "Strong fit.", "score": 5}}))
        assert ref.answers["q_fit"].score == 5

    def test_raw_calle_answers_still_validate(self):
        """Rows persisted before normalisation must not 500 the check page."""
        ref = ReferenceOut.model_validate(
            reference_row({
                "q_fit": {"response": "Strong fit.", "rating": "5"},
                "q_rehire": {"response": "", "rating": "not_answered"},
            })
        )
        assert ref.answers["q_fit"] == AnswerItem(text="Strong fit.", score=5)
        assert ref.answers["q_rehire"].score is None

    def test_not_answered_is_null_not_a_middle_score(self):
        assert svc.normalize_answer({"response": "", "rating": "not_answered"}) == {"text": "", "score": None}

    def test_scoring_reads_stored_answers_too(self):
        stored = svc.normalize_answers(full_result()["answers"])
        raw = full_result()["answers"]
        assert svc.compute_reference_score(stored, "very_enthusiastic") == svc.compute_reference_score(
            raw, "very_enthusiastic"
        )


# ── What is sent to CALL-E ──────────────────────────────────────────────────

class TestCreateRequest:
    def dispatch(self, monkeypatch, api_url, reference, candidate, questions):
        seen = {}

        def handler(request: httpx.Request) -> httpx.Response:
            seen["body"] = json.loads(request.content)
            seen["headers"] = request.headers
            return httpx.Response(201, json={"id": "call_new", "status": "queued"})

        real = CalleClient(
            api_key="iams_test_placeholder",
            http_client=httpx.Client(base_url="https://api.heycall-e.com",
                                     transport=httpx.MockTransport(handler)),
        )
        monkeypatch.setattr(svc, "get_calle", lambda: real)
        monkeypatch.setattr(svc.settings, "api_url", api_url)
        monkeypatch.setattr(svc.settings, "calle_dial_allowlist", "")
        result = svc.dispatch_reference_call(reference, candidate, questions)
        return result, seen

    def test_local_backend_registers_no_webhook(self, monkeypatch, reference, candidate, questions):
        """CALL-E only posts to public HTTPS; a localhost URL would never arrive."""
        result, seen = self.dispatch(monkeypatch, "http://localhost:8000", reference, candidate, questions)
        assert result == {"call_id": "call_new", "error": None}
        assert "webhook_url" not in seen["body"]

    def test_public_backend_registers_the_secret_webhook(self, monkeypatch, reference, candidate, questions):
        _, seen = self.dispatch(monkeypatch, "https://api.refcheck.example", reference, candidate, questions)
        assert seen["body"]["webhook_url"].startswith("https://api.refcheck.example/api/calle/webhook/")

    def test_request_carries_schema_metadata_and_idempotency(self, monkeypatch, reference, candidate, questions):
        _, seen = self.dispatch(monkeypatch, "http://localhost:8000", reference, candidate, questions)
        body = seen["body"]
        assert body["recipients"] == [{"phones": ["+14155550142"]}]
        assert body["metadata"] == {"reference_id": "ref-1", "candidate_id": "cand-1"}
        assert set(body["result_schema"]["properties"]["answers"]["required"]) == {q["id"] for q in questions}
        assert seen["headers"]["Idempotency-Key"] == "refcheck_ref_ref-1"
