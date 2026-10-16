# Tooling API Reference

The Tooling API exposes metadata as sObjects. It is the mechanism behind
`sf_create_custom_object`, `sf_create_custom_field`, and their list/delete
counterparts.

## Endpoints

| Operation | Method | Path |
| --- | --- | --- |
| Create custom object | POST | `/tooling/sobjects/CustomObject` |
| Create custom field | POST | `/tooling/sobjects/CustomField` |
| Delete custom object | DELETE | `/tooling/sobjects/CustomObject/:id` |
| Delete custom field | DELETE | `/tooling/sobjects/CustomField/:id` |
| Query metadata | GET | `/tooling/query?q=...` |

## Custom object payload

```json
{
  "FullName": "Invoice__c",
  "Metadata": {
    "label": "Invoice",
    "pluralLabel": "Invoices",
    "nameField": {
      "label": "Invoice Number",
      "type": "AutoNumber",
      "displayFormat": "INV-{0000}"
    },
    "deploymentStatus": "Deployed",
    "sharingModel": "ReadWrite",
    "enableActivities": true,
    "enableReports": true
  }
}
```

| Field | Notes |
| --- | --- |
| `FullName` | API name, must end in `__c` |
| `label` / `pluralLabel` | UI labels |
| `nameField` | The record name field; `type` is `Text` or `AutoNumber` |
| `deploymentStatus` | `Deployed` or `InDevelopment` |
| `sharingModel` | `ReadWrite`, `Read`, `Private`, `ControlledByParent` |

## Custom field payload

```json
{
  "FullName": "Account.Priority__c",
  "Metadata": {
    "label": "Priority",
    "type": "Picklist",
    "required": false,
    "valueSet": {
      "restricted": false,
      "valueSetDefinition": {
        "sorted": false,
        "value": [
          { "fullName": "High", "default": true, "label": "High" },
          { "fullName": "Low", "default": false, "label": "Low" }
        ]
      }
    }
  }
}
```

`FullName` is `Object.Field__c` — the object prefix is required.

### Field types

| Type | Extra metadata |
| --- | --- |
| `Text` | `length` |
| `Number` | `precision`, `scale` |
| `Currency` | `precision`, `scale` |
| `Date` / `DateTime` | — |
| `Checkbox` | `defaultValue` |
| `Picklist` | `valueSet` |
| `MultiselectPicklist` | `valueSet`, `visibleLines` |
| `Lookup` | `referenceTo`, `relationshipName` |
| `MasterDetail` | `referenceTo`, `relationshipName`, `writeRequiresMasterRead` |
| `Formula` | `formula`, `formulaTreatBlanksAs` |

### Lookup example

```json
{
  "FullName": "Contact.Account__c",
  "Metadata": {
    "label": "Related Account",
    "type": "Lookup",
    "referenceTo": "Account",
    "relationshipName": "Related_Account__r"
  }
}
```

## Querying metadata

```bash
sf data query --use-tooling-api \
  --query "SELECT Id, DeveloperName, Label FROM CustomObject" \
  --target-org "$SF_TARGET_ORG" --json
```

Useful Tooling objects:

| Object | Contains |
| --- | --- |
| `CustomObject` | Custom object definitions |
| `CustomField` | Custom field definitions |
| `ApexClass` / `ApexTrigger` | Apex source |
| `FlowDefinition` / `Flow` | Flow metadata |
| `Layout` | Page layouts |
| `Profile` / `PermissionSet` | Access configuration |
| `ValidationRule` | Validation rules |

`CustomField.TableEnumOrId` holds the object the field belongs to.

## Deleting

```bash
# Resolve the Tooling id first
sf data query --use-tooling-api \
  --query "SELECT Id FROM CustomField WHERE DeveloperName = 'Priority__c'" \
  --target-org "$SF_TARGET_ORG" --json

./scripts/sf-api.sh --method DELETE --path /tooling/sobjects/CustomField/<id>
```

Deletion is destructive and cascades: removing a custom object removes its
fields and all their data. Confirm with the user and check dependencies first.

## Permissions

Metadata changes require **Customize Application** or an equivalent permission.
A failure returns `INSUFFICIENT_ACCESS` or `NOT_FOUND` depending on whether the
user can see the object at all.

## Timing

Field and object creation can be asynchronous. A `describe` immediately after
creation may not include the new field. Re-describe after a short delay before
concluding the creation failed.
