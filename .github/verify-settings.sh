#!/bin/bash

# GitHub Repository Settings Verification Script
# Checks if repository settings are configured correctly

set -e

REPO="varkart/sql-mcp"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying GitHub repository settings for $REPO"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}✗${NC} GitHub CLI (gh) is not installed"
    echo "  Install: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}✗${NC} Not authenticated with GitHub CLI"
    echo "  Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓${NC} GitHub CLI authenticated"
echo ""

# Function to check setting
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

# Function to check with warning
check_warn() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${YELLOW}⚠${NC} $1 (optional)"
    fi
}

echo "📋 Checking repository configuration..."
echo ""

# Check branch protection
echo "🛡️  Branch Protection:"
gh api repos/$REPO/branches/main/protection &> /dev/null
check "  main branch protected"

gh api repos/$REPO/branches/dev/protection &> /dev/null
check_warn "  dev branch protected"

# Check if Dependabot is enabled (check for .github/dependabot.yml)
echo ""
echo "🤖 Automation:"
if [ -f ".github/dependabot.yml" ]; then
    echo -e "${GREEN}✓${NC}   Dependabot configured (.github/dependabot.yml exists)"
else
    echo -e "${RED}✗${NC}   Dependabot not configured"
fi

# Check for workflow files
if [ -f ".github/workflows/ci.yml" ]; then
    echo -e "${GREEN}✓${NC}   CI workflow exists"
else
    echo -e "${RED}✗${NC}   CI workflow missing"
fi

if [ -f ".github/workflows/codeql.yml" ]; then
    echo -e "${GREEN}✓${NC}   CodeQL workflow exists"
else
    echo -e "${RED}✗${NC}   CodeQL workflow missing"
fi

if [ -f ".github/workflows/publish.yml" ]; then
    echo -e "${GREEN}✓${NC}   Publish workflow exists"
else
    echo -e "${RED}✗${NC}   Publish workflow missing"
fi

# Check recent workflow runs
echo ""
echo "⚙️  Workflow Status:"
WORKFLOW_RUNS=$(gh run list --repo $REPO --limit 1 --json status,conclusion 2>/dev/null || echo "[]")
if [ "$WORKFLOW_RUNS" != "[]" ]; then
    echo -e "${GREEN}✓${NC}   Workflows have run"
else
    echo -e "${YELLOW}⚠${NC}   No workflow runs yet (push code to trigger)"
fi

# Check repository features
echo ""
echo "📚 Repository Features:"
REPO_INFO=$(gh api repos/$REPO)

HAS_ISSUES=$(echo $REPO_INFO | jq -r '.has_issues')
if [ "$HAS_ISSUES" = "true" ]; then
    echo -e "${GREEN}✓${NC}   Issues enabled"
else
    echo -e "${RED}✗${NC}   Issues disabled"
fi

HAS_DISCUSSIONS=$(echo $REPO_INFO | jq -r '.has_discussions')
if [ "$HAS_DISCUSSIONS" = "true" ]; then
    echo -e "${GREEN}✓${NC}   Discussions enabled"
else
    echo -e "${YELLOW}⚠${NC}   Discussions disabled (recommended to enable)"
fi

HAS_WIKI=$(echo $REPO_INFO | jq -r '.has_wiki')
if [ "$HAS_WIKI" = "false" ]; then
    echo -e "${GREEN}✓${NC}   Wiki disabled (using docs/ instead)"
else
    echo -e "${YELLOW}⚠${NC}   Wiki enabled (recommended to disable)"
fi

# Check security features
echo ""
echo "🔐 Security Features:"

# Check if vulnerability reporting is enabled
SECURITY=$(gh api repos/$REPO/private-vulnerability-reporting 2>/dev/null || echo "null")
if [ "$SECURITY" != "null" ]; then
    echo -e "${GREEN}✓${NC}   Private vulnerability reporting available"
else
    echo -e "${YELLOW}⚠${NC}   Check security settings manually"
fi

# Check for SECURITY.md
if [ -f "SECURITY.md" ]; then
    echo -e "${GREEN}✓${NC}   SECURITY.md exists"
else
    echo -e "${RED}✗${NC}   SECURITY.md missing"
fi

# Check for CODE_OF_CONDUCT.md
if [ -f "CODE_OF_CONDUCT.md" ]; then
    echo -e "${GREEN}✓${NC}   CODE_OF_CONDUCT.md exists"
else
    echo -e "${RED}✗${NC}   CODE_OF_CONDUCT.md missing"
fi

# Check for CONTRIBUTING.md
if [ -f "CONTRIBUTING.md" ]; then
    echo -e "${GREEN}✓${NC}   CONTRIBUTING.md exists"
else
    echo -e "${RED}✗${NC}   CONTRIBUTING.md missing"
fi

# Check documentation
echo ""
echo "📖 Documentation:"
if [ -f "README.md" ]; then
    echo -e "${GREEN}✓${NC}   README.md exists"
else
    echo -e "${RED}✗${NC}   README.md missing"
fi

if [ -f "CHANGELOG.md" ]; then
    echo -e "${GREEN}✓${NC}   CHANGELOG.md exists"
else
    echo -e "${YELLOW}⚠${NC}   CHANGELOG.md missing (recommended)"
fi

if [ -f "LICENSE" ]; then
    echo -e "${GREEN}✓${NC}   LICENSE exists"
else
    echo -e "${RED}✗${NC}   LICENSE missing"
fi

# Check repository topics
echo ""
echo "🏷️  Repository Topics:"
TOPICS=$(echo $REPO_INFO | jq -r '.topics | length')
if [ "$TOPICS" -gt 5 ]; then
    echo -e "${GREEN}✓${NC}   $TOPICS topics configured"
else
    echo -e "${YELLOW}⚠${NC}   Only $TOPICS topics (recommend 8-10)"
fi

# Check secrets (can't read values, just check if they're mentioned in workflows)
echo ""
echo "🔑 Secrets Configuration:"
if grep -q "NPM_TOKEN" .github/workflows/publish.yml 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC}   NPM_TOKEN required (cannot verify if set)"
    echo "      Check: Settings → Secrets → Actions"
else
    echo -e "${GREEN}✓${NC}   No secrets required"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Manual Verification Required:"
echo ""
echo "1. Branch protection details:"
echo "   Visit: https://github.com/$REPO/settings/branches"
echo "   Verify: Require PR reviews, status checks, linear history"
echo ""
echo "2. Security settings:"
echo "   Visit: https://github.com/$REPO/settings/security_analysis"
echo "   Verify: Dependabot alerts, secret scanning, push protection"
echo ""
echo "3. Secrets configuration:"
echo "   Visit: https://github.com/$REPO/settings/secrets/actions"
echo "   Verify: NPM_TOKEN is set"
echo ""
echo "4. Actions permissions:"
echo "   Visit: https://github.com/$REPO/settings/actions"
echo "   Verify: Read/write permissions, allow PR creation"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Verification complete!"
echo ""
echo "For detailed setup instructions, see:"
echo "  .github/REPOSITORY_SETUP.md"
echo "  .github/SETUP_CHECKLIST.md"
