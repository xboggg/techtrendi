"""Migration 007 facet rules, on category names and titles seen on staging (8 Nov 2026)."""
import pytest

FIELDS = [
    # (title, categories, expected area of work)
    ("Engineering Manager [AI Platform]", ["Developer"], "tech"),
    ("Sales Engineer", ["Sales"], "sales"),
    ("Anything", ["Data Science"], "data"),
    ("Anything", ["Customer Service"], "support"),
    ("Anything", ["Content Creator"], "writing"),
    ("Anything", ["Human Resources"], "hr"),
    ("Anything", ["Web, UI & UX Design"], "design"),
    ("Anything", ["Product"], "tech"),
    ("Anything", ["Sales and Marketing"], "sales"),
    ("Anything", ["Management and Finance"], "finance"),
    ("Anything", ["Warehouse and Logistics"], "ops"),
    ("Anything", ["Legal"], "other"),
    ("Hindi Voice Actor - Freelance AI Trainer Project", [], "writing"),
    ("AWS Trainium/NKI (TRN) AI Task Auditor - Freelance AI Trainer Project", [], "data"),
    ("Fraud Investigation Officer", [], "finance"),
    ("Insurance Underwriter", [], "finance"),            # "writ" inside a word is not writing work
    ("Recruiting Operations Analyst", [], "hr"),
    ("Warehouse Operator- Kaduna State, Nigeria", [], "ops"),
    ("Site Reliability Engineering Manager", [], "tech"),
    ("Sound Designer, AIVERA GLOBAL", [], "design"),
    ("Collections Agent", [], "finance"),
    ("Junior Dispatcher (Remote) | USA Trucking", [], "ops"),
    ("Business Relationship Manager (Bauchi)", [], "sales"),
    ("Family Medicine Hospitalist", [], "other"),
]

TYPES = [("Full Time", "full_time"), ("FullTime", "full_time"), ("full_time", "full_time"), ("Part Time", "part_time"),
         ("Contractor", "contract"), ("Freelance-Remote", "contract"), ("Temporary", "contract"), ("Intern", "internship"),
         ("Volunteer", "volunteer"), ("Remote", None), (None, None)]

LEVELS = [("Senior Search Lead - Technology", None, "senior"), ("Sr. Backend Engineer", None, "senior"),
          ("Head of Data & Analytics", None, "senior"), ("Graduate Trainee Manager", None, "entry"),
          ("Junior Designer", None, "entry"), ("Data Annotator", "Intern", "entry"), ("Tax Associate", None, "mid"),
          ("Team Leader", None, "mid"), ("Language Alignment & Resource Partner (Amharic)", None, "mid")]


@pytest.fixture
def q(migrator):
    def run(sql, *args):
        with migrator.cursor() as cur:
            cur.execute(sql, args)
            return list(cur.fetchone().values())[0]
    return run


@pytest.mark.parametrize("title,cats,want", FIELDS)
def test_area_of_work(q, title, cats, want):
    assert q("SELECT careers.job_field(%s, %s::text[]) AS v", title, cats) == want


@pytest.mark.parametrize("emp,want", TYPES)
def test_job_type(q, emp, want):
    assert q("SELECT careers.job_type(%s) AS v", emp) == want


@pytest.mark.parametrize("title,emp,want", LEVELS)
def test_level(q, title, emp, want):
    assert q("SELECT careers.job_level(%s, %s) AS v", title, emp) == want
