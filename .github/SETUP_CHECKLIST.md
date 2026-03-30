# GitHub Setup Checklist

Quick checklist for configuring repository settings. See [REPOSITORY_SETUP.md](REPOSITORY_SETUP.md) for detailed instructions.

## 🔐 Security (CRITICAL - Do First)

**Settings → Code security and analysis**
- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable Dependabot version updates
- [ ] Enable secret scanning
- [ ] Enable push protection
- [ ] Enable private vulnerability reporting

**Settings → Secrets and variables → Actions**
- [ ] Add `NPM_TOKEN` secret (get from npmjs.com)

## 🛡️ Branch Protection (CRITICAL)

**Settings → Branches → Add rule for `main`**
- [ ] Require pull request before merging (1 approval)
- [ ] Require status checks (all 3 Node versions + CodeQL)
- [ ] Require conversation resolution
- [ ] Require linear history
- [ ] Do not allow bypassing
- [ ] Block force pushes and deletions

**Settings → Branches → Add rule for `dev`**
- [ ] Require pull request before merging (1 approval)
- [ ] Require status checks (all 3 Node versions + CodeQL)
- [ ] Require conversation resolution
- [ ] Block force pushes and deletions

## ⚙️ General Settings

**Settings → General → Features**
- [ ] Enable Issues
- [ ] Enable Discussions
- [ ] Disable Wiki (use docs/)

**Settings → General → Pull Requests**
- [ ] Allow squash merging (default)
- [ ] Auto-delete head branches

## 🤖 Actions Configuration

**Settings → Actions → General**
- [ ] Allow all actions
- [ ] Read and write permissions
- [ ] Allow Actions to create PRs (for Dependabot)

## 📋 Repository Info

**Main page → About ⚙️**
- [ ] Add description: "Production-grade MCP server for multi-database SQL management with natural language querying"
- [ ] Add website: https://www.npmjs.com/package/mcp-sql-explorer
- [ ] Add topics: mcp, sql, database, postgresql, mysql, sqlite, typescript, nodejs, ai, llm

## 💬 Community (Recommended)

**Settings → General → Features**
- [ ] Enable Discussions

**Discussions → Categories (create)**
- [ ] General
- [ ] Ideas
- [ ] Q&A
- [ ] Announcements

## ✅ Verification

- [ ] Try pushing to `main` → Should be blocked
- [ ] Create test PR → CI should run automatically
- [ ] Check Dependabot is configured (Actions tab)
- [ ] Check CodeQL is scheduled (Actions tab)
- [ ] Verify NPM_TOKEN secret exists

## 📝 Post-Setup

- [ ] Create first GitHub Discussion welcoming contributors
- [ ] Star your own repository
- [ ] Share on social media
- [ ] Add repository to your GitHub profile

---

**Estimated time:** 15-20 minutes

**Need help?** See detailed guide in [REPOSITORY_SETUP.md](REPOSITORY_SETUP.md)
