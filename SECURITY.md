# Security

## Credential handling

This project **stores no credentials**. It reuses the OAuth session that the
Salesforce CLI already holds, so there is no Connected App, no client secret,
and no token on disk.

- `scripts/sf-api.sh` reads an access token from `sf org display` **at runtime**
  and passes it to `curl` in a request header. The token is never written to a
  file, logged, or committed.
- Instance-mode calls delegate entirely to `sf api request rest`, which manages
  its own authentication.
- No environment variable in this project holds a secret. `SF_TARGET_ORG` is an
  org alias, not a credential.

## Reporting a vulnerability

Open a [private security advisory](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
rather than a public issue.

Please include:

- A description of the issue and its impact
- Steps to reproduce
- Affected files or scripts
- Any suggested remediation

## Scope

In scope:

- Credential or token leakage from the scripts
- Command injection through script arguments
- Path traversal in the catalog or helper scripts
- Destructive operations that bypass the confirmation guidance

Out of scope:

- Vulnerabilities in the Salesforce platform or its APIs
- Misconfiguration of the user's own org or CLI session
- The contents of `catalog/endpoints.json`, which is generated from Salesforce's
  published Postman collections

## Design notes

**Destructive operations.** The catalog marks destructive endpoints with
`destructive: true`, and the agent instructions require explicit user
confirmation before running them. This is a guardrail, not an enforcement
mechanism — the underlying Salesforce API will still perform the operation if
called directly.

**Tenant mode.** `--tenant` sends a request to a host supplied by the user via
`DATA360_TENANT_URL`. The script does not validate that host, so only point it at
a Salesforce tenant you control. It fails fast when the variable is unset rather
than guessing a hostname.

**No network egress beyond Salesforce.** The scripts call only the org instance
reported by `sf org display` and the tenant host you configure.
