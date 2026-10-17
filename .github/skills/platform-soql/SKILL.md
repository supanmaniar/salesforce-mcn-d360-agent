---
name: platform-soql
description: 'Query and explore a Salesforce org from the CLI: run SOQL, paginate results, list and describe sObjects, call arbitrary REST endpoints, and check org limits. Use when you need to query records, inspect object schemas, explore the REST API, or check API and storage limits without an MCP server. Note that sObject tooling does not show the whole data model — data model objects (DMOs, __dlm) are absent from EntityDefinition and from sf sobject list unless materialised.'
---

# Salesforce Platform: SOQL, Describe, REST, Limits

Replaces the MCP server's platform tools: `sf_soql_query`,
`sf_soql_query_more`, `sf_list_objects`, `sf_describe_object`,
`sf_rest_request`, `sf_org_limits`.

## When to Use

- Running a SOQL query or paginating through results
- Listing sObjects or describing an object's fields
- Calling an arbitrary REST endpoint
- Checking org API, storage, or feature limits

## Procedure

### Run a SOQL query

```bash
sf data query --query "SELECT Id, Name FROM Account LIMIT 10" \
  --target-org "$SF_TARGET_ORG" --json
```

Add `--use-tooling-api` to query Tooling API objects (metadata, Apex classes).
Add `--all-rows` to include deleted records.

### Paginate

`sf data query` follows pagination automatically and returns all pages. If you
need manual control, use the REST API and follow `nextRecordsUrl`:

```bash
./scripts/sf-api.sh --path /query --query 'q=SELECT+Id+FROM+Account'
# then follow the returned nextRecordsUrl
./scripts/sf-api.sh --path /query/01g...-2000
```

For result sets over 10,000 records, prefer Bulk API 2.0:

```bash
sf data export bulk --query "SELECT Id, Name FROM Account" \
  --output-file accounts.csv --target-org "$SF_TARGET_ORG"
```

### List sObjects

```bash
sf api request rest "services/data/v66.0/sobjects" -o "$SF_TARGET_ORG" --json
```

This returns ~6,800 objects in a typical org. Filter with `jq` or Python rather
than reading the whole payload:

```bash
sf api request rest "services/data/v66.0/sobjects" -o "$SF_TARGET_ORG" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['sobjects']))"
```

#### sObject listing does not show the whole data model

Two things are systematically invisible to every sObject-based method
(`sobjects`, `EntityDefinition`, `sf sobject list`, `sf sobject describe`):

- **Data model objects (DMOs).** DMOs carry the suffix `__dlm`. They are
  **absent from `EntityDefinition` entirely** — this query returns zero rows, not
  an error, even for DMOs that exist and hold data:

  ```bash
  sf data query -q "SELECT QualifiedApiName FROM EntityDefinition WHERE QualifiedApiName LIKE '%__dlm'" \
    -o "$SF_TARGET_ORG" --json     # -> 0 rows, always
  ```

  Only objects **materialised** in the data space appear in `sf sobject list`.
  Definitions that exist solely in the data model do not appear and cannot be
  queried — attempting it returns `UNSUPPORTED_QUERY` ("can't be queried …
  has been mapped"). To enumerate the full model, use the Data 360 Connect API
  — see [data360-connect-api](../data360-connect-api/SKILL.md).

- **Objects in other data spaces.** A sObject listing reflects one data space.

So `sf sobject list` answers "what can I query right now", **not** "what exists".
If those two questions have different answers in your org — and with DMOs they
usually do — do not use an sObject listing to count or enumerate the data model.

### Describe an object

```bash
sf sobject describe --sobject Account --target-org "$SF_TARGET_ORG" --json
```

Returns every field with type, label, and flags. To find the fields you must
supply on insert:

```bash
sf sobject describe -s Account -o "$SF_TARGET_ORG" --json \
  | python3 -c "
import json,sys
for f in json.load(sys.stdin)['result']['fields']:
    if f['createable'] and not f['nillable']:
        auto = ' (auto-populated)' if f.get('defaultedOnCreate') else ''
        print(f\"{f['name']} ({f['type']}){auto}\")"
```

Fields marked `auto-populated` have a default and can be omitted. Note that a
standard object like Account may have **zero** fields that are both required and
non-defaulted — that is a valid result, not a failed query.

### Call an arbitrary REST endpoint

```bash
./scripts/sf-api.sh --path /limits
./scripts/sf-api.sh --method POST --path /some/endpoint --body '{"key":"value"}'
```

### Check org limits

```bash
sf org list limits --target-org "$SF_TARGET_ORG" --json
```

Or via REST, which returns the same data keyed by limit name:

```bash
./scripts/sf-api.sh --path /limits
```

## Gotchas

- **`--json` is required for machine-readable output.** Without it, `sf` prints
  a human-formatted table that is hard to parse.
- **`sf data query` caps at 10,000 records** before it stops paginating. Use
  `sf data export bulk` beyond that.
- **SOQL has no `SELECT *`.** Enumerate fields explicitly.
- **`sf sobject describe` on a large object is a big payload** (Account has 273
  fields). Filter before printing.
- **Tooling API queries need `--use-tooling-api`**, otherwise you get
  `INVALID_TYPE` for metadata objects.
- **API version matters.** Pass `--api-version` to pin one; the default follows
  the org's version.
- **An unknown query parameter is ignored, not rejected.** The Data 360 and
  Connect APIs silently drop parameters they do not recognise and apply their own
  default, so a typo produces a plausible but wrong result set instead of an
  error. Sending `batchSize=200` to an endpoint whose parameter is `limit`
  returns the default 50 rows — which reads as "there are only 50 of these".

  `sf-api.sh` warns on unrecognised parameters using the catalog:

  ```bash
  ./scripts/sf-api.sh --path /ssot/data-model-objects --query 'batchSize=200'
  # sf-api: warning: unrecognised query parameter(s) for GET /ssot/data-model-objects:
  # sf-api:          batchSize
  # sf-api:          declared parameters: limit, offset, orderBy
  ```

  Never trust a count that could have been truncated by a default. Confirm the
  parameter name from the catalog first:

  ```bash
  node scripts/catalog-search.mjs describe segments.get-segments
  ```

- **Pagination parameters are inconsistent across endpoints.** Within the same
  API family, `/ssot/segments` takes `batchSize` while `/ssot/data-model-objects`
  takes `limit`. Do not assume a family-wide convention.

## Reference

- [SOQL and describe reference](./references/soql-and-describe.md)
