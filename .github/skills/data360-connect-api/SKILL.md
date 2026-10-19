---
name: data360-connect-api
description: 'Call Salesforce Data 360 Connect APIs (data streams, segments, activations, identity resolutions, connections, data spaces, data kits, calculated insights, machine learning, clean rooms, data governance, data model objects, data lake objects) from the Salesforce CLI without an MCP server. Use when managing Data 360 data streams, building or activating segments, configuring identity resolution, enumerating data model objects (DMOs) or data lake objects (DLOs), or working with any /ssot endpoint. Includes the paging semantics per endpoint, because several /ssot endpoints truncate silently under naive offset loops.'
---

# Data 360 Connect API

Replaces the MCP server's `mcnext_*` catalog tools for the `data360-connect`
family — the largest family, with **383 endpoints across 35 resource groups**.

## When to Use

- Managing data streams, connections, and connectors
- Creating, updating, or activating segments
- Configuring identity resolution rulesets and match rules
- Working with data spaces, data kits, and data governance
- Calculated insights, machine learning, notebook AI, clean rooms
- Any endpoint whose path begins `/ssot/`

## Routing

`data360-connect` endpoints are served from the **org instance** under
`/services/data/vXX/ssot/...`:

```
{instanceUrl}/services/data/v66.0/ssot/segments
```

Use [sf-api.sh](../../../scripts/sf-api.sh) in its default (instance) mode. Do
**not** pass `--tenant` — that is only for the `data360` family.

## Procedure

1. **Discover the endpoint.** With 383 endpoints, always filter:

   ```bash
   node scripts/catalog-search.mjs list --family data360-connect --group Segments
   node scripts/catalog-search.mjs list --family data360-connect --search "activation"
   node scripts/catalog-search.mjs list --family data360-connect --kind create
   ```

2. **Inspect parameters and body shape:**

   ```bash
   node scripts/catalog-search.mjs describe segments.create-segment
   ```

3. **Call it:**

   ```bash
   ./scripts/sf-api.sh --path /ssot/segments --query 'batchSize=20'
   ```

4. **For writes**, pass a JSON body matching the described schema:

   ```bash
   ./scripts/sf-api.sh --method POST --path /ssot/segments \
     --body @payload.json
   ```

## Resource Groups

The 35 groups, by endpoint count, with the write surface each exposes. Generated
from the catalog — run `node scripts/catalog-search.mjs groups` for the live list.

| Group | Endpoints | Write | Group | Endpoints | Write |
| --- | ---: | --- | --- | ---: | --- |
| Data Governance | 59 | ✅ | Activation Platforms | 13 | ✅ |
| Machine Learning | 37 | ✅ | Data Shares | 11 | ✅ |
| Notebook AI | 35 | ✅ | Data Kits | 10 | ✅ |
| Connections | 23 | ✅ | Document AI | 10 | ✅ |
| Activations | 21 | ✅ | Segments | 10 | ✅ |
| Clean Rooms | 19 | ✅ | Data Graphs | 8 | ✅ |
| Activation Targets | 16 | ✅ | Data Spaces | 8 | ✅ |
| Data Model Objects | 14 | ✅ | Metadata | 8 | read-only |
| Data Transforms | 14 | ✅ | Calculated Insights | 6 | ✅ |
| Activation External Platforms | 2 | read-only | Data Streams | 6 | ✅ |
| Agent Configuration | 4 | ✅ | Identity Resolutions | 6 | ✅ |
| Private Network Routes | 4 | ✅ | Profile | 6 | read-only |
| Query (Current) | 4 | ✅ | Search Index | 6 | ✅ |
| Insights | 3 | read-only | Data Action Targets | 5 | ✅ |
| Query V1 & V2 | 3 | create only | Data Lake Objects | 5 | ✅ |
|  |  |  | Connectors | 2 | read-only |
| Data Actions | 2 | create only | Auth | 1 | read-only |
| Universal ID Lookup | 1 | read-only | Limits | 1 | read-only |

Read-only groups expose no `POST`/`PATCH`/`PUT`/`DELETE` at all. "create only"
means `POST` exists but no update or delete.

### Measured reachability

Not every catalogued endpoint is reachable in every org. Probing one read per
group against a live org returned **27 of 35 reachable**, with these exceptions:

