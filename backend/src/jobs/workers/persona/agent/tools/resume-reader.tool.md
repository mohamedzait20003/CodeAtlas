---
id: resume-reader
title: Résumé reader
implemented_by: src/jobs/workers/persona/services/resume-text.service.ts
---
Extracts plain text from the user's most recent résumé (PDF via `pdf-parse`,
DOCX via `mammoth`) or a résumé-link note. Produces the **résumé** section of the
working context. Degrades to `null` when the user has no résumé.
