---
description: Audit changelog entries before a release
---
Audit `## [Unreleased]` in `CHANGELOG.md` against every commit since the last
release. Do not bump, commit, tag or push — `bun run release` does all of that.

## Process

1. **Find the baseline:**
   - The highest release tag: `git tag --sort=-v:refname | head -1`.
   - Stop rather than guessing if there is none.

2. **List the commits:**
   - `git log <tag>..HEAD --oneline`, then `git show <hash> --stat` and the
     relevant diff wherever the subject alone does not settle what changed.

3. **For each commit:**
   - Skip changelog-only, documentation-only, and release-housekeeping changes.
   - Otherwise ensure a concise entry exists under `## [Unreleased]`, and add it
     if missing.
   - Consolidate related commits into a single entry. Describe the change from a
     consumer's point of view; do not transcribe commit messages.

4. **Format:**
   - One entry per line, never hard-wrapped.
   - Sections in this order, omitting the ones that do not apply:
     `Breaking Changes`, `Added`, `Changed`, `Fixed`, `Removed`.

5. **Report:**
   - Entries added, commits deliberately skipped, and anything too ambiguous to
     call — ask rather than invent an entry.
