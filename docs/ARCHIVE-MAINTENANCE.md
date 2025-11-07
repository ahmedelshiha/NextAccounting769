# Archive & Backup Maintenance Checklist

## Weekly Tasks
- [ ] Verify daily backups complete successfully.
- [ ] Review storage consumption for `backups/` directories.
- [ ] Inspect `.archive-system/archive-log.json` for recent additions requiring README updates.

## Monthly Tasks
- [ ] Perform a restore drill using the latest weekly backup.
- [ ] Compress and catalogue the previous month's archive folders.
- [ ] Confirm off-site synchronization jobs completed without errors.
- [ ] Refresh archive README files with any missing operational context.
- [ ] Evaluate whether older archive sets qualify for permanent removal.

## Quarterly Tasks
- [ ] Consolidate completed quarter archives and move cold data as needed.
- [ ] Rotate legacy backups into slower storage tiers.
- [ ] Revisit retention thresholds defined in `.archive-system/config.json`.
- [ ] Audit access logs for archive and backup resources.
- [ ] Update documentation to reflect any process or tooling changes.

## Annual Tasks
- [ ] Execute a full disaster recovery simulation from backups.
- [ ] Review and modernize archive directory structure.
- [ ] Compress the previous year's archives into sealed bundles.
- [ ] Patch backup and archive scripts for security or dependency updates.
- [ ] Validate security controls guarding backup destinations.
