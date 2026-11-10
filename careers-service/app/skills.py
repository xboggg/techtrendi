"""Skills: the fixed list behind the board's skill filter, the card tags and the channel hashtags."""
from __future__ import annotations

import re

# Skills (owner request 9 Nov 2026), matched on the job's title and the source's categories only:
# feed summaries open with the company's own blurb ("Canonical is a cloud company…"), which put
# sales jobs under Cloud. Patterns are PostgreSQL regexes (\m \M = word edges) and fixed here;
# nothing the reader sends is ever used as a pattern. Order = order shown when counts are equal.
SKILLS = {
    "ai_training": r"annotat|label(l)?ing|\mai (trainer|tutor|training|rater)|rlhf|\mraters?\M|\mevaluators?\M",
    "ai": r"machine learning|\mml\M|\mllms?\M|deep learning|artificial intelligence|\mai (engineer|research|scientist|developer)|generative ai|genai|\mnlp\M",
    "python": r"\mpython\M",
    "web": r"javascript|typescript|\mreact\M|node\.?js|front-?end|full-?stack|\mphp\M|laravel|web develop",
    "mobile": r"\mandroid\M|\mios\M|flutter|react native|kotlin|\mswift\M|mobile (app|develop|engineer)",
    "data_analysis": r"data analy|analytics|power ?bi|tableau|business intelligence",
    "cloud": r"\maws\M|azure|\mgcp\M|cloud|devops|kubernetes|docker|\msre\M",
    "security": r"cyber|security (engineer|analyst|operations)|infosec|penetration|\msoc\M|information security",
    "design": r"\mux\M|\mui\M|user experience|figma|graphic|photoshop|illustrat|canva|product design|\mdesigners?\M",
    "video": r"video|photo|motion graphic|\mvfx\M|animat",
    "writing": r"copywrit|content (writ|creat|strateg|market)|\mwriters?\M|\mblog|\meditors?\M|proofread",
    "translation": r"translat|locali[sz]|interpret|bilingual|linguist|transcri",
    "french": r"\mfrench\M|francophone",
    "social": r"social media|\mseo\M|\msem\M|google ads|\mppc\M|digital marketing|performance marketing|community manag",
    # Not the "Sales and Marketing" category alone (a Marketing Designer is not a sales job).
    "sales": r"\msales\M(?! (and|&) marketing)|business development|account executive|\mbdr\M|\msdr\M|telesales",
    "support": r"customer (service|support|success|care|experience)|call cent|help ?desk|client (service|support)",
    "recruiting": r"recruit|talent acqui|human resources|\mhr\M|people (ops|operations|partner)",
    "accounting": r"account(ing|ant)|bookkeep|\mtax\M|\maudit|payroll|\mifrs\M",
    "project": r"project manag|program(me)? manag|scrum|agile|product manag",
    "assistant": r"virtual assistant|executive assistant|administrative|admin(istrative)? assistant|data entry|office manag",
    "teaching": r"\mteach|tutor|instructor|lecturer|curriculum",
    "health": r"\mnurs|medical|clinic|pharma|healthcare|physician|doctor|\mmidwi|caregiv",
    "logistics": r"logistic|supply chain|warehouse|procure|dispatch|\mdrivers?\M|fleet",
}
SKILL_TEXT = "(title || ' | ' || array_to_string(categories, ' '))"
# The same patterns for the card's skill tags and the counts, in Python's dialect (word edges are \b).
SKILL_RES = {k: re.compile(v.replace(r"\m", r"\b").replace(r"\M", r"\b"), re.IGNORECASE) for k, v in SKILLS.items()}


def job_skills(title: str, categories: list[str]) -> list[str]:
    text = f"{title} | {' '.join(categories)}"
    return [k for k, rx in SKILL_RES.items() if rx.search(text)]


# Telegram hashtags for the jobs channel, so readers can tap one to see every job with that skill.
SKILL_TAGS = {
    "ai_training": "AITraining", "ai": "AI", "python": "Python", "web": "WebDev", "mobile": "MobileApps",
    "data_analysis": "DataAnalysis", "cloud": "Cloud", "security": "Cybersecurity", "design": "Design",
    "video": "Video", "writing": "Writing", "translation": "Translation", "french": "French",
    "social": "SocialMedia", "sales": "Sales", "support": "CustomerSupport", "recruiting": "HR",
    "accounting": "Accounting", "project": "ProjectManagement", "assistant": "VirtualAssistant",
    "teaching": "Teaching", "health": "Health", "logistics": "Logistics",
}
