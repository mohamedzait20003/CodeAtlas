---
id: targeting
title: Audience, role & ATS — design for the reader
---
This README is a pitch, not a template. Before choosing sections, work out who
it's for and what it's for, then design the structure around that.

**Infer the target.** From the résumé and the user's intent, determine the role
and seniority the developer is aiming at (e.g. "early-career backend / AI-agent
engineer") and the domain keywords that role screens on. Mirror the résumé's own
wording — don't invent a target it doesn't support.

**Honor the brief.** When the intent supplies explicit fields (target role,
seniority, audience, tone, length, sections to include, or a target job
description), treat them as instructions and design to them rather than
re-inferring — e.g. tailor the Summary/Skills keywords to a provided job
description, and include exactly the requested sections. Still never claim
anything the résumé/repos don't support.

**Design for two readers at once:**

- *Recruiter / automated screen (first pass):* skims in seconds and may be
  filtered by keyword. Wants standard, machine-readable section headings; clear
  titles, employers, and dates; and the role's keywords present as text.
- *Hiring manager / tech lead (second pass):* wants evidence — impact, the real
  stack, shipped work, links.

Lead with the standard, scannable, keyword-bearing material; put depth below it.

**ATS-conscious (be honest about the medium).** A GitHub profile README is not
the document an Applicant Tracking System ingests — that's the uploaded résumé —
but structure it as if it could be screened:

- Use conventional, parseable headings: "Summary", "Skills", "Work Experience",
  "Education", "Projects", "Certifications". Parsers and skimmers key off these.
- ATS read **text, not images.** The Skills section uses badges (good for human
  readers), so make sure the role's key technologies and keywords ALSO appear in
  plain text in the Summary and Work Experience — that prose is what an ATS
  matches on. Don't rely on the badges alone for keywords.
- Keep each role as a clean, consistent, parseable `title | employer | dates`.
- Don't bury critical content in layout tricks (tables used only for layout,
  deep nesting) that a parser or a fast skim would miss.
- Only use keywords the résumé actually supports.
