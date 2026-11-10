"""Jobs channel poster (workers/channel.py): which jobs, the message, never twice, rights respected."""
from datetime import datetime, timedelta, timezone

import pytest

from workers import channel as ch


@pytest.fixture
def jobs(migrator, source):
    """Approved source with alert rights; five published jobs (one old, one Kenya-only), one pending."""
    now = datetime.now(timezone.utc)
    with migrator.cursor() as cur:
        cur.execute("""INSERT INTO careers.source_rights (source_id, decision, reviewed_at, reviewer, fetch_allowed,
                         display_allowed, alert_allowed, attribution_text) VALUES (%s, 'approved', now(), 'owner', true, true, true, 'Job via Fixture')""", (source,))
        cur.execute("UPDATE careers.sources SET status = 'active' WHERE id = %s", (source,))
        rows = [("a", "Python Developer <Remote>", "Acme & Co", "published", "remote", ["GH", "NG"], now - timedelta(hours=1), [], "USD 2,000 / month"),
                ("b", "Sales Lead", "Moniepoint", "published", "onsite", ["NG"], now - timedelta(hours=3), ["Sales"], None),
                ("c", "AI Trainer (Twi)", "Welo", "published", "remote", ["GH"], now - timedelta(hours=4), [], None),
                ("d", "AI Trainer (Ewe)", "Welo", "published", "remote", ["GH"], now - timedelta(hours=5), [], None),
                ("e", "AI Trainer (Ga)", "Welo", "published", "remote", ["GH"], now - timedelta(hours=6), [], None),
                ("old", "Old Job", "Acme & Co", "published", "remote", ["GH"], now - timedelta(days=5), [], None),
                ("ke", "Kenya Only", "Acme & Co", "published", "remote", [], now - timedelta(hours=2), [], None),
                ("p", "Pending Job", "Acme & Co", "pending", "remote", ["GH"], now, [], None)]
        for eid, title, company, status, mode, countries, posted, cats, pay in rows:
            cur.execute("""INSERT INTO careers.jobs (origin, source_id, external_id, title, company_name, apply_url, work_mode,
                             status, posted_at, location_text, categories, salary_text)
                           VALUES ('feed', %s, %s, %s, %s, %s, %s, %s, %s, 'Lagos, Nigeria', %s, %s) RETURNING id""",
                        (source, eid, title, company, f"https://jobs.example/{eid}", mode, status, posted, cats, pay))
            jid = cur.fetchone()["id"]
            for cc in ("GH", "NG"):
                cur.execute("INSERT INTO careers.job_eligibility (job_id, country, state, evidence) VALUES (%s, %s, %s, %s)",
                            (jid, cc, "allowed" if cc in countries else "unknown", f"listed: {cc}"))
    migrator.commit()
    yield


def _poster_conn(worker):
    with worker.cursor() as cur:
        cur.execute("SET search_path TO careers, pg_temp")
    worker.commit()
    return worker


def test_posts_new_jobs_once_newest_first_two_per_company(worker, jobs):
    sent = []
    r = ch.post_once(_poster_conn(worker), lambda text: sent.append(text) or 777, "@techtrendijobs")
    assert r == {"posted": 4, "message_id": 777}
    text = sent[0]
    # newest first; Welo capped at 2; old, Kenya-only and pending jobs left out
    order = [t for t in ("Python Developer", "Sales Lead", "AI Trainer (Twi)", "AI Trainer (Ewe)") if t in text]
    assert order == ["Python Developer", "Sales Lead", "AI Trainer (Twi)", "AI Trainer (Ewe)"]
    assert text.index("Python Developer") < text.index("Sales Lead") < text.index("AI Trainer (Twi)")
    for absent in ("AI Trainer (Ga)", "Old Job", "Kenya Only", "Pending Job"):
        assert absent not in text
    # escaped, linked to the share page, tagged, with the scam warning
    assert "Python Developer &lt;Remote&gt;" in text and "Acme &amp; Co" in text and "<Remote>" not in text
    assert "https://techtrendi.com/careers/job/" in text and "jobs.example" not in text
    assert "#Python" in text and "#Sales" in text and "#AITraining" in text
    assert "🇬🇭🇳🇬" in text and "Never pay money" in text
    with worker.cursor() as cur:
        cur.execute("SELECT state, message_id, channel FROM careers.channel_posts")
        rows = cur.fetchall()
    assert len(rows) == 4 and all(r["state"] == "sent" and r["message_id"] == 777 and r["channel"] == "@techtrendijobs" for r in rows)
    # next run: only the job held back by the company cap
    sent.clear()
    assert ch.post_once(worker, lambda text: sent.append(text) or 778, "@techtrendijobs")["posted"] == 1
    assert "AI Trainer (Ga)" in sent[0]
    assert ch.post_once(worker, lambda text: 1 / 0, "@techtrendijobs") == {"posted": 0}     # nothing new: no call


def test_dry_run_records_nothing(worker, jobs, capsys):
    r = ch.post_once(_poster_conn(worker), lambda text: 1 / 0, "x", dry_run=True)
    assert r == {"posted": 0, "dry_run": 4} and "Python Developer" in capsys.readouterr().out
    with worker.cursor() as cur:
        cur.execute("SELECT count(*) AS n FROM careers.channel_posts")
        assert cur.fetchone()["n"] == 0


def test_failed_send_is_recorded_and_not_retried(worker, jobs):
    def boom(text):
        raise RuntimeError("Telegram said 400: chat not found")
    with pytest.raises(RuntimeError):
        ch.post_once(_poster_conn(worker), boom, "@wrong")
    with worker.cursor() as cur:
        cur.execute("SELECT DISTINCT state, error FROM careers.channel_posts")
        assert cur.fetchall() == [{"state": "failed", "error": "Telegram said 400: chat not found"}]
    worker.commit()
    assert ch.post_once(worker, lambda text: 5, "@techtrendijobs")["posted"] == 1     # only the held-back one


def test_no_alert_right_no_post(migrator, worker, jobs, source):
    with migrator.cursor() as cur:
        cur.execute("UPDATE careers.source_rights SET alert_allowed = false WHERE source_id = %s", (source,))
    migrator.commit()
    assert ch.post_once(_poster_conn(worker), lambda text: 1 / 0, "@techtrendijobs") == {"posted": 0}


def test_pick_and_message_shape():
    rows = [{"id": f"0000000{i}-0000-4000-8000-000000000000", "title": f"Job {i}", "company_name": c, "salary_text": None,
             "work_mode": "remote", "location_text": None, "open_to": ["GH"], "categories": []}
            for i, c in enumerate(["A", "a ", "A", "B", "C"])]
    assert [r["title"] for r in ch.pick(rows, n=3)] == ["Job 0", "Job 1", "Job 3"]
    msg = ch.build_message(ch.pick(rows), datetime(2026, 11, 10, 7, tzinfo=timezone.utc))
    assert msg.startswith("🆕 <b>New jobs open to people in Ghana and Nigeria</b>\n10 November 2026\n\n<b>1. Job 0</b>")
    assert len(msg) < 4096