| Group | Read result | Cause |
| --- | --- | --- |
| Data Governance | `NOT_FOUND` on all 8 paramless GETs | Feature not enabled in this org |
| Activation Platforms | `NOT_FOUND` on every path and method | Unresolved — see the note below |
| Data Kits | `INTERNAL_SERVER_ERROR` | Server-side null dereference — a Salesforce bug, not an auth issue |

Provisioning state varies by org, so treat a `NOT_FOUND` as "not enabled here"
rather than "wrong path". Verify the feature exists before assuming a typo.

**Activation Platforms is genuinely unresolved.** A 404 could mean "not enabled"
or "wrong path", and no other path in this group responded either
(`/ssot/activation-targets/metadata/activation-platforms` also 404s). Both
readings remain open:

- A separate investigation reports **403 with `activationPlatformView=All`**,
  which would mean enabled-but-forbidden. On the org measured here that request
  returns **404** instead, so the two orgs differ.
- Use `/ssot/activation-external-platforms`, which works and returns a platform
  catalogue.

Do not conclude the feature is absent, and do not conclude it is present. Report
the status code and let the user interpret it.

### Query — this is how you read Data 360 records

The two query groups are the data-access path, and both work:

| Group | Endpoint | Style |
| --- | --- | --- |
| Query (Current) | `POST /ssot/query-sql` | Rows as positional arrays |
| Query V1 & V2 | `POST /ssot/query` | Rows as named objects |

```bash
./scripts/sf-api.sh --method POST --path /ssot/query \
  --body '{"sql":"SELECT ssot__Id__c FROM ssot__Individual__dlm LIMIT 2"}'
```

Both execute real SQL and return rows. `query-sql` returns `data` as arrays with
a parallel `metadata` array; `/ssot/query` returns objects keyed by field name.

**CRUD applies here exactly as it does at the sObject layer: read only.** The
`POST` is an RPC-style body for submitting SQL, not a create. SQL is limited to
`SELECT` — there is no DML through these endpoints, matching the record-level
read-only behaviour of DMOs and DLOs. Writes go through the Ingestion API.

## Common Operations

| Operation | Method | Path |
| --- | --- | --- |
| List segments | GET | `/ssot/segments` |
| Create segment | POST | `/ssot/segments` |
| Get segment | GET | `/ssot/segments/:segmentApiNameOrId` |
| Update segment | PATCH | `/ssot/segments/:segmentApiName` |
| Delete segment | DELETE | `/ssot/segments/:segmentApiName` |
| List data streams | GET | `/ssot/data-streams` |
| List data spaces | GET | `/ssot/data-spaces` |
| List identity resolutions | GET | `/ssot/identity-resolutions` |
| List activations | GET | `/ssot/activations` |
| List connections | GET | `/ssot/connections` |
| List data model objects | GET | `/ssot/data-model-objects` |
| Get one data model object | GET | `/ssot/data-model-objects/:dataModelObjectName` |
| List object mappings | GET | `/ssot/data-model-object-mappings` |
| List data lake objects | GET | `/ssot/data-lake-objects` |

### Enumerating data model objects

There are two routes, and they answer different questions.

**"What does this org actually use?" — one call, fast. This is usually what you want.**

```bash
./scripts/sf-api.sh --path /ssot/metadata --query 'entityType=DataModelObject'
```

Returns only the DMOs **in use** in the org, with fields, types, primary keys and
**active** relationships, in a single request. Measured: **68 objects in ~9s** on
an org whose full catalogue is 1,067.

**"What exists in the data model?" — the full catalogue.**

`GET /ssot/data-model-objects` lists every DMO, used or not:

```bash
# The full model, with fields, categories and data spaces
./scripts/sf-api.sh --path /ssot/data-model-objects --query 'limit=500&offset=0'
```

This response is large — each DMO carries all of its fields — and there is **no
`totalSize`**, so you can only learn the count by paging to exhaustion. Measured
at **20–40s per page of 200**. Prefer `/ssot/metadata` unless you specifically
need the unused catalogue.

Page it by walking `offset` and stop on a **short page**, which is safe here
because this endpoint pads consistently:

