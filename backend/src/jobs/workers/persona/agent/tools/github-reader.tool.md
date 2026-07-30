---
id: github-reader
title: GitHub reader
implemented_by: src/jobs/workers/persona/services/github-reader.service.ts
---
Reads, with the user's decrypted OAuth token: the current profile README (the
`owner/owner` repo) and the user's top public repositories (name, description,
language, stars, README excerpt). Produces the **current profile README** and
**projects** sections of the working context. Degrades to nulls/empty when
GitHub isn't connected.
