# Project instructions for Claude Code

## Database migrations

Always generate migrations with a descriptive name — never accept drizzle-kit's
default random adjective-animal name (e.g. `0000_mixed_frog_thor`,
`0001_slippery_red_shift`):

```bash
npm run db:generate -- --name=descriptive_name_here
```

The name should summarize what the migration does (e.g. `initial_schema`,
`content_block_sections`, `add_pledge_reminders`). Migration filenames are
permanent history once applied, and renaming an already-applied migration
afterward is safe — Drizzle's applied-migration check is a hash of the file's
SQL content (see `node_modules/drizzle-orm/migrator.js`), not the filename —
but naming it right the first time avoids the cleanup.
