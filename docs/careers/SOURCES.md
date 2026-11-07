# Careers — source register

Every place jobs are collected from, why we may use it, and its rules. A source can only run in the
database when an approved rights record exists (migration 002); a job can only be shown while that
record allows display (migration 005). This file is the evidence those records point to.

Status key: **A** = approved by the owner, collecting · **B** = waiting for the source's permission · **✗** = not usable.

## Group A — approved by Edmund Adjekum (owner) on 7 Nov 2026 ("1 and 2 first", approving the list of 6 Nov)

| Key | Source | How we read it | Rules we follow | Checked |
|---|---|---|---|---|
| `himalayas` | Himalayas | Search API `himalayas.app/jobs/api/search?country=GH` and `=NG`, 20 a page, once a day, 1.5 s between requests | Show "Himalayas" credit with a link to himalayas.app; Apply goes to the API's `applicationLink`; **never** pass the jobs to other job boards, Google Jobs or LinkedIn Jobs, including through JobPosting structured data or feeds; drop jobs that leave the feed | [API docs](https://himalayas.app/docs/remote-jobs-api), 6 Nov 2026 |
| `jobicy` | Jobicy | `jobicy.com/api/jobs?geo=anywhere`, cursor pages, every 6 h | Credit Jobicy with a direct link; Apply goes to the Jobicy listing URL; never more than one pass an hour; never present the jobs as our own | [API docs](https://jobicy.com/jobs-rss-feed), 6 Nov 2026 |
| `weworkremotely` | We Work Remotely | Public RSS, every 6 h | Credit and link back to each listing | RSS checked 6 Nov 2026 (research note) |
| `remoteok` | Remote OK | `remoteok.com/api`, every 6 h | Link back to the Remote OK job URL as a normal (followed) link and name "Remote OK"; **never** use their logo | Legal notice inside the API response, 6 Nov 2026 |
| `remotive` | Remotive | `remotive.com/api/remote-jobs`, twice a day (limit is 4 calls a day) | Credit and link to Remotive; **never** submit the jobs to Google Jobs, LinkedIn, Jooble or other job sites | Legal notice inside the API response, 6 Nov 2026 |
| `greenhouse:moniepoint` | Moniepoint careers page | Greenhouse job board API, every 6 h | The employer's own public job list; Apply goes to their page | 6 Nov 2026 |
| `greenhouse:flyzipline` | Zipline careers page | Greenhouse job board API | as above | 6 Nov 2026 |
| `greenhouse:jumia` | Jumia careers page | Greenhouse job board API | as above | 6 Nov 2026 |
| `workable:fairmoney` | FairMoney careers page | Workable widget API | as above | 6 Nov 2026 |
| `workable:kuda` | Kuda careers page | Workable widget API | as above | 6 Nov 2026 |
| `ashby:m-kopa` | M-KOPA careers page | Ashby posting API | as above | 6 Nov 2026 |
| `lever:weloglobal` | Welo Global careers page | Lever postings API | as above | 6 Nov 2026 |

Rules for every Group A source (D-007, D-025):
- Only jobs whose own words show they are open to Ghana or Nigeria are kept ("remote" alone is not enough).
- Only a short summary is stored, never the full description.
- These jobs appear as short cards with the source credit and link, **noindex**, out of the sitemap, and **without
  JobPosting structured data** (Himalayas and Remotive forbid it; we apply it to all feeds).
- Jobs that pass every check go live by themselves (`auto_publish` on, owner 7 Nov 2026); jobs with scam signs or
  conflicting eligibility wait for the owner.
- "Latest jobs" feeds (Jobicy, We Work Remotely, Remote OK, Remotive) show only recent jobs, so a job leaving the
  feed is not treated as closed; those jobs close on their own date (or 30 days after posting).

## Group B — permission being requested by the owner (drafts given to him 7 Nov 2026; not kept in this public repo)

| Source | Why | What we asked for |
|---|---|---|
| ReliefWeb (UN OCHA) | UN and NGO jobs in Ghana and Nigeria | An API appname, through ReliefWeb's own form |
| Jobweb Ghana | Local Ghana jobs | Permission to show short attributed cards linking back |
| MyJobMag | Local Nigeria (and Ghana) jobs | Use of their feeds with credit and link back |
| OpenTrain AI | AI-training work | Permission or a feed; their API is closed to automated readers by robots.txt |
| Careerjet | Ghana and Nigeria job search | A publisher account (their standard partner programme) |
| Jobberman | Largest Ghana board; terms forbid copying without written approval | Written approval or a partnership |

## Not usable
LinkedIn, Indeed, Glassdoor (no permission) · Adzuna (no Ghana/Nigeria) · Jobgether (re-posts other sites) ·
Arbeitnow (Germany only) · Google (no job-search access) · Ghana Public Services Commission feed (last post Sept 2024).
