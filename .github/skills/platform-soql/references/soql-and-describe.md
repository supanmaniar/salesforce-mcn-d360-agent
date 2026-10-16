# SOQL and Describe Reference

## SOQL essentials

```sql
SELECT Id, Name, Industry FROM Account WHERE Industry = 'Technology' LIMIT 10
```

| Clause | Notes |
| --- | --- |
| `SELECT` | Explicit fields only — no `SELECT *` |
| `FROM` | sObject API name |
| `WHERE` | Supports `=`, `!=`, `<`, `>`, `LIKE`, `IN`, `AND`, `OR` |
| `ORDER BY` | `ASC` / `DESC`, up to 32 fields |
| `LIMIT` | Max 50,000 in a single query |
| `OFFSET` | Max 2,000 |

### Relationship queries

```sql
-- Parent to child (subquery)
SELECT Id, Name, (SELECT Id, LastName FROM Contacts) FROM Account

-- Child to parent (dot notation)
SELECT Id, LastName, Account.Name FROM Contact
```

### Date literals

`TODAY`, `YESTERDAY`, `THIS_WEEK`, `LAST_MONTH`, `LAST_N_DAYS:30`,
`THIS_FISCAL_QUARTER`.

### Aggregate queries

```sql
SELECT Industry, COUNT(Id) FROM Account GROUP BY Industry HAVING COUNT(Id) > 5
```

## Limits

| Limit | Value |
| --- | --- |
| Records per SOQL query | 50,000 |
| `sf data query` auto-pagination cap | 10,000 |
| Query rows returned (API) | 2,000 per page |
| `OFFSET` maximum | 2,000 |
| SOQL query character limit | 100,000 |

Beyond 10,000 records, use Bulk API 2.0:

```bash
sf data export bulk --query "SELECT Id, Name FROM Account" \
  --output-file accounts.csv --target-org "$SF_TARGET_ORG"
```

## Describe

```bash
sf sobject describe --sobject Account --target-org "$SF_TARGET_ORG" --json
```

Key field properties:

| Property | Meaning |
| --- | --- |
| `name` | API name |
| `label` | UI label |
| `type` | `string`, `picklist`, `reference`, `currency`, … |
| `createable` | Writable on insert |
| `updateable` | Writable on update |
| `nillable` | Nullable |
| `defaultedOnCreate` | Auto-populated on insert |
| `referenceTo` | Target objects for lookup/master-detail |
| `picklistValues` | Allowed values for picklists |

### Find required fields

```bash
sf sobject describe -s Account -o "$SF_TARGET_ORG" --json | python3 -c "
import json,sys
for f in json.load(sys.stdin)['result']['fields']:
    if f['createable'] and not f['nillable']:
        auto = ' (auto-populated)' if f.get('defaultedOnCreate') else ''
        print(f\"{f['name']} ({f['type']}){auto}\")"
```

`createable and not nillable` gives the fields you must supply. Fields also
flagged `defaultedOnCreate` have a default and can be omitted. A standard object
like Account has 20 such fields, all auto-populated — so the set of fields you
must supply is empty. That is a valid result, not a failed query.

### Find lookup targets

```bash
sf sobject describe -s Contact -o "$SF_TARGET_ORG" --json | python3 -c "
import json,sys
for f in json.load(sys.stdin)['result']['fields']:
    if f['type'] == 'reference':
        print(f\"{f['name']} -> {','.join(f['referenceTo'])}\")"
```

## Global describe

```bash
sf api request rest "services/data/v66.0/sobjects" -o "$SF_TARGET_ORG" --json
```

Returns ~6,800 objects in a typical org. Each entry has `name`, `label`,
`keyPrefix`, `createable`, `queryable`, and `custom`.

## Tooling API

Add `--use-tooling-api` to query metadata objects:

```bash
sf data query --use-tooling-api \
  --query "SELECT Id, Name FROM ApexClass LIMIT 10" \
  --target-org "$SF_TARGET_ORG" --json
```

Common Tooling objects: `ApexClass`, `ApexTrigger`, `CustomObject`,
`CustomField`, `FlowDefinition`, `Layout`, `Profile`, `PermissionSet`.

## Org limits

```bash
sf org list limits --target-org "$SF_TARGET_ORG" --json
```

Returns `name`, `max`, `remaining` per limit. Notable limits:

| Limit | Meaning |
| --- | --- |
| `DailyApiRequests` | REST API calls per day |
| `DataStorageMB` | Data storage |
| `FileStorageMB` | File storage |
| `CdpAiInferenceApiMonthlyLimit` | Data 360 AI inference |
| `AnalyticsExternalDataSizeMB` | Analytics external data |