```bash
off=0
while : ; do
  ./scripts/sf-api.sh --path /ssot/data-model-objects \
    --query "limit=500&offset=$off" --raw > /tmp/page.json
  n=$(python3 -c "import json;print(len(json.load(open('/tmp/page.json')).get('dataModelObject') or []))")
  [ "$n" -le 0 ] && break
  python3 -c "
import json
for o in json.load(open('/tmp/page.json')).get('dataModelObject') or []:
    print(o['name'])"
  [ "$n" -lt 500 ] && break
  off=$((off+500))
done | sort -u
```

> **Do not reuse that loop for other endpoints.** It is safe *only* here.
> `/ssot/data-lake-objects` returns short pages mid-sequence, so a short-page
> loop silently truncates it — see [Paging](#paging-read-this-before-writing-a-loop).

**Defined is not the same as materialised.** A DMO can exist in the data model
without being queryable:

| | Meaning | How to enumerate |
| --- | --- | --- |
| **Defined** | Exists in the data model. Every DMO. | `GET /ssot/data-model-objects` |
| **Materialised** | Has storage in a data space, so SOQL works on it. | `sf sobject list` (suffix `__dlm`) |

Materialised objects are always a **small subset** of defined ones — expect the
count from `/ssot/data-model-objects` to be far larger than the `__dlm` count in
`sf sobject list`.

Querying a defined-but-unmaterialised DMO fails outright rather than returning
zero rows:

```text
UNSUPPORTED_QUERY
The object ssot__AgentWork__dlm can't be queried.
Verify that ssot__AgentWork__dlm exists and has been mapped.
```

"Has been mapped" is the operative phrase: the object needs an object mapping
(`/ssot/data-model-object-mappings`) before it can hold or return data.

**The listing response has no total.** `/ssot/data-model-objects` returns
`{"dataModelObject": [...]}` with no `totalSize` and no `nextPageUrl`, so the
count is only obtainable by paging to exhaustion. Its sibling
`/ssot/data-lake-objects` *does* return `totalSize` — do not assume consistency.

Measurements from a real org, to give a sense of the gap: **1,067** DMOs defined
against **45** materialised and queryable.

### Data lake objects

DLOs use the suffix `__dll` and are enumerated by `GET /ssot/data-lake-objects`,
which returns `totalSize` (60 in the org measured). They are **queryable but
invisible to sObject enumeration**: `SELECT Id FROM Account_Home__dll` works and
`sf sobject describe -s Account_Home__dll` returns 119 fields, yet the object
appears in neither `sf sobject list` nor `EntityDefinition`. Never conclude a
DLO does not exist because a listing omits it.

`SELECT COUNT()` is **not supported on DLOs**:

```text
UNSUPPORTED_QUERY: SELECT COUNT() is not supported by Account_Home__dll.
```

Use `SELECT Id ... LIMIT n` and page, or read `totalSize` from the listing
endpoint. `SELECT COUNT()` on a DMO works normally.

## Gotchas

- **Some creates have no matching delete.** The catalog exposes collection-level
  `POST` endpoints with no `DELETE` on the same resource, so a created object may
  not be removable through this API. Confirmed by catalog inspection, **not**
  executed — treat as a caution to check before relying on reversal:

  | Create | Delete route |
  | --- | --- |
  | `POST /ssot/data-actions` | none |
  | `POST /ssot/machine-learning/alerts` | none (`PATCH` only) |
  | `POST /ssot/data-clean-room/collaborations` | none |
  | `POST /ssot/data-clean-room/providers` | none |
  | `POST /ssot/knowledge-space/library` | none (`.../library/remove-library` exists, but it is a distinct action, not a resource delete) |

  Contrast with resources that *are* reversible: `/ssot/data-kits/:name`,
  `/ssot/connections/:id`, `/ssot/knowledge-space/:name` and
  `/ssot/data-share/:nameOrId` all have `DELETE` routes. Note `data-share` is
  reversible even though the collection is `/ssot/data-share` while the list is
  `/ssot/data-shares` — do not infer reversibility from naming alone.

  The `destructive` flag does not cover this: a create is flagged
  `destructive: false` because the verb destroys nothing, which says nothing about
  whether the result can be removed. Check for a matching `DELETE` before creating
  anything you may need to undo.
- **Segment SQL is validated on write.** `POST`/`PATCH /ssot/segments` reject
  invalid SQL with a descriptive error — read it before retrying.
- **Deletes are destructive.** `DELETE /ssot/segments/:segmentApiName` removes
  the segment permanently. Confirm with the user first.
- **Pagination parameter names and semantics are not consistent across this
  family.** `/ssot/segments` takes `batchSize` + `offset`; `/ssot/data-model-objects`
  takes `limit` + `offset`. Check the endpoint in the catalog before assuming:

  ```bash
  node scripts/catalog-search.mjs describe segments.get-segments
  ```

  Semantics differ too, and one difference is silent. **`/ssot/data-streams`
  counts `offset` from 1** — `offset=0` and `offset=1` return the same first
  page. Confirmed live:

  ```text
  limit=2&offset=0  ->  AccountScoreAdjustment_Home, Account_Home
  limit=2&offset=1  ->  AccountScoreAdjustment_Home, Account_Home   # same page
  limit=2&offset=2  ->  Account_Home, AgenticConnector_...
  ```

  So an offset loop over data streams re-reads the first page and misses the
  last. Follow `nextPageUrl` for this endpoint instead. See
  [Paging](#paging--read-this-before-writing-a-loop) for the full table.

- **An unknown query parameter is silently ignored.** The API applies its own
  default instead of erroring, so a mistyped parameter yields a plausible but
  wrong result. `/ssot/data-model-objects` defaults to `limit=50`, which makes a
  large model look small. `sf-api.sh` warns when a parameter is not declared:

  ```bash
  ./scripts/sf-api.sh --path /ssot/data-model-objects --query 'batchSize=200'
  # sf-api: warning: unrecognised query parameter(s) for GET /ssot/data-model-objects:
  # sf-api:          batchSize
  # sf-api:          declared parameters: limit, offset, orderBy
  ```

  Never report a count that could have been truncated by an unnoticed default.
- **DMOs and DLOs are absent from `EntityDefinition` and from most sObject
  tooling.** Use `/ssot/data-model-objects` for definitions, `sf sobject list`
  for one subset of materialised objects, and `/ssot/data-lake-objects` for
  DLOs. No single surface is a superset of the others.

## Paging — read this before writing a loop

**Paging semantics differ per endpoint, and one difference silently truncates
results.** Verified on a live org:

| Endpoint | Paging | Notes |
| --- | --- | --- |
| `/ssot/data-model-objects` | `limit` + `offset` from 0 | No `totalSize`; short page does mean end |
| `/ssot/segments` | `batchSize` + `offset` from 0 | Returns `totalSize` |
| `/ssot/activations` | `batchSize` + `offset` from 0 | No `totalSize` |
| `/ssot/data-streams` | `nextPageUrl` | **`offset` counts from 1** — `offset=0` and `offset=1` return the same first page |
| `/ssot/data-lake-objects` | `nextPageUrl` | **`limit` caps at 20**; pages can be short mid-sequence |
| `/ssot/calculated-insights` | `pageToken` + `offset` | `offset` is still required |

#### The trap: short pages do not mean the end

`/ssot/data-lake-objects` caps `limit` at 20 and filters out other data spaces
**after** paging, so a page in the middle can be shorter than the one before it:

```text
limit=20  offset=0   -> 18 items   totalSize=80
limit=20  offset=20  -> 17 items   totalSize=80
limit=20  offset=40  -> 20 items   totalSize=80
limit=20  offset=60  -> 15 items   nextPageUrl absent
```

A loop that stops when a page comes back short returns **18 of 80 objects** and
reports success. That is the worst failure mode: a plausible number, no error, no
warning.

**Follow `nextPageUrl` instead.** It is the only reliable traversal for the
endpoints that expose it:

```bash
path='/ssot/data-lake-objects?limit=20'
while : ; do
  ./scripts/sf-api.sh --path "$path" --raw > /tmp/page.json
  python3 -c "
import json
for o in json.load(open('/tmp/page.json')).get('dataLakeObjects') or []:
    print(o.get('name'))"
  next_url=$(python3 -c "
import json
print((json.load(open('/tmp/page.json')).get('nextPageUrl') or '').split('/services/data/v66.0',1)[-1])")
  [ -z "$next_url" ] && break
  path="$next_url"
done | sort -u
```

Do not let it loop forever — cap the iterations. If a `nextPageUrl` ever repeats,
stop and treat the result as partial.

#### `totalSize` can overcount

`/ssot/data-lake-objects` reports `totalSize=80` while following `nextPageUrl` to
completion yields **70 unique items**. The total includes rows the endpoint then
filters out by data space. So:

> Never report `totalSize` as the number of items you retrieved. Compare the two,
> and treat a gap as normal for this endpoint rather than as a bug in your loop.

#### Detect truncation rather than trusting it

If you must report a count, report what you collected and whether the traversal
completed. A partial result stated honestly is useful; a partial result presented
as complete is worse than no answer.

- **Segment criteria can be absent.** Some segments (nested, some UI-created,
  vector-search) return an empty `includeCriteria` even in their details. Record
  it as unavailable; do not infer the segment matches everything.
- **`/ssot/data-model-object-mappings` needs `dmoDeveloperName`.** There is no
  call for all mappings, and a `404 NOT_FOUND` means *that DMO has no mappings*,
  not that the request was wrong.
- **Data 360 records are read-only over REST and SOQL.** All 45 materialised DMOs
  report `createable=false, updateable=false, deletable=false, queryable=true` —
  unanimously, with no exceptions. Attempts are rejected server-side:

  ```text
  POST   /sobjects/ssot__Individual__dlm       -> CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY
  PATCH  /sobjects/ssot__Individual__dlm/{Id}  -> CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY
  DELETE /sobjects/ssot__Individual__dlm/{Id}  -> CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY
  ```

  **This is a property of the object, not of your permissions.** An admin sees the
  same flags, so do not retry with elevated access.

  Do not over-generalise this into "Data 360 objects reject DML". It applies to
  the **data** objects — DMOs (`__dlm`) and DLOs (`__dll`). Data 360 *configuration*
  objects are ordinary sObjects and accept DML normally; `DataStream` is
  `createable/updateable/deletable = true`.

  **Write capability exists at the definition layer, not the record layer.** You
  can create/update/delete DMO and DLO *definitions* and mappings via the `/ssot`
  endpoints above, but you cannot write the *records* they hold. Data enters via
  the Ingestion API on the tenant host (`data360` family,
  [data360-api](../data360-api/SKILL.md)) — not via sObject DML.

  If a user asks to insert or update Data 360 records, the answer is "not this
  way"; route them to the Ingestion API rather than attempting DML.
- **`SELECT COUNT()` is unsupported on DLOs** (`__dll`), though it works on DMOs.
  Page with `SELECT Id ... LIMIT n` rather than trusting a listing total — see
  the next point.
- **A listing `totalSize` can overcount what you can retrieve.**
  `/ssot/data-lake-objects` reported `totalSize=80` while walking `nextPageUrl` to
  completion yielded **70 unique items**: the total includes rows the endpoint
  then filters out by data space. Report what you collected, not the total.
- **`/ssot/data-model-objects` returns no `totalSize` at all.** Here a short page
  does mean the end, but do not generalise that: see
  [Paging](#paging--read-this-before-writing-a-loop).
- **A catalog `required=false` does not mean the API accepts the call without it.**
  `/ssot/connections` declares `connectorType` as optional, but omitting it fails:

  ```text
  GET /ssot/connections
  -> ILLEGAL_QUERY_PARAMETER_VALUE: ConnectorType must be provided
  ```

  `connectorType` is case-sensitive, and the value must be one the org supports —
  an unknown connector type is rejected rather than returning an empty list:

  ```text
  GET /ssot/connections?connectorType=Gcs
  -> ILLEGAL_QUERY_PARAMETER_VALUE: ConnectorType [Gcs] is not supported
  ```

  The catalog is generated from Salesforce's Postman collections, which do not
  always encode endpoint-level requirements. Treat its `required` flags as a
  starting point, and read the error when a call fails — these messages name the
  missing parameter, so they are worth more than the metadata.
- **`orderByExpression` uses bracket syntax**, e.g. `[Name asc]`.
- **Some operations are asynchronous** (segment publish, data transforms,
  ML predictions). See [async-jobs-and-cache](../async-jobs-and-cache/SKILL.md).

## Reference

- [Segments and activations reference](./references/segments-and-activations.md)
- [ENDPOINT-INDEX.md](../../../catalog/ENDPOINT-INDEX.md) — all 383 endpoints
