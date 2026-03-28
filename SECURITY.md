# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of sql-mcp seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues by emailing:

**security@varkart.com** (or create a GitHub Security Advisory)

Alternatively, you can use GitHub's private vulnerability reporting:
1. Go to the [Security tab](https://github.com/varkart/sql-mcp/security)
2. Click "Report a vulnerability"
3. Fill out the advisory form

### What to Include

Please include the following information in your report:

- **Description**: A clear description of the vulnerability
- **Impact**: What could an attacker accomplish?
- **Reproduction Steps**: Detailed steps to reproduce the issue
- **Affected Versions**: Which versions are vulnerable?
- **Proposed Fix**: If you have suggestions for fixing the issue
- **Environment**: OS, Node.js version, database type, etc.
- **Proof of Concept**: Code snippets or scripts (if applicable)

### Response Timeline

- **Acknowledgment**: Within 48 hours of report
- **Initial Assessment**: Within 7 days
- **Status Updates**: Every 14 days until resolved
- **Fix Timeline**: Critical issues within 30 days, others within 90 days

### Disclosure Policy

We follow a **coordinated disclosure** approach:

1. We will confirm the vulnerability and determine its impact
2. We will develop and test a fix
3. We will prepare a security advisory
4. We will release the fix and advisory simultaneously
5. We request a 90-day embargo before public disclosure

### Security Best Practices

When using sql-mcp in production:

#### 1. Use Read-Only Connections
```json
{
  "connections": {
    "prod-db": {
      "config": {
        "readOnly": true
      }
    }
  }
}
```

#### 2. Protect Configuration Files
```bash
# Ensure config file has restricted permissions
chmod 600 ~/.sql-mcp/config.json
chmod 600 ~/.sql-mcp/connections.json
```

#### 3. Use Environment Variables for Credentials
```json
{
  "config": {
    "password": "${DB_PASSWORD}"
  }
}
```

#### 4. Enable Query Timeouts
```json
{
  "defaults": {
    "queryTimeout": 30000,
    "maxRows": 1000
  }
}
```

#### 5. Regular Updates
```bash
# Keep sql-mcp up to date
npm update -g sql-mcp

# Check for security advisories
npm audit
```

#### 6. Network Security
- Use SSL/TLS for database connections
- Restrict database access to trusted networks
- Use firewalls to limit database exposure

#### 7. Credential Storage
- Never commit credentials to version control
- Use secure credential stores (e.g., HashiCorp Vault)
- Rotate credentials regularly

### Known Security Considerations

#### Credential Storage
Connection credentials are stored in `~/.sql-mcp/connections.json` with mode 0600 (user read/write only). This is similar to how `~/.pgpass` and other database tools store credentials. Users should be aware that credentials are stored in plaintext on disk.

**Mitigation**: Use environment variables or external credential management systems for sensitive production environments.

#### SQL Injection
sql-mcp implements multiple layers of protection against SQL injection:
- Parameterized queries for user inputs
- Query validation and dangerous pattern detection
- Multi-statement query blocking

**Best Practice**: Always use parameterized queries when integrating sql-mcp into applications.

#### Resource Exhaustion
sql-mcp implements protection mechanisms:
- Query timeouts (default: 30s, max: 5 minutes)
- Row limits (default: 1000, max: 100,000)
- Connection pooling limits

**Best Practice**: Configure appropriate limits for your use case.

### Security Updates

Security updates will be announced via:
- GitHub Security Advisories
- Release notes with `[SECURITY]` prefix
- npm package advisory system
- Project README

### Bug Bounty

We currently do not have a formal bug bounty program. However, we deeply appreciate security researchers who responsibly disclose vulnerabilities. Contributors who report valid security issues will be:
- Credited in the security advisory (unless they prefer to remain anonymous)
- Listed in CONTRIBUTORS.md
- Mentioned in release notes

### Scope

#### In Scope
- SQL injection vulnerabilities
- Authentication/authorization bypass
- Remote code execution
- Credential exposure
- Denial of service
- Data leakage
- Command injection
- Path traversal

#### Out of Scope
- Issues in third-party dependencies (report to the dependency maintainers)
- Social engineering attacks
- Physical attacks
- Issues requiring physical access to the machine
- Theoretical vulnerabilities without proof of concept
- Issues in database systems themselves (report to database vendors)

### Security Hall of Fame

We recognize security researchers who have helped improve sql-mcp:

- *Be the first to contribute!*

---

**Questions?** Contact us at security@varkart.com or open a GitHub Discussion.

**Last Updated:** March 28, 2026
