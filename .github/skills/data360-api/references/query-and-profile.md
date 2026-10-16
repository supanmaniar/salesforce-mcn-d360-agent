# Data 360 Query and Profile API Reference

Base: `{tenantUrl}` (e.g. `https://my-tenant.c360a.salesforce.com`)
Auth scope: `api cdp_query_api cdp_profile_api cdp_ingest_api`

> These paths have **no** `/services/data/vXX` prefix. They are served from the
> tenant host, so use `./scripts/sf-api.sh --tenant`.

## Query API v1 (synchronous)

```
POST /api/v1/query
```

```json
{ "sql": "SELECT ssot__Id__c, ssot__FirstName__c FROM ssot__Individual__dlm LIMIT 10" }
```

Returns rows directly. Suitable for small result sets.

## Query API v2 (asynchronous)

```
POST /api/v2/query          -> { "nextBatchId": "..." }
GET  /api/v2/query/:nextBatchId
```

Use v2 for anything large. Poll the batch id until rows appear.

## Profile API

| Operation | Method | Path |
| --- | --- | --- |
| Profile metadata | GET | `/api/v1/profile/metadata` |
| DMO metadata | GET | `/api/v1/profile/metadata/:dmoApiName` |
| Get profile | GET | `/api/v1/profile/:dmoApiName/:dmoRecordId` |
| Search profile | GET | `/api/v1/profile/:dmoApiName/:searchKey` |
| Child records | GET | `/api/v1/profile/:dmoParentApiName/:dmoParentRecordId/:dmoChildApiName` |
| Child by search key | GET | `/api/v1/profile/:dmoParentApiName/:searchKey/:dmoChildApiName` |
| Calculated insight | GET | `/api/v1/profile/:dmoApiName/:dmoRecordId/calculated-insights/:insightName` |

## Metadata API

| Operation | Method | Path |
| --- | --- | --- |
| List metadata | GET | `/api/v1/metadata` |

Returns DMO and field definitions. Large payload — filter where possible.

## Data Graph API

| Operation | Method | Path |
| --- | --- | --- |
| Graph metadata | GET | `/api/v1/dataGraph/metadata` |
| Graph record | GET | `/api/v1/dataGraph/:dataGraphName/:dataGraphRecordId` |
| Graph by name | GET | `/api/v1/dataGraph/:dataGraphName` |

## Calculated Insights API

| Operation | Method | Path |
| --- | --- | --- |
| Insight metadata | GET | `/api/v1/insight/metadata` |
| One insight's metadata | GET | `/api/v1/insight/metadata/:ci_name` |
| Insight value | GET | `/api/v1/insight/calculated-insights/:ci_name` |

## Universal ID Lookup

```
GET /api/v1/universalIdLookup/:entityName/:dataSourceId__c/:dataSourceObjectId__c/:sourceRecordId__c
```

Resolves a source-system record to its unified profile id.

## Ingestion API

| Operation | Method | Path |
| --- | --- | --- |
| Create job | POST | `/api/v1/ingest/jobs` |
| List jobs | GET | `/api/v1/ingest/jobs` |
| Get job | GET | `/api/v1/ingest/jobs/:jobId` |
| Update job | PATCH | `/api/v1/ingest/jobs/:jobId` |
| Delete job | DELETE | `/api/v1/ingest/jobs/:jobId` |
| Upload batches | PUT | `/api/v1/ingest/jobs/:jobId/batches` |
| Test source | POST | `/api/v1/ingest/sources/Event_API/runner_profiles/actions/test` |

Ingestion is multi-step: create the job, upload batches, then close it. An open
job does not process.

## Naming conventions

| Suffix | Meaning |
| --- | --- |
| `__dlm` | Data Lake Object (DLO) — raw ingested data |
| `__dmo` | Data Model Object — harmonized model |
| `__c` | Custom field on a standard object |

Query DLOs with `__dlm` names, e.g. `ssot__Individual__dlm`.
