# Archive & Backup Guide

## Quick Start

### Archive legacy code or documents
```bash
node .archive-system/scripts/archive.js ./path/to/legacy "deprecated" "Legacy Module" "backend"
```

### Search existing archives
```bash
node .archive-system/scripts/archive.js search "keyword"
```

### Create a manual backup
```bash
./.archive-system/scripts/backup.sh daily
```

### Restore from a backup
```bash
mkdir -p restore
tar -xzf backups/daily/2025-01-01_daily.tar.gz -C restore
```

## Archive Structure
- Archives are organized by year and quarter within `archive/`.
- Each archive contains `files/`, `metadata.json`, and `README.md` for context.
- Use the archive log at `.archive-system/archive-log.json` for quick indexing.

## Backup Schedule
- **Daily**: runs `backup.sh daily`, retaining seven snapshots by default.
- **Weekly**: runs `backup.sh weekly`, retaining four snapshots.
- **Monthly**: runs `backup.sh monthly`, retaining twelve snapshots.

## Emergency Recovery
- Validate checksums before restoring: `sha256sum -c backups/daily/<file>.sha256`.
- Restore only the required directories to limit downtime.
- Consult `ARCHIVE-MAINTENANCE.md` for routine verification tasks.
