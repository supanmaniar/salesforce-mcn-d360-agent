# Endpoint Index

Generated from `catalog/endpoints.json` — 445 endpoints across 3 API families and 44 resource groups.

Regenerate with `node scripts/catalog-search.mjs index > catalog/ENDPOINT-INDEX.md`.

| Family | Endpoints | Base | Auth scope |
| --- | --- | --- | --- |
| `mc-next` | 27 | `mc-next` | `sfdc_cms_api` |
| `data360` | 35 | `data360` | `api cdp_query_api cdp_profile_api cdp_ingest_api` |
| `data360-connect` | 383 | `data360-connect` | `api cdp_query_api cdp_profile_api` |

## Contents

- **Marketing Cloud Next** (`mc-next`) — 1 groups
  - [Content](#mc-next-content)
- **Data 360** (`data360`) — 9 groups
  - [Auth](#data360-auth)
  - [Metadata API](#data360-metadata-api)
  - [Calculated Insights API](#data360-calculated-insights-api)
  - [Query API V1](#data360-query-api-v1)
  - [Query API V2](#data360-query-api-v2)
  - [Data Graph API](#data360-data-graph-api)
  - [Query Unified Record ID](#data360-query-unified-record-id)
  - [Ingestion API](#data360-ingestion-api)
  - [Profile API](#data360-profile-api)
- **Data 360 Connect** (`data360-connect`) — 35 groups
  - [Auth](#data360-connect-auth)
  - [Activation External Platforms](#data360-connect-activation-external-platforms)
  - [Activation Platforms](#data360-connect-activation-platforms)
  - [Activation Targets](#data360-connect-activation-targets)
  - [Activations](#data360-connect-activations)
  - [Agent Configuration](#data360-connect-agent-configuration)
  - [Calculated Insights](#data360-connect-calculated-insights)
  - [Clean Rooms](#data360-connect-clean-rooms)
  - [Connections](#data360-connect-connections)
  - [Connectors](#data360-connect-connectors)
  - [Data Action Targets](#data360-connect-data-action-targets)
  - [Data Actions](#data360-connect-data-actions)
  - [Data Governance](#data360-connect-data-governance)
  - [Data Graphs](#data360-connect-data-graphs)
  - [Data Kits](#data360-connect-data-kits)
  - [Data Lake Objects](#data360-connect-data-lake-objects)
  - [Data Model Objects](#data360-connect-data-model-objects)
  - [Data Shares](#data360-connect-data-shares)
  - [Data Spaces](#data360-connect-data-spaces)
  - [Data Streams](#data360-connect-data-streams)
  - [Data Transforms](#data360-connect-data-transforms)
  - [Document AI](#data360-connect-document-ai)
  - [Identity Resolutions](#data360-connect-identity-resolutions)
  - [Insights](#data360-connect-insights)
  - [Machine Learning](#data360-connect-machine-learning)
  - [Metadata](#data360-connect-metadata)
  - [Notebook AI](#data360-connect-notebook-ai)
  - [Private Network Routes](#data360-connect-private-network-routes)
  - [Profile](#data360-connect-profile)
  - [Query V1 & V2](#data360-connect-query-v1-v2)
  - [Query (Current)](#data360-connect-query-current-)
  - [Search Index](#data360-connect-search-index)
  - [Segments](#data360-connect-segments)
  - [Universal ID Lookup](#data360-connect-universal-id-lookup)
  - [Limits](#data360-connect-limits)

## Marketing Cloud Next (`mc-next`)

Base: `mc-next` · Auth scope: `sfdc_cms_api`

### Content

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `content.search-content-in-workspace` | GET | `/connect/cms/items/search` | query |
| `content.search-by-title-only` | GET | `/connect/cms/items/search` | query |
| `content.filter-by-content-type` | GET | `/connect/cms/items/search` | query |
| `content.filter-by-language` | GET | `/connect/cms/items/search` | query |
| `content.create-a-workspace` | POST | `/connect/cms/spaces` | create |
| `content.retrieve-a-workspace-by-id` | GET | `/connect/cms/spaces/:contentSpaceOrFolderId` | read |
| `content.retrieve-a-workspace-by-name` | GET | `/connect/cms/spaces/` | query |
| `content.retrieve-all-workspaces` | GET | `/connect/cms/spaces` | query |
| `content.update-a-workspace` | PATCH | `/connect/cms/spaces/:contentSpaceOrFolderId` | update |
| `content.create-an-email-with-html` | POST | `/connect/cms/contents` | create |
| `content.create-an-email-with-components` | POST | `/connect/cms/contents` | create |
| `content.update-an-html-email` | PUT | `/connect/cms/contents/variants/:variantId` | update |
| `content.update-a-component-email` | PUT | `/connect/cms/contents/variants/:variantId` | update |
| `content.retrieve-an-email-by-id-or-key` | GET | `/connect/cms/contents/:contentKey` | read |
| `content.delete-an-email` ⚠️ | DELETE | `/connect/cms/contents/variants/:variantId` | delete |
| `content.publish-an-email` | POST | `/connect/cms/contents/publish` | action |
| `content.unpublish-an-email` ⚠️ | POST | `/connect/cms/contents/unpublish` | action |
| `content.clone-an-email` | POST | `/connect/cms/contents/:contentKey/clone` | action |
| `content.create-an-email-template-with-components` | POST | `/connect/cms/contents` | create |
| `content.create-an-email-template-with-html` | POST | `/connect/cms/contents` | create |
| `content.update-a-component-email-template` | PUT | `/connect/cms/contents/variants/:variantId` | update |
| `content.update-an-html-email-template` | PUT | `/connect/cms/contents/variants/:variantId` | update |
| `content.retrieve-an-email-template-by-id-or-key` | GET | `/connect/cms/contents/:contentKey` | read |
| `content.delete-an-email-template` ⚠️ | DELETE | `/connect/cms/contents/variants/:variantId` | delete |
| `content.publish-an-email-template` | POST | `/connect/cms/contents/publish` | action |
| `content.unpublish-an-email-template` ⚠️ | POST | `/connect/cms/contents/unpublish` | action |
| `content.clone-an-email-template` | POST | `/connect/cms/contents/:contentKey/clone` | action |

## Data 360 (`data360`)

Base: `data360` · Auth scope: `api cdp_query_api cdp_profile_api cdp_ingest_api`

### Auth

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `auth.complete-postman-authentication` | GET | `/services/oauth2/userinfo` | query |

### Metadata API

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `metadata-api.global-metadata` | GET | `/api/v1/metadata/` | query |
| `metadata-api.metadata-by-type` | GET | `/api/v1/metadata` | query |
| `metadata-api.metadata-by-entity` | GET | `/api/v1/metadata` | query |
| `metadata-api.metadata-by-category` | GET | `/api/v1/metadata` | query |

### Calculated Insights API

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `calculated-insights-api.query-calculated-insights` | GET | `/api/v1/insight/calculated-insights/:ci_name` | read |
| `calculated-insights-api.metadata-individual-calculated-insight` | GET | `/api/v1/insight/metadata/:ci_name` | read |
| `calculated-insights-api.metadata-all-calculated-insights` | GET | `/api/v1/insight/metadata` | query |

### Query API V1

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `query-api-v1.query` | POST | `/api/v1/query` | action |
| `query-api-v1.query-with-limits` | POST | `/api/v1/query` | action |

### Query API V2

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `query-api-v2.query` | POST | `/api/v2/query` | action |
| `query-api-v2.query-next-batch` | GET | `/api/v2/query/:nextBatchId` | read |

### Data Graph API

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-graph-api.metadata-of-all-data-graphs` | GET | `/api/v1/dataGraph/metadata` | query |
| `data-graph-api.metadata-of-a-data-graph` | GET | `/api/v1/dataGraph/metadata` | query |
| `data-graph-api.query-data-graph-data` | GET | `/api/v1/dataGraph/:dataGraphName/:dataGraphRecordId` | read |
| `data-graph-api.query-data-graph-data-using-lookup-keys` | GET | `/api/v1/dataGraph/:dataGraphName` | read |

### Query Unified Record ID

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `query-unified-record-id.query` | GET | `/api/v1/universalIdLookup/:entityName/:dataSourceId__c/:dataSourceObjectId__c/:sourceRecordId__c` | read |

### Ingestion API

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `ingestion-api.insert-records` | POST | `/api/v1/ingest/sources/Event_API/runner_profiles` | create |
| `ingestion-api.delete-records` ⚠️ | DELETE | `/api/v1/ingest/sources/Event_API/runner_profiles` | delete |
| `ingestion-api.sync-record-validation` | POST | `/api/v1/ingest/sources/Event_API/runner_profiles/actions/test` | action |
| `ingestion-api.create-job` | POST | `/api/v1/ingest/jobs` | create |
| `ingestion-api.upload-job` | PUT | `/api/v1/ingest/jobs/:jobId/batches` | update |
| `ingestion-api.close-job` | PATCH | `/api/v1/ingest/jobs/:jobId` | update |
| `ingestion-api.abort-job` | PATCH | `/api/v1/ingest/jobs/:jobId` | update |
| `ingestion-api.delete-job` ⚠️ | DELETE | `/api/v1/ingest/jobs/:jobId` | delete |
| `ingestion-api.get-job-info` | GET | `/api/v1/ingest/jobs/:jobId` | read |
| `ingestion-api.get-all-jobs` | GET | `/api/v1/ingest/jobs` | query |

### Profile API

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `profile-api.metadata` | GET | `/api/v1/profile/metadata` | query |
| `profile-api.metadata-dmo` | GET | `/api/v1/profile/metadata/:dmoApiName` | read |
| `profile-api.dmo` | GET | `/api/v1/profile/:dmoApiName` | read |
| `profile-api.dmo-by-id` | GET | `/api/v1/profile/:dmoApiName/:dmoRecordId` | read |
| `profile-api.dmo-by-search-key` | GET | `/api/v1/profile/:dmoApiName/:searchKey` | read |
| `profile-api.dmo-and-children-by-id` | GET | `/api/v1/profile/:dmoParentApiName/:dmoParentRecordId/:dmoChildApiName` | read |
| `profile-api.dmo-and-children-by-search-key` | GET | `/api/v1/profile/:dmoParentApiName/:searchKey/:dmoChildApiName` | read |
| `profile-api.dmo-and-calculated-insight-by-id` | GET | `/api/v1/profile/:dmoApiName/:dmoRecordId/calculated-insights/:insightName` | read |

## Data 360 Connect (`data360-connect`)

Base: `data360-connect` · Auth scope: `api cdp_query_api cdp_profile_api`

### Auth

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `auth.user-info` | GET | `/services/oauth2/userinfo` | query |

### Activation External Platforms

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `activation-external-platforms.get-activation-external-platforms` | GET | `/ssot/activation-external-platforms` | query |
| `activation-external-platforms.get-activation-external-platform` | GET | `/ssot/activation-external-platforms/:idOrName` | read |

### Activation Platforms

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `activation-platforms.get-activation-platforms` | GET | `/ssot/activation-platforms` | query |
| `activation-platforms.create-activation-platform` | POST | `/ssot/activation-platforms` | create |
| `activation-platforms.delete-activation-platform` ⚠️ | DELETE | `/ssot/activation-platforms/:idOrName` | delete |
| `activation-platforms.get-activation-platform` | GET | `/ssot/activation-platforms/:idOrName` | read |
| `activation-platforms.update-activation-platform` | PATCH | `/ssot/activation-platforms/:idOrName` | update |
| `activation-platforms.disable-activation-platform` ⚠️ | POST | `/ssot/activation-platforms/:idOrName/actions/disable` | create |
| `activation-platforms.enable-activation-platform` | POST | `/ssot/activation-platforms/:idOrName/actions/enable` | create |
| `activation-platforms.publish-activation-platform` | POST | `/ssot/activation-platforms/:idOrName/actions/publish` | action |
| `activation-platforms.retry-activation-platform-sync` | POST | `/ssot/activation-platforms/:idOrName/actions/retry-sync` | create |
| `activation-platforms.set-activation-platform-privacy-type` | POST | `/ssot/activation-platforms/:idOrName/actions/set-privacy-type` | create |
| `activation-platforms.get-action-sources-for-an-event` | GET | `/ssot/activation-platforms/:idOrName/metadata/action-sources` | query |
| `activation-platforms.get-events-for-an-activation-platform` | GET | `/ssot/activation-platforms/:idOrName/metadata/events` | query |
| `activation-platforms.get-partner-object-types-for-an-activation-platform` | GET | `/ssot/activation-platforms/:idOrName/metadata/partner-object-types` | query |

### Activation Targets

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `activation-targets.get-activation-targets` | GET | `/ssot/activation-targets` | query |
| `activation-targets.create-activation-target` | POST | `/ssot/activation-targets` | create |
| `activation-targets.assign-ad-account` | POST | `/ssot/activation-targets/actions/:activationTargetId/assign-ad-account` | create |
| `activation-targets.disable-activation-target` ⚠️ | POST | `/ssot/activation-targets/actions/:activationTargetId/disable` | create |
| `activation-targets.enable-activation-target` | POST | `/ssot/activation-targets/actions/:activationTargetId/enable` | create |
| `activation-targets.retry-activation-target-sync` | POST | `/ssot/activation-targets/actions/:activationTargetId/retry-sync` | create |
| `activation-targets.get-activation-platform-metadata` | GET | `/ssot/activation-targets/metadata/activation-platforms` | query |
| `activation-targets.get-communication-capping-data-spaces` | GET | `/ssot/activation-targets/metadata/communication-capping-data-spaces` | query |
| `activation-targets.validate-data-space-account-for-target` | GET | `/ssot/activation-targets/metadata/dataspace-account-validation` | query |
| `activation-targets.get-marketing-cloud-enterprises` | GET | `/ssot/activation-targets/metadata/mc-enterprises` | query |
| `activation-targets.get-activation-target-platform-fields` | GET | `/ssot/activation-targets/metadata/target-platform-fields` | query |
| `activation-targets.delete-activation-target` ⚠️ | DELETE | `/ssot/activation-targets/:activationTargetId` | delete |
| `activation-targets.get-activation-target` | GET | `/ssot/activation-targets/:activationTargetId` | read |
| `activation-targets.update-activation-target` | PATCH | `/ssot/activation-targets/:activationTargetId` | update |
| `activation-targets.get-available-ad-accounts` | GET | `/ssot/activation-targets/:activationTargetId/available-ad-accounts` | query |
| `activation-targets.get-partner-objects` | GET | `/ssot/activation-targets/:activationTargetId/partner-objects` | query |

### Activations

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `activations.get-activations` | GET | `/ssot/activations` | query |
| `activations.create-activation` | POST | `/ssot/activations` | create |
| `activations.disable-activation` ⚠️ | POST | `/ssot/activations/actions/:activationId/disable` | create |
| `activations.enable-activation` | POST | `/ssot/activations/actions/:activationId/enable` | create |
| `activations.trigger-activation-full-refresh` | POST | `/ssot/activations/actions/:activationId/full-refresh` | create |
| `activations.retry-activation-sync` | POST | `/ssot/activations/actions/:activationId/retry-sync` | create |
| `activations.get-data-object-categories-available-for-activation` | GET | `/ssot/activations/metadata/activatable-data-object-categories` | query |
| `activations.get-channel-preferences` | GET | `/ssot/activations/metadata/channel-preferences` | query |
| `activations.get-channels` | GET | `/ssot/activations/metadata/channels` | query |
| `activations.get-consent-data-model-objects` | GET | `/ssot/activations/metadata/consent-data-model-objects` | query |
| `activations.get-data-sources` | GET | `/ssot/activations/metadata/data-sources` | query |
| `activations.get-related-attribute-activation-quota` | GET | `/ssot/activations/metadata/limits/related-attribute-activation-quota` | query |
| `activations.get-related-attribute-configuration-limits` | GET | `/ssot/activations/metadata/limits/related-attribute-configuration-limits` | query |
| `activations.get-identity-providers-for-match-boost` | GET | `/ssot/activations/metadata/match-boost-identity-providers` | query |
| `activations.get-streaming-eligibility` | GET | `/ssot/activations/metadata/streaming-eligibility` | query |
| `activations.delete-activation` ⚠️ | DELETE | `/ssot/activations/:activationId` | delete |
| `activations.get-activation` | GET | `/ssot/activations/:activationId` | read |
| `activations.update-activation` | PUT | `/ssot/activations/:activationId` | update |
| `activations.publish-a-batch-dmo-activation` | POST | `/ssot/activations/:activationId/actions/publish` | action |
| `activations.get-audience-dmo-activation-records` | GET | `/ssot/activations/:activationId/data` | query |
| `activations.get-activation-history` | GET | `/ssot/activations/:activationId/history` | query |

### Agent Configuration

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `agent-configuration.get-agents` | GET | `/ssot/agentic/agents` | query |
| `agent-configuration.create-agent` | POST | `/ssot/agentic/agent` | create |
| `agent-configuration.delete-agent` ⚠️ | DELETE | `/ssot/agentic/agent/:agentIdOrApiName` | delete |
| `agent-configuration.get-agent` | GET | `/ssot/agentic/agent/:agentIdOrApiName` | read |

### Calculated Insights

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `calculated-insights.get-calculated-insights` | GET | `/ssot/calculated-insights` | query |
| `calculated-insights.create-calculated-insights` | POST | `/ssot/calculated-insights` | create |
| `calculated-insights.delete-calculated-insight` ⚠️ | DELETE | `/ssot/calculated-insights/:apiName` | delete |
| `calculated-insights.get-calculated-insight` | GET | `/ssot/calculated-insights/:apiName` | read |
| `calculated-insights.update-calculated-insight` | PATCH | `/ssot/calculated-insights/:apiName` | update |
| `calculated-insights.run-calculated-insight` | POST | `/ssot/calculated-insights/:apiName/actions/run` | action |

### Clean Rooms

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `clean-rooms.get-collaborations` | GET | `/ssot/data-clean-room/collaborations` | query |
| `clean-rooms.create-a-collaboration` | POST | `/ssot/data-clean-room/collaborations` | create |
| `clean-rooms.accept-a-collaboration-invitation` | POST | `/ssot/data-clean-room/collaborations/:collaborationIdOrApiName/actions/accept-invitation` | create |
| `clean-rooms.disable-a-collaboration` ⚠️ | POST | `/ssot/data-clean-room/collaborations/:collaborationIdOrApiName/actions/disable` | create |
| `clean-rooms.refresh-collaboration-metadata` | PUT | `/ssot/data-clean-room/collaborations/:collaborationIdOrApiName/actions/refresh-metadata` | update |
| `clean-rooms.reject-a-collaboration-invitation` | POST | `/ssot/data-clean-room/collaborations/:collaborationIdOrApiName/actions/reject-invitation` | create |
| `clean-rooms.run-a-query` | POST | `/ssot/data-clean-room/collaborations/:collaborationIdOrApiName/actions/run` | action |
| `clean-rooms.get-query-jobs` | GET | `/ssot/data-clean-room/collaborations/:collaborationIdOrApiName/jobs` | query |
| `clean-rooms.get-collaboration-result-objects` | GET | `/ssot/data-clean-room/collaborations/:collaborationIdOrApiName/result-data-objects` | query |
| `clean-rooms.get-providers` | GET | `/ssot/data-clean-room/providers` | query |
| `clean-rooms.create-a-provider` | POST | `/ssot/data-clean-room/providers` | create |
| `clean-rooms.get-a-provider` | GET | `/ssot/data-clean-room/providers/:providerIdOrName` | read |
| `clean-rooms.get-provider-templates` | GET | `/ssot/data-clean-room/providers/:providerIdOrName/templates` | query |
| `clean-rooms.get-specifications` | GET | `/ssot/data-clean-room/specifications` | query |
| `clean-rooms.create-a-specification` | POST | `/ssot/data-clean-room/specifications` | create |
| `clean-rooms.delete-a-specification` ⚠️ | DELETE | `/ssot/data-clean-room/specifications/:specificationIdOrApiName` | delete |
| `clean-rooms.get-templates` | GET | `/ssot/data-clean-room/templates` | query |
| `clean-rooms.get-template-collaborations` | GET | `/ssot/data-clean-room/templates/:useCaseTemplateType/collaborations` | query |
| `clean-rooms.test-connection` | POST | `/ssot/data-clean-room/test-connection` | action |

### Connections

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `connections.get-connections` | GET | `/ssot/connections` | query |
| `connections.create-connection` | POST | `/ssot/connections` | create |
| `connections.delete-connection` ⚠️ | DELETE | `/ssot/connections/:connectionId` | delete |
| `connections.get-connection` | GET | `/ssot/connections/:connectionId` | read |
| `connections.update-connection` | PATCH | `/ssot/connections/:connectionId` | update |
| `connections.replace-connection` | PUT | `/ssot/connections/:connectionId` | update |
| `connections.get-connection-database-schemas` | POST | `/ssot/connections/:connectionId/database-schemas` | create |
| `connections.get-connection-databases` | POST | `/ssot/connections/:connectionId/databases` | create |
| `connections.get-connection-endpoints` | GET | `/ssot/connections/:connectionId/endpoints` | query |
| `connections.get-connection-fields` | POST | `/ssot/connections/:connectionId/objects/:resourceName/fields` | create |
| `connections.get-connection-objects` | POST | `/ssot/connections/:connectionId/objects` | create |
| `connections.get-connection-preview` | POST | `/ssot/connections/:connectionId/objects/:resourceName/preview` | action |
| `connections.get-connection-schema` | GET | `/ssot/connections/:connectionId/schema` | query |
| `connections.upsert-connection-schema` | PUT | `/ssot/connections/:connectionId/schema` | update |
| `connections.get-connection-site-map` | GET | `/ssot/connections/:connectionId/sitemap` | query |
| `connections.upsert-connection-site-map` | PUT | `/ssot/connections/:connectionId/sitemap` | update |
| `connections.test-connection-action` | POST | `/ssot/connections/actions/test` | action |
| `connections.run-connection-action` | POST | `/ssot/connections/actions/:command` | create |
| `connections.test-existing-connection-action` | POST | `/ssot/connections/:connectionId/actions/test` | action |
| `connections.run-existing-connection-action` | POST | `/ssot/connections/:connectionId/actions/:command` | create |
| `connections.test-existing-connection-schema-action` | POST | `/ssot/connections/:connectionId/schema/actions/test` | action |
| `connections.get-connectors` | GET | `/ssot/connectors` | query |
| `connections.get-connector-metadata` | GET | `/ssot/connectors/:connectorType` | read |

### Connectors

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `connectors.get-connectors` | GET | `/ssot/connectors` | query |
| `connectors.get-connector-metadata` | GET | `/ssot/connectors/:connectorType` | read |

### Data Action Targets

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-action-targets.get-data-action-targets` | GET | `/ssot/data-action-targets` | query |
| `data-action-targets.create-data-action-target` | POST | `/ssot/data-action-targets` | create |
| `data-action-targets.delete-data-action-target` ⚠️ | DELETE | `/ssot/data-action-targets/:apiName` | delete |
| `data-action-targets.get-data-action-target` | GET | `/ssot/data-action-targets/:apiName` | read |
| `data-action-targets.generate-data-action-target-signing-key` | POST | `/ssot/data-action-targets/:apiName/signing-key` | create |

### Data Actions

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-actions.get-data-actions` | GET | `/ssot/data-actions` | query |
| `data-actions.create-data-action` | POST | `/ssot/data-actions` | create |

### Data Governance

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-governance.get-auto-tagging-jobs` | GET | `/ssot/data-governance/auto-tagging-jobs` | query |
| `data-governance.get-auto-tagging-job` | GET | `/ssot/data-governance/auto-tagging-jobs/:id` | read |
| `data-governance.get-classification-assignments` | GET | `/ssot/data-governance/classification-assignments` | query |
| `data-governance.create-classification-assignment` | POST | `/ssot/data-governance/classification-assignments` | create |
| `data-governance.delete-classification-assignment` ⚠️ | DELETE | `/ssot/data-governance/classification-assignments/:id` | delete |
| `data-governance.get-classification-assignment` | GET | `/ssot/data-governance/classification-assignments/:id` | read |
| `data-governance.bulk-create-classification-assignments` | POST | `/ssot/data-governance/classification-assignments/actions/bulk-create` | create |
| `data-governance.bulk-delete-classification-assignments` ⚠️ | POST | `/ssot/data-governance/classification-assignments/actions/bulk-delete` | create |
| `data-governance.get-classification-taxonomies` | GET | `/ssot/data-governance/classification-taxonomies` | query |
| `data-governance.create-classification-taxonomy` | POST | `/ssot/data-governance/classification-taxonomies` | create |
| `data-governance.delete-classification-taxonomy` ⚠️ | DELETE | `/ssot/data-governance/classification-taxonomies/:name` | delete |
| `data-governance.get-classification-taxonomy` | GET | `/ssot/data-governance/classification-taxonomies/:name` | read |
| `data-governance.update-classification-taxonomy` | PATCH | `/ssot/data-governance/classification-taxonomies/:name` | update |
| `data-governance.bulk-create-classification-taxonomies` | POST | `/ssot/data-governance/classification-taxonomies/actions/bulk-create` | create |
| `data-governance.bulk-delete-classification-taxonomies` ⚠️ | POST | `/ssot/data-governance/classification-taxonomies/actions/bulk-delete` | create |
| `data-governance.bulk-update-classification-taxonomies` | POST | `/ssot/data-governance/classification-taxonomies/actions/bulk-update` | create |
| `data-governance.get-classifications` | GET | `/ssot/data-governance/classifications` | query |
| `data-governance.create-classification` | POST | `/ssot/data-governance/classifications` | create |
| `data-governance.delete-classification` ⚠️ | DELETE | `/ssot/data-governance/classifications/:fullyQualifiedName` | delete |
| `data-governance.get-classification` | GET | `/ssot/data-governance/classifications/:fullyQualifiedName` | read |
| `data-governance.update-classification` | PATCH | `/ssot/data-governance/classifications/:fullyQualifiedName` | update |
| `data-governance.get-classification-assignments-on-a-classification` | GET | `/ssot/data-governance/classifications/:fullyQualifiedName/assignments` | query |
| `data-governance.bulk-create-classifications` | POST | `/ssot/data-governance/classifications/actions/bulk-create` | create |
| `data-governance.bulk-delete-classifications` ⚠️ | POST | `/ssot/data-governance/classifications/actions/bulk-delete` | create |
| `data-governance.bulk-update-classifications` | POST | `/ssot/data-governance/classifications/actions/bulk-update` | create |
| `data-governance.get-tag-assignments` | GET | `/ssot/data-governance/tag-assignments` | query |
| `data-governance.create-tag-assignment` | POST | `/ssot/data-governance/tag-assignments` | create |
| `data-governance.delete-tag-assignment` ⚠️ | DELETE | `/ssot/data-governance/tag-assignments/:id` | delete |
| `data-governance.get-tag-assignment` | GET | `/ssot/data-governance/tag-assignments/:id` | read |
| `data-governance.bulk-create-tag-assignments` | POST | `/ssot/data-governance/tag-assignments/actions/bulk-create` | create |
| `data-governance.bulk-delete-tag-assignments` ⚠️ | POST | `/ssot/data-governance/tag-assignments/actions/bulk-delete` | create |
| `data-governance.get-tag-suggestions` | GET | `/ssot/data-governance/tag-suggestions` | query |
| `data-governance.get-tag-suggestion` | GET | `/ssot/data-governance/tag-suggestions/:id` | read |
| `data-governance.approve-tag-suggestions` | POST | `/ssot/data-governance/tag-suggestions/actions/approve` | create |
| `data-governance.generate-tag-suggestions` | POST | `/ssot/data-governance/tag-suggestions/actions/generate` | action |
| `data-governance.reject-tag-suggestions` | POST | `/ssot/data-governance/tag-suggestions/actions/reject` | create |
| `data-governance.list-tag-taxonomies` | GET | `/ssot/data-governance/tag-taxonomies` | query |
| `data-governance.create-tag-taxonomy` | POST | `/ssot/data-governance/tag-taxonomies` | create |
| `data-governance.delete-tag-taxonomy` ⚠️ | DELETE | `/ssot/data-governance/tag-taxonomies/:fullyQualifiedName` | delete |
| `data-governance.get-tag-taxonomy` | GET | `/ssot/data-governance/tag-taxonomies/:fullyQualifiedName` | read |
| `data-governance.update-tag-taxonomy` | PATCH | `/ssot/data-governance/tag-taxonomies/:fullyQualifiedName` | update |
| `data-governance.bulk-create-tag-detection-instructions` | POST | `/ssot/data-governance/tag-taxonomies/:fullyQualifiedName/detection-instructions/actions/bulk-create` | create |
| `data-governance.get-tags-with-active-detection-instructions` | GET | `/ssot/data-governance/tag-taxonomies/:fullyQualifiedName/tags-with-active-detection-instructions` | query |
| `data-governance.bulk-create-tag-taxonomies` | POST | `/ssot/data-governance/tag-taxonomies/actions/bulk-create` | create |
| `data-governance.bulk-delete-tag-taxonomies` ⚠️ | POST | `/ssot/data-governance/tag-taxonomies/actions/bulk-delete` | create |
| `data-governance.bulk-update-tag-taxonomies` | POST | `/ssot/data-governance/tag-taxonomies/actions/bulk-update` | create |
| `data-governance.get-tags` | GET | `/ssot/data-governance/tags` | query |
| `data-governance.create-tag` | POST | `/ssot/data-governance/tags` | create |
| `data-governance.delete-tag` ⚠️ | DELETE | `/ssot/data-governance/tags/:fullyQualifiedName` | delete |
| `data-governance.get-tag` | GET | `/ssot/data-governance/tags/:fullyQualifiedName` | read |
| `data-governance.update-tag` | PATCH | `/ssot/data-governance/tags/:fullyQualifiedName` | update |
| `data-governance.get-tag-assignments-on-a-tag` | GET | `/ssot/data-governance/tags/:fullyQualifiedName/assignments` | query |
| `data-governance.create-tag-detection-instruction` | POST | `/ssot/data-governance/tags/:fullyQualifiedName/detection-instructions` | create |
| `data-governance.delete-tag-detection-instruction` ⚠️ | DELETE | `/ssot/data-governance/tags/:fullyQualifiedName/detection-instructions/active` | delete |
| `data-governance.get-tag-detection-instruction` | GET | `/ssot/data-governance/tags/:fullyQualifiedName/detection-instructions/active` | query |
| `data-governance.bulk-create-tags` | POST | `/ssot/data-governance/tags/actions/bulk-create` | create |
| `data-governance.bulk-delete-tags` ⚠️ | POST | `/ssot/data-governance/tags/actions/bulk-delete` | create |
| `data-governance.bulk-update-tags` | POST | `/ssot/data-governance/tags/actions/bulk-update` | create |
| `data-governance.propagate-tags` | POST | `/ssot/data-governance/tags/actions/propagate` | create |

### Data Graphs

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-graphs.create-data-graph` | POST | `/ssot/data-graphs` | create |
| `data-graphs.get-data-graph-data-by-entity-name` | GET | `/ssot/data-graphs/data/:dataGraphEntityName` | read |
| `data-graphs.get-data-graph-data-by-id` | GET | `/ssot/data-graphs/data/:dataGraphEntityName/:id` | read |
| `data-graphs.get-data-graph-metadata` | GET | `/ssot/data-graphs/metadata` | query |
| `data-graphs.delete-data-graph` ⚠️ | DELETE | `/ssot/data-graphs/:dataGraphName` | delete |
| `data-graphs.get-data-graph` | GET | `/ssot/data-graphs/:dataGraphName` | read |
| `data-graphs.activate-data-graph` | POST | `/ssot/data-graphs/:dataGraphName/actions/activate` | action |
| `data-graphs.refresh-data-graph` | POST | `/ssot/data-graphs/:dataGraphName/actions/refresh` | action |

### Data Kits

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-kits.get-data-kits` | GET | `/ssot/data-kits` | query |
| `data-kits.create-data-kit` | POST | `/ssot/data-kits` | create |
| `data-kits.get-data-kit-available-components` | GET | `/ssot/data-kits/available-components` | query |
| `data-kits.delete-data-kit` ⚠️ | DELETE | `/ssot/data-kits/:dataKitDevName` | delete |
| `data-kits.update-data-kit-components` | PATCH | `/ssot/data-kits/:dataKitDevName` | update |
| `data-kits.deploy-data-kit-components` | POST | `/ssot/data-kits/:dataKitDevName` | create |
| `data-kits.get-data-kit-manifest` | GET | `/ssot/datakit/:dataKitDevName/manifest` | query |
| `data-kits.undeploy-data-kit-component` | POST | `/ssot/data-kits/:dataKitName/undeploy` | create |
| `data-kits.get-data-kit-component-dependency` | GET | `/ssot/data-kits/:dataKitName/components/:componentName/dependencies` | query |
| `data-kits.get-data-kit-component-status` | GET | `/ssot/data-kits/:dataKitName/components/:componentName/deployment-status` | query |

### Data Lake Objects

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-lake-objects.get-data-lake-objects` | GET | `/ssot/data-lake-objects` | query |
| `data-lake-objects.create-data-lake-object` | POST | `/ssot/data-lake-objects` | create |
| `data-lake-objects.delete-data-lake-object` ⚠️ | DELETE | `/ssot/data-lake-objects/:recordIdOrDeveloperName` | delete |
| `data-lake-objects.get-data-lake-object` | GET | `/ssot/data-lake-objects/:recordIdOrDeveloperName` | read |
| `data-lake-objects.update-data-lake-object` | PATCH | `/ssot/data-lake-objects/:recordIdOrDeveloperName` | update |

### Data Model Objects

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-model-objects.get-data-model-objects` | GET | `/ssot/data-model-objects` | query |
| `data-model-objects.create-data-model-object` | POST | `/ssot/data-model-objects` | create |
| `data-model-objects.delete-data-model-object` ⚠️ | DELETE | `/ssot/data-model-objects/:dataModelObjectName` | delete |
| `data-model-objects.get-data-model-object` | GET | `/ssot/data-model-objects/:dataModelObjectName` | read |
| `data-model-objects.update-data-model-object` | PATCH | `/ssot/data-model-objects/:dataModelObjectName` | update |
| `data-model-objects.get-data-model-object-mappings` | GET | `/ssot/data-model-object-mappings` | query |
| `data-model-objects.create-data-model-object-mapping` | POST | `/ssot/data-model-object-mappings` | create |
| `data-model-objects.delete-data-model-object-mapping` ⚠️ | DELETE | `/ssot/data-model-object-mappings/:objectSourceTargetMapDeveloperName` | delete |
| `data-model-objects.get-data-model-object-mapping` | GET | `/ssot/data-model-object-mappings/:objectSourceTargetMapDeveloperName` | read |
| `data-model-objects.delete-data-model-object-field-mapping` ⚠️ | DELETE | `/ssot/data-model-object-mappings/:objectSourceTargetMapDeveloperName/field-mappings` | delete |
| `data-model-objects.delete-data-model-object-field-mapping-1` | PATCH | `/ssot/data-model-object-mappings/:objectSourceTargetMapDeveloperName/field-mappings/:fieldSourceTargetMapDeveloperName` | update |
| `data-model-objects.delete-field-source-target-relationship` ⚠️ | DELETE | `/ssot/data-model-objects/relationships/:name` | delete |
| `data-model-objects.get-field-source-target-relationships` | GET | `/ssot/data-model-objects/:dataModelObjectName/relationships` | query |
| `data-model-objects.create-field-source-target-relationships` | POST | `/ssot/data-model-objects/:dataModelObjectName/relationships` | create |

### Data Shares

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-shares.get-data-shares` | GET | `/ssot/data-shares` | query |
| `data-shares.create-data-share` | POST | `/ssot/data-share` | create |
| `data-shares.delete-data-share` ⚠️ | DELETE | `/ssot/data-share/:nameOrId` | delete |
| `data-shares.get-data-share` | GET | `/ssot/data-share/:nameOrId` | read |
| `data-shares.update-data-share` | PATCH | `/ssot/data-share/:nameOrId` | update |
| `data-shares.link-data-share-with-target` | POST | `/ssot/data-share/:nameOrId/actions/link` | create |
| `data-shares.unlink-data-share-with-target` | POST | `/ssot/data-share/:nameOrId/actions/unlink` | create |
| `data-shares.get-data-share-targets` | GET | `/ssot/data-share-targets/:targetType` | read |
| `data-shares.create-data-share-target` | POST | `/ssot/data-share-target` | create |
| `data-shares.delete-data-share-target` ⚠️ | DELETE | `/ssot/data-share-target/:nameOrId` | delete |
| `data-shares.get-data-share-target` | GET | `/ssot/data-share-target/:nameOrId` | read |

### Data Spaces

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-spaces.get-data-spaces` | GET | `/ssot/data-spaces` | query |
| `data-spaces.create-data-space` | POST | `/ssot/data-spaces` | create |
| `data-spaces.get-data-space` | GET | `/ssot/data-spaces/:idOrName` | read |
| `data-spaces.update-data-space` | PATCH | `/ssot/data-spaces/:idOrName` | update |
| `data-spaces.delete-data-space-members` ⚠️ | DELETE | `/ssot/data-spaces/:idOrName/members` | delete |
| `data-spaces.get-data-space-members` | GET | `/ssot/data-spaces/:idOrName/members` | query |
| `data-spaces.upsert-data-space-members` | PUT | `/ssot/data-spaces/:idOrName/members` | update |
| `data-spaces.get-data-space-member` | GET | `/ssot/data-spaces/:idOrName/members/:dataSpaceMemberObjectName` | read |

### Data Streams

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-streams.get-data-streams` | GET | `/ssot/data-streams` | query |
| `data-streams.create-data-stream` | POST | `/ssot/data-streams` | create |
| `data-streams.delete-data-stream` ⚠️ | DELETE | `/ssot/data-streams/:recordIdOrDeveloperName` | delete |
| `data-streams.get-data-stream` | GET | `/ssot/data-streams/:recordIdOrDeveloperName` | read |
| `data-streams.update-data-stream` | PATCH | `/ssot/data-streams/:recordIdOrDeveloperName` | update |
| `data-streams.run-data-streams` | POST | `/ssot/data-streams/:recordIdOrDeveloperName/actions/run` | action |

### Data Transforms

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `data-transforms.get-data-transforms` | GET | `/ssot/data-transforms` | query |
| `data-transforms.create-data-transform` | POST | `/ssot/data-transforms` | create |
| `data-transforms.delete-data-transform` ⚠️ | DELETE | `/ssot/data-transforms/:dataTransformNameOrId` | delete |
| `data-transforms.get-data-transform` | GET | `/ssot/data-transforms/:dataTransformNameOrId` | read |
| `data-transforms.update-data-transform` | PUT | `/ssot/data-transforms/:dataTransformNameOrId` | update |
| `data-transforms.cancel-data-transform` ⚠️ | POST | `/ssot/data-transforms/:dataTransformNameOrId/actions/cancel` | action |
| `data-transforms.rebuild-data-transform` | POST | `/ssot/data-transforms/:dataTransformNameOrId/actions/rebuild` | create |
| `data-transforms.refresh-data-transform-status` | POST | `/ssot/data-transforms/:dataTransformNameOrId/actions/refresh-status` | action |
| `data-transforms.retry-data-transform` | POST | `/ssot/data-transforms/:dataTransformNameOrId/actions/retry` | create |
| `data-transforms.run-data-transform` | POST | `/ssot/data-transforms/:dataTransformNameOrId/actions/run` | action |
| `data-transforms.get-data-transform-run-history` | GET | `/ssot/data-transforms/:dataTransformNameOrId/run-history` | query |
| `data-transforms.get-data-transform-schedule` | GET | `/ssot/data-transforms/:dataTransformNameOrId/schedule` | query |
| `data-transforms.update-data-transform-schedule` | PUT | `/ssot/data-transforms/:dataTransformNameOrId/schedule` | update |
| `data-transforms.validate-data-transform` | POST | `/ssot/data-transforms-validation` | create |

### Document AI

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `document-ai.detect-document-ai-schema` | POST | `/ssot/document-processing/actions/detect-schema` | create |
| `document-ai.extract-document-ai-configuration-data` | POST | `/ssot/document-processing/actions/extract-data` | create |
| `document-ai.generate-document-ai-schema` | POST | `/ssot/document-processing/actions/generate-schema` | action |
| `document-ai.get-document-ai-configurations` | GET | `/ssot/document-processing/configurations` | query |
| `document-ai.create-document-ai-configuration` | POST | `/ssot/document-processing/configurations` | create |
| `document-ai.get-document-ai-configuration` | GET | `/ssot/document-processing/configurations/:idOrApiName` | read |
| `document-ai.update-document-ai-configuration` | PATCH | `/ssot/document-processing/configurations/:idOrApiName` | update |
| `document-ai.delete-document-ai-configuration` ⚠️ | DELETE | `/ssot/document-processing/configurations/:idOrApiName` | delete |
| `document-ai.run-document-ai-process` | POST | `/ssot/document-processing/configurations/:idOrApiName/actions/run` | action |
| `document-ai.get-document-ai-global-configuration` | GET | `/ssot/document-processing/global-config` | query |

### Identity Resolutions

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `identity-resolutions.get-identity-resolution-rulesets` | GET | `/ssot/identity-resolutions` | query |
| `identity-resolutions.create-identity-resolution-ruleset` | POST | `/ssot/identity-resolutions` | create |
| `identity-resolutions.delete-identity-resolution-ruleset` ⚠️ | DELETE | `/ssot/identity-resolutions/:identityResolution` | delete |
| `identity-resolutions.get-identity-resolution-ruleset` | GET | `/ssot/identity-resolutions/:identityResolution` | read |
| `identity-resolutions.update-identity-resolution-ruleset` | PATCH | `/ssot/identity-resolutions/:identityResolution` | update |
| `identity-resolutions.run-identity-resolution-ruleset-now` | POST | `/ssot/identity-resolutions/:identityResolution/actions/run-now` | action |

### Insights

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `insights.get-calculated-insight-object` | GET | `/ssot/insight/calculated-insights/:ciName` | read |
| `insights.get-insight-metadata` | GET | `/ssot/insight/metadata` | query |
| `insights.get-calculated-insight-object-metadata` | GET | `/ssot/insight/metadata/:ciName` | read |

### Machine Learning

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `machine-learning.create-data-alert` | POST | `/ssot/machine-learning/alerts` | create |
| `machine-learning.update-data-alert` | PATCH | `/ssot/machine-learning/alerts/:alertId` | update |
| `machine-learning.get-configured-models` | GET | `/ssot/machine-learning/configured-models` | query |
| `machine-learning.delete-configured-model` ⚠️ | DELETE | `/ssot/machine-learning/configured-models/:configuredModelIdOrName` | delete |
| `machine-learning.get-configured-model` | GET | `/ssot/machine-learning/configured-models/:configuredModelIdOrName` | read |
| `machine-learning.update-configured-model` | PATCH | `/ssot/machine-learning/configured-models/:configuredModelIdOrName` | update |
| `machine-learning.get-predict-jobs` | GET | `/ssot/machine-learning/jobs` | query |
| `machine-learning.get-a-predict-job` | GET | `/ssot/machine-learning/jobs/:jobId` | read |
| `machine-learning.get-predict-job-tasks` | GET | `/ssot/machine-learning/jobs/:jobId/tasks` | query |
| `machine-learning.get-a-predict-job-task` | GET | `/ssot/machine-learning/jobs/:jobId/tasks/:taskId` | read |
| `machine-learning.get-model-artifacts` | GET | `/ssot/machine-learning/model-artifacts` | query |
| `machine-learning.delete-model-artifact` ⚠️ | DELETE | `/ssot/machine-learning/model-artifacts/:modelArtifactIdOrName` | delete |
| `machine-learning.get-model-artifact` | GET | `/ssot/machine-learning/model-artifacts/:modelArtifactIdOrName` | read |
| `machine-learning.update-model-artifact` | PATCH | `/ssot/machine-learning/model-artifacts/:modelArtifactIdOrName` | update |
| `machine-learning.get-model-setup-versions` | GET | `/ssot/machine-learning/model-setups/:modelSetupIdOrName/setup-versions` | query |
| `machine-learning.create-model-setup-version` | POST | `/ssot/machine-learning/model-setups/:modelSetupIdOrName/setup-versions` | create |
| `machine-learning.get-model-setup-version` | GET | `/ssot/machine-learning/model-setups/:modelSetupIdOrName/setup-versions/:modelSetupVersionId` | read |
| `machine-learning.update-model-setup-version` | PATCH | `/ssot/machine-learning/model-setups/:modelSetupIdOrName/setup-versions/:modelSetupVersionId` | update |
| `machine-learning.get-model-setup-version-partitions` | GET | `/ssot/machine-learning/model-setups/:modelSetupIdOrName/setup-versions/:modelSetupVersionId/partitions` | query |
| `machine-learning.get-model-setup-version-partition` | GET | `/ssot/machine-learning/model-setups/:modelSetupIdOrName/setup-versions/:modelSetupVersionId/partitions/:modelSetupPartitionId` | read |
| `machine-learning.get-prediction` | POST | `/ssot/machine-learning/predict` | create |
| `machine-learning.get-prediction-job-definitions` | GET | `/ssot/machine-learning/prediction-job-definitions` | query |
| `machine-learning.create-a-prediction-job-definition` | POST | `/ssot/machine-learning/prediction-job-definitions` | create |
| `machine-learning.delete-a-prediction-job-definition` ⚠️ | DELETE | `/ssot/machine-learning/prediction-job-definitions/:predictionJobDefIdOrName` | delete |
| `machine-learning.get-a-prediction-job-definition` | GET | `/ssot/machine-learning/prediction-job-definitions/:predictionJobDefIdOrName` | read |
| `machine-learning.update-a-prediction-job-definition` | PATCH | `/ssot/machine-learning/prediction-job-definitions/:predictionJobDefIdOrName` | update |
| `machine-learning.get-retrievers` | GET | `/ssot/machine-learning/retrievers` | query |
| `machine-learning.create-retriever` | POST | `/ssot/machine-learning/retrievers` | create |
| `machine-learning.review-retriever` | POST | `/ssot/machine-learning/retrievers/actions/review` | create |
| `machine-learning.delete-retriever` ⚠️ | DELETE | `/ssot/machine-learning/retrievers/:retrieverIdOrName` | delete |
| `machine-learning.get-retriever` | GET | `/ssot/machine-learning/retrievers/:retrieverIdOrName` | read |
| `machine-learning.update-retriever` | PATCH | `/ssot/machine-learning/retrievers/:retrieverIdOrName` | update |
| `machine-learning.get-retriever-configurations` | GET | `/ssot/machine-learning/retrievers/:retrieverIdOrName/configurations` | query |
| `machine-learning.create-retriever-configuration` | POST | `/ssot/machine-learning/retrievers/:retrieverIdOrName/configurations` | create |
| `machine-learning.delete-retriever-configuration` ⚠️ | DELETE | `/ssot/machine-learning/retrievers/:retrieverIdOrName/configurations/:retrieverConfigurationIdOrName` | delete |
| `machine-learning.get-retriever-configuration` | GET | `/ssot/machine-learning/retrievers/:retrieverIdOrName/configurations/:retrieverConfigurationIdOrName` | read |
| `machine-learning.update-retriever-configuration` | PATCH | `/ssot/machine-learning/retrievers/:retrieverIdOrName/configurations/:retrieverConfigurationIdOrName` | update |

### Metadata

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `metadata.get-connector-metadata` | GET | `/ssot/connectors/:connectorType` | read |
| `metadata.get-data-graph-metadata` | GET | `/ssot/data-graphs/metadata` | query |
| `metadata.get-insight-metadata` | GET | `/ssot/insight/metadata` | query |
| `metadata.get-calculated-insight-object-metadata` | GET | `/ssot/insight/metadata/:ciName` | read |
| `metadata.get-metadata` | GET | `/ssot/metadata` | query |
| `metadata.get-metadata-entities` | GET | `/ssot/metadata-entities` | query |
| `metadata.get-profile-metadata` | GET | `/ssot/profile/metadata` | query |
| `metadata.get-profile-data-model-object-metadata` | GET | `/ssot/profile/metadata/:dataModelName` | read |

### Notebook AI

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `notebook-ai.get-knowledge-spaces` | GET | `/ssot/knowledge-space` | query |
| `notebook-ai.create-knowledge-space` | POST | `/ssot/knowledge-space` | create |
| `notebook-ai.get-knowledge-space` | GET | `/ssot/knowledge-space/:knowledgeSpaceApiNameOrId` | read |
| `notebook-ai.update-knowledge-space` | PATCH | `/ssot/knowledge-space/:knowledgeSpaceApiNameOrId` | update |
| `notebook-ai.delete-knowledge-space` ⚠️ | DELETE | `/ssot/knowledge-space/:knowledgeSpaceApiNameOrId` | delete |
| `notebook-ai.get-knowledge-space-details` | GET | `/ssot/knowledge-space/:knowledgeSpaceApiNameOrId/details` | query |
| `notebook-ai.provision-knowledge-space` | POST | `/ssot/knowledge-space/provision` | create |
| `notebook-ai.get-knowledge-space-configurations` | GET | `/ssot/knowledge-space/config` | query |
| `notebook-ai.create-knowledge-space-configuration` | POST | `/ssot/knowledge-space/config` | create |
| `notebook-ai.get-knowledge-space-configuration` | GET | `/ssot/knowledge-space/config/:knowledgeSpaceConfigApiNameOrId` | read |
| `notebook-ai.delete-knowledge-space-configuration` ⚠️ | DELETE | `/ssot/knowledge-space/config/:knowledgeSpaceConfigApiNameOrId` | delete |
| `notebook-ai.get-knowledge-libraries` | GET | `/ssot/knowledge-space/library` | query |
| `notebook-ai.create-knowledge-library` | POST | `/ssot/knowledge-space/library` | create |
| `notebook-ai.update-knowledge-library` | PATCH | `/ssot/knowledge-space/library/:id` | update |
| `notebook-ai.get-knowledge-library-details` | GET | `/ssot/knowledge-space/library/:libraryId/details` | query |
| `notebook-ai.remove-knowledge-library` ⚠️ | POST | `/ssot/knowledge-space/library/remove-library` | create |
| `notebook-ai.search-knowledge-libraries` | POST | `/ssot/knowledge-space/library/search` | action |
| `notebook-ai.get-presigned-urls` | POST | `/ssot/knowledge-space/presigned-urls` | create |
| `notebook-ai.index-files` | POST | `/ssot/knowledge-space/index-files` | create |
| `notebook-ai.get-file-status` | POST | `/ssot/knowledge-space/files/status` | create |
| `notebook-ai.remove-files` ⚠️ | POST | `/ssot/knowledge-space/remove-files` | create |
| `notebook-ai.get-file-chunks-summary` | POST | `/ssot/knowledge-space/summary` | create |
| `notebook-ai.get-knowledge-for-import` | POST | `/ssot/knowledge-space/getKnowledgeForImport` | create |
| `notebook-ai.import-knowledge` | POST | `/ssot/knowledge-space/importKnowledge` | create |
| `notebook-ai.run-deep-research` | POST | `/ssot/knowledge-space/deep-research/:researchId/run` | action |
| `notebook-ai.update-deep-research-plan` | PATCH | `/ssot/knowledge-space/deep-research/:researchId` | update |
| `notebook-ai.get-deep-research-status` | GET | `/ssot/knowledge-space/deep-research/:researchId` | read |
| `notebook-ai.cancel-running-deep-research-job` ⚠️ | POST | `/ssot/knowledge-space/deep-research/:researchId/cancel` | action |
| `notebook-ai.get-deep-research-report` | POST | `/ssot/knowledge-space/deep-research/:researchId/report` | create |
| `notebook-ai.add-deep-research-as-knowledge-source` | POST | `/ssot/knowledge-space/space/:knowledgeSpaceApiNameOrId/deep-research/source` | create |
| `notebook-ai.get-knowledge-space-sessions` | GET | `/ssot/knowledge-space/:knowledgeSpaceApiNameOrId/sessions` | query |
| `notebook-ai.create-knowledge-space-session` | POST | `/ssot/knowledge-space/:knowledgeSpaceApiNameOrId/sessions` | create |
| `notebook-ai.get-knowledge-space-session` | GET | `/ssot/knowledge-space/session/:knowledgeSpaceSessionId` | read |
| `notebook-ai.delete-knowledge-space-session` ⚠️ | DELETE | `/ssot/knowledge-space/session/:knowledgeSpaceSessionId` | delete |
| `notebook-ai.get-session-conversation` | GET | `/ssot/knowledge-space/:knowledgeSpaceApiNameOrId/session/:knowledgeSpaceSessionId/conversation` | query |

### Private Network Routes

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `private-network-routes.get-private-network-routes` | GET | `/ssot/private-network-routes` | query |
| `private-network-routes.create-private-network-route` | POST | `/ssot/private-network-routes` | create |
| `private-network-routes.delete-private-network-route` ⚠️ | DELETE | `/ssot/private-network-routes/:routeIdOrName` | delete |
| `private-network-routes.get-private-network-route` | GET | `/ssot/private-network-routes/:routeIdOrName` | read |

### Profile

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `profile.get-profile-metadata` | GET | `/ssot/profile/metadata` | query |
| `profile.get-profile-data-model-object-metadata` | GET | `/ssot/profile/metadata/:dataModelName` | read |
| `profile.get-profile-data-model-object` | GET | `/ssot/profile/:dataModelName` | read |
| `profile.get-profile-data-model-object-with-search-key` | GET | `/ssot/profile/:dataModelName/:id` | read |
| `profile.get-profile-data-model-object-and-calculated-insight-with-search-key` | GET | `/ssot/profile/:dataModelName/:id/calculated-insights/:ciName` | read |
| `profile.get-profile-data-model-object-and-child-object-with-search-key` | GET | `/ssot/profile/:dataModelName/:id/:childDataModelName` | read |

### Query V1 & V2

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `query-v1-v2.query-data-v1` | POST | `/ssot/query` | action |
| `query-v1-v2.query-data-v2` | POST | `/ssot/queryv2` | create |
| `query-v1-v2.query-batch-data-v1` | GET | `/ssot/queryv2/:nextBatchId` | read |

### Query (Current)

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `query-current.submit-sql-query` | POST | `/ssot/query-sql` | action |
| `query-current.cancel-sql-query` ⚠️ | DELETE | `/ssot/query-sql/:queryId` | delete |
| `query-current.get-sql-query-status` | GET | `/ssot/query-sql/:queryId` | read |
| `query-current.get-sql-query-rows` | GET | `/ssot/query-sql/:queryId/rows` | query |

### Search Index

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `search-index.get-semantic-search-definition-details` | GET | `/ssot/search-index` | query |
| `search-index.create-semantic-search` | POST | `/ssot/search-index` | action |
| `search-index.get-semantic-search-configuration` | GET | `/ssot/search-index/config` | query |
| `search-index.delete-semantic-search` ⚠️ | DELETE | `/ssot/search-index/:searchIndexApiNameOrId` | delete |
| `search-index.get-semantic-search` | GET | `/ssot/search-index/:searchIndexApiNameOrId` | read |
| `search-index.update-semantic-search` | PATCH | `/ssot/search-index/:searchIndexApiNameOrId` | update |

### Segments

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `segments.get-segments` | GET | `/ssot/segments` | query |
| `segments.create-segment` | POST | `/ssot/segments` | create |
| `segments.get-segment` | GET | `/ssot/segments/:segmentApiNameOrId` | read |
| `segments.delete-segment` ⚠️ | DELETE | `/ssot/segments/:segmentApiName` | delete |
| `segments.update-segment` | PATCH | `/ssot/segments/:segmentApiName` | update |
| `segments.count-segment` | POST | `/ssot/segments/:segmentApiName/actions/count` | create |
| `segments.deactivate-segment-by-name` ⚠️ | POST | `/ssot/segments/:segmentApiName/actions/deactivate` | action |
| `segments.get-segment-members` | GET | `/ssot/segments/:segmentApiName/members` | query |
| `segments.deactivate-segment-by-id` ⚠️ | POST | `/ssot/segments/:segmentId/actions/deactivate` | action |
| `segments.publish-segment` | POST | `/ssot/segments/:segmentId/actions/publish` | action |

### Universal ID Lookup

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `universal-id-lookup.lookup-universal-id` | GET | `/ssot/universalIdLookup/:entityName/:dataSourceId/:dataSourceObjectId/:sourceRecordId` | read |

### Limits

| Endpoint id | Method | Path | Kind |
| --- | --- | --- | --- |
| `limits.limits` | GET | `/limits` | query |

---

⚠️ = destructive operation. Confirm with the user before invoking.

