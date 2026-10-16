# Bulk and Composite Reference

## Choosing an approach

| Volume | Approach | Command |
| --- | --- | --- |
| 1 record | `sf data` | `sf data create record` |
| 2–200 records | Composite | `POST /composite/sobjects` |
| 200–10,000 | Bulk API 2.0 | `sf data import bulk` |
| 10,000+ | Bulk API 2.0 | `sf data import bulk` |
| Mixed operations | Composite | `POST /composite` |

## Composite collections

`POST /composite/sobjects` — up to **200 records**, all the same sObject.

```json
{
  "allOrNone": false,
  "records": [
    { "attributes": { "type": "Account" }, "Name": "Acme 1" },
    { "attributes": { "type": "Account" }, "Name": "Acme 2" }
  ]
}
```

- `POST` creates, `PATCH` updates, `DELETE` removes.
- Delete takes ids in the query string:
  `DELETE /composite/sobjects?ids=001...,001...&allOrNone=false`
- `allOrNone: true` rolls back the whole batch if any record fails.

Response:

```json
[
  { "id": "001...", "success": true, "errors": [] },
  { "id": null, "success": false, "errors": [ { "statusCode": "REQUIRED_FIELD_MISSING", "message": "..." } ] }
]
```

## Composite graph

`POST /composite/graph` — up to **500 records** across multiple sObjects, with
dependency ordering. Use when records reference each other.

## Composite (mixed operations)

`POST /composite` — up to **25 subrequests**, each with its own method and URL.

```json
{
  "allOrNone": false,
  "compositeRequest": [
    {
      "method": "POST",
      "url": "/services/data/v66.0/sobjects/Account",
      "referenceId": "newAccount",
      "body": { "Name": "Acme" }
    },
    {
      "method": "POST",
      "url": "/services/data/v66.0/sobjects/Contact",
      "referenceId": "newContact",
      "body": { "LastName": "Smith", "AccountId": "@{newAccount.id}" }
    }
  ]
}
```

Reference a prior result with `@{referenceId.field}`.

## Bulk API 2.0

```bash
# Import (insert)
sf data import bulk --sobject Account --file accounts.csv \
  --target-org "$SF_TARGET_ORG" --json

# Upsert on an external id
sf data upsert bulk --sobject Account --file accounts.csv \
  --external-id My_External_Id__c --target-org "$SF_TARGET_ORG" --json

# Export
sf data export bulk --query "SELECT Id, Name FROM Account" \
  --output-file accounts.csv --target-org "$SF_TARGET_ORG" --json

# Check a job
sf data resume --job-id 750... --target-org "$SF_TARGET_ORG" --json
```

Bulk jobs are asynchronous. `sf data import bulk` waits by default; add
`--async` to return immediately with a job id.

### CSV format

- First row is the header, using API field names.
- `Id` column for updates.
- Dates in ISO 8601 (`2026-01-31` or `2026-01-31T12:00:00Z`).
- Booleans as `true` / `false`.
- Escape embedded commas and quotes per RFC 4180.

## Error handling

| Status code | Meaning |
| --- | --- |
| `REQUIRED_FIELD_MISSING` | A required field was omitted |
| `INVALID_TYPE` | Wrong sObject or field name |
| `FIELD_CUSTOM_VALIDATION_EXCEPTION` | A validation rule blocked the write |
| `DUPLICATE_VALUE` | Unique constraint violated |
| `INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY` | No access to a referenced record |
| `ENTITY_IS_DELETED` | Target record already deleted |

## Safety

- **Deletes are permanent** through the API — they go to the Recycle Bin only
  for records deleted via the UI, and even then only for 15 days.
- **Always confirm destructive operations with the user** before running them.
- **Prefer `allOrNone: true`** when partial success would leave inconsistent
  data; prefer `false` for best-effort bulk loads where you will review errors.
- **Check org limits** before large loads:
  `sf org list limits -o "$SF_TARGET_ORG" --json`.
