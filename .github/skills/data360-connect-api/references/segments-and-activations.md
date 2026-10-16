# Segments and Activations Reference

Base: `{instanceUrl}/services/data/v66.0`
Auth scope: `api cdp_query_api cdp_profile_api`

## Segments

| Operation | Method | Path |
| --- | --- | --- |
| List segments | GET | `/ssot/segments` |
| Create segment | POST | `/ssot/segments` |
| Get segment | GET | `/ssot/segments/:segmentApiNameOrId` |
| Update segment | PATCH | `/ssot/segments/:segmentApiName` |
| Delete segment | DELETE | `/ssot/segments/:segmentApiName` |

### List response shape

```json
{
  "batchSize": 20,
  "offset": 0,
  "orderByExpression": "[Name asc]",
  "segments": [
    {
      "apiName": "NA_Webinar_Leads",
      "displayName": "NA Webinar Leads",
      "segmentType": "Dynamic",
      "segmentStatus": "ACTIVE",
      "publishStatus": "SUCCESS",
      "lastSegmentMemberCount": 502,
      "lookbackPeriod": "P90D",
      "publishInterval": "NO_REFRESH",
      "segmentOnApiName": "UnifiedssotIndividualSm01__dlm",
      "dataSpace": "default"
    }
  ],
  "totalSize": 38
}
```

`segmentStatus` is the lifecycle state (`ACTIVE` / `DRAFT`); `publishStatus` is
the outcome of the last publish (`SUCCESS` / `ERROR`). Use `publishStatus` when
waiting on a publish.

### Single-segment responses are wrapped

`GET /ssot/segments/:name` returns `{"segments":[{...}]}`, not a bare object.
Unwrap before reading fields.

### Segment types

| Type | Meaning |
| --- | --- |
| `Dynamic` | Membership recalculated on a schedule |
| `Static` | Membership frozen at publish time |

### Publish intervals

| Value | Meaning |
| --- | --- |
| `NO_REFRESH` | Manual publish only |
| Others | Scheduled refresh cadence |

### Creating a segment

The `sql` property is validated on write. Invalid SQL is rejected with a
descriptive error — read it before retrying.

```bash
./scripts/sf-api.sh --method POST --path /ssot/segments --body @segment.json
```

## Activations

| Operation | Method | Path |
| --- | --- | --- |
| List activations | GET | `/ssot/activations` |
| Create activation | POST | `/ssot/activations` |
| Get activation | GET | `/ssot/activations/:activationId` |
| Update activation | PATCH | `/ssot/activations/:activationId` |
| Delete activation | DELETE | `/ssot/activations/:activationId` |

Related groups: **Activation Targets** (12 endpoints), **Activation Platforms**
(12), **Activation External Platforms** (12), **Data Action Targets** (9).

## Identity Resolution

| Operation | Method | Path |
| --- | --- | --- |
| List rulesets | GET | `/ssot/identity-resolutions` |
| Get ruleset | GET | `/ssot/identity-resolutions/:id` |
| Create ruleset | POST | `/ssot/identity-resolutions` |
| Update ruleset | PATCH | `/ssot/identity-resolutions/:id` |

Response includes consolidation metrics:

```json
{
  "identityResolutions": [
    {
      "configurationType": "individual",
      "consolidationRate": 4,
      "anonymousUnifiedProfiles": 0
    }
  ]
}
```

## Data Streams

| Operation | Method | Path |
| --- | --- | --- |
| List data streams | GET | `/ssot/data-streams` |
| Get data stream | GET | `/ssot/data-streams/:id` |
| Create data stream | POST | `/ssot/data-streams` |
| Update data stream | PATCH | `/ssot/data-streams/:id` |
| Delete data stream | DELETE | `/ssot/data-streams/:id` |

## Data Spaces

| Operation | Method | Path |
| --- | --- | --- |
| List data spaces | GET | `/ssot/data-spaces` |
| Get data space | GET | `/ssot/data-spaces/:id` |

Every org has a `default` data space that can be renamed but not deleted.

## Pagination

All list endpoints accept `batchSize` and `offset`, and return a
`currentPageUrl` you can follow directly:

```bash
./scripts/sf-api.sh --path /ssot/segments --query 'batchSize=50&offset=50'
```

## Destructive operations

`DELETE` on segments, activations, data streams, and identity resolutions is
permanent. Confirm with the user before invoking, and prefer reading the
resource first to confirm you have the right id.
