# GitHub Repository Setup Guide

This guide walks you through configuring your GitHub repository for production open source at scale.

## 🔗 Quick Access

**Repository URL:** https://github.com/varkart/sql-mcp/settings

## 1. Branch Protection Rules

### Protect `main` Branch

**Navigate to:** Settings → Branches → Add branch protection rule

```
Branch name pattern: main

✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ✅ Require review from Code Owners (optional)

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging

   Status checks required:
   ✅ build (Node.js 18.x)
   ✅ build (Node.js 20.x)
   ✅ build (Node.js 22.x)
   ✅ CodeQL

✅ Require conversation resolution before merging

✅ Require linear history

✅ Do not allow bypassing the above settings

❌ Allow force pushes (keep disabled)
❌ Allow deletions (keep disabled)
```

**Click:** Create / Save changes

### Protect `dev` Branch

**Navigate to:** Settings → Branches → Add branch protection rule

```
Branch name pattern: dev

✅ Require a pull request before merging
   ✅ Require approvals: 1

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging

   Status checks required:
   ✅ build (Node.js 18.x)
   ✅ build (Node.js 20.x)
   ✅ build (Node.js 22.x)
   ✅ CodeQL

✅ Require conversation resolution before merging

❌ Allow force pushes (keep disabled)
❌ Allow deletions (keep disabled)
```

**Click:** Create / Save changes

## 2. General Settings

**Navigate to:** Settings → General

### Features

```
✅ Issues
✅ Discussions (enable for community Q&A)
✅ Projects
❌ Wiki (use docs/ directory instead)
❌ Sponsorships (or enable if using GitHub Sponsors)
```

### Pull Requests

```
✅ Allow merge commits
✅ Allow squash merging (recommended default)
✅ Allow rebase merging

Default commit message:
● Pull request title and description

✅ Always suggest updating pull request branches
✅ Automatically delete head branches
```

### Archives

```
❌ Do not archive this repository
```

## 3. Security Settings

### Code Security and Analysis

**Navigate to:** Settings → Code security and analysis

```
Dependency graph:
✅ Enabled (required for Dependabot)

Dependabot alerts:
✅ Enabled

Dependabot security updates:
✅ Enabled

Dependabot version updates:
✅ Enabled (uses .github/dependabot.yml)

Code scanning:
✅ CodeQL analysis (via .github/workflows/codeql.yml)

Secret scanning:
✅ Enabled
✅ Push protection enabled

Private vulnerability reporting:
✅ Enabled
```

### Secrets and Variables

**Navigate to:** Settings → Secrets and variables → Actions

**Add Repository Secret:**
```
Name: NPM_TOKEN
Secret: [Get from https://www.npmjs.com/settings/YOUR_USERNAME/tokens]

Token type: Automation token
Token permissions: Read and write
Expiration: No expiration (or 1 year)
```

**How to get NPM token:**
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type
4. Copy the token
5. Paste into GitHub secret

## 4. Collaborators & Teams

**Navigate to:** Settings → Collaborators and teams

### For Solo Projects
```
Just you as admin - no changes needed
```

### For Team Projects
```
Add teams with appropriate permissions:
- Admin: Core maintainers
- Write: Regular contributors
- Triage: Issue managers
- Read: External collaborators
```

## 5. GitHub Pages (Optional)

**Navigate to:** Settings → Pages

If you want to publish documentation:
```
Source: Deploy from a branch
Branch: main
Folder: /docs
```

## 6. Environments (For npm Publishing)

**Navigate to:** Settings → Environments → New environment

**Create environment:** `npm`

```
Environment name: npm

Deployment protection rules:
✅ Required reviewers (optional - select yourself)

Environment secrets:
NPM_TOKEN: [Add if not using repository secret]
```

## 7. Actions Settings

**Navigate to:** Settings → Actions → General

### Actions permissions
```
● Allow all actions and reusable workflows
```

### Workflow permissions
```
● Read and write permissions
✅ Allow GitHub Actions to create and approve pull requests (for Dependabot)
```

### Artifact and log retention
```
Days: 90 (default)
```

## 8. Moderation Settings

**Navigate to:** Settings → Moderation

### Code review limits
```
Limit to users explicitly granted read or higher access
```

### Reported content
```
✅ Enable private vulnerability reporting
```

## 9. Repository Topics

**Navigate to:** Main repository page → About ⚙️ (settings gear)

**Add topics:**
```
mcp
model-context-protocol
sql
database
postgresql
mysql
sqlite
mssql
oracle
mariadb
natural-language
ai
llm
claude
chatgpt
database-management
typescript
nodejs
```

## 10. Repository Description & URL

**Navigate to:** Main repository page → About ⚙️ (settings gear)

```
Description:
Production-grade MCP server for multi-database SQL management with natural language querying

Website:
https://www.npmjs.com/package/mcp-sql-explorer

✅ Include this repository in the GitHub Stars program
```

## 11. Social Preview Image (Optional)

**Navigate to:** Settings → General → Social preview

Upload a 1280×640px image that will show when sharing on social media.

## 12. Notifications

**Navigate to:** Settings → Notifications

Recommended for active maintenance:
```
✅ Issues
✅ Pull requests
✅ Releases
✅ Discussions
✅ Security alerts
```

## 13. Enable Discussions (Recommended)

**Navigate to:** Settings → General → Features

```
✅ Discussions

Then go to Discussions tab and create categories:
- 💬 General
- 💡 Ideas
- 🙏 Q&A
- 📣 Announcements
- 🙌 Show and tell
```

## Verification Checklist

After completing setup, verify:

### Branch Protection
- [ ] Try to push directly to `main` → Should be blocked
- [ ] Try to push directly to `dev` → Should be blocked
- [ ] Create PR without passing tests → Should be blocked from merging

### Security
- [ ] Check Dependabot is creating PRs (wait a few days)
- [ ] CodeQL scan completed successfully
- [ ] Secret scanning is active

### Actions
- [ ] CI workflow runs on PRs
- [ ] All 3 Node.js versions tested
- [ ] Tests and linting enforced

### npm Publishing (When ready)
- [ ] NPM_TOKEN secret configured
- [ ] Create test release to verify workflow
- [ ] Check package appears on npm with provenance

## Quick Test Commands

```bash
# Test branch protection (should fail)
git push origin main  # Should be rejected

# Test via PR (should work)
git checkout -b test/branch-protection
echo "test" >> README.md
git commit -am "test: Verify branch protection"
git push origin test/branch-protection
# Create PR on GitHub - CI should run automatically

# Clean up
git checkout dev
git branch -D test/branch-protection
git push origin --delete test/branch-protection
```

## Estimated Setup Time

- ⏱️ **Basic setup:** 10-15 minutes
- ⏱️ **Full setup with testing:** 20-30 minutes
- ⏱️ **First-time configuration:** 30-45 minutes

## Support

If you encounter issues:
1. Check [GitHub Docs](https://docs.github.com)
2. Verify you have admin permissions
3. Ensure workflows have run at least once before adding status checks

---

**Last Updated:** 2024-03-28
**Repository:** sql-mcp
