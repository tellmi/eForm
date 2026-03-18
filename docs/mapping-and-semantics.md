# Mapping and Semantics Guide

Status: Informative
Applies to: eForm ecosystem

---

## 1. Purpose

This document provides guidance for:

- semantic field naming
- mapping eForm fields to external systems

It is not part of the core eForm specification.

The goal is to support interoperability and automation while preserving the simplicity of the eForm format.

---

## 2. Principles

### Separation of Concerns

The eForm specification defines:

- document structure
- field identifiers
- data representation

Mapping and interpretation of data are the responsibility of:

- form publishers
- importing systems

---

### Non-binding Semantics

Semantic identifiers are:

- optional
- non-binding
- implementation-specific

They must not affect document validity.

---

### Privacy and Independence

Semantic identifiers and mappings:

- must not expose internal database structures
- should not require knowledge of backend systems

---

## 3. Semantic Naming Guidelines

### Purpose

Semantic names describe the meaning of a field in a consistent and reusable way.

They help systems understand data beyond local field identifiers.

---

### General Format

Semantic identifiers should follow a dot-separated structure:

```text
category.subCategory.field
```

Examples:

```text
person.name
person.birthDate
address.street
invoice.total
invoice.currency
```

---

### Naming Recommendations

- use lowercase letters
- use dot notation for hierarchy
- keep names short and descriptive
- avoid abbreviations where possible

---

### Namespacing (Optional)

To avoid ambiguity, semantic identifiers may include a namespace:

```text
gov.de.tax.person.name
com.example.customer.id
```

Namespacing is recommended for:

- government systems
- large organizations
- shared ecosystems

---

### Stability

Semantic identifiers should remain stable across:

- form versions
- system changes

This improves long-term compatibility.

---

### Examples

```json
{
"fields": {
"f1": {
"type": "string",
"semantic": "person.name"
},
"f2": {
"type": "number",
"semantic": "invoice.total"
}
}
}
```

---

## 4. Mapping Concepts

### Overview

Mapping defines how eForm field values are transferred into external systems.

Mappings are:

- not part of the eForm document
- defined by importing systems or publishers
- specific to each environment

---

### Field Mapping

Each field identifier is mapped to a target system field.

Example:

```text
f1 → customer.first_name
f2 → invoice.total_amount
```

---

### Semantic-Assisted Mapping

Semantic identifiers may be used to assist mapping.

Example:

```text
person.name → customer.first_name
invoice.total → invoice.total_amount
```

This allows partial automation of mapping processes.

---

## 5. Mapping Configuration (Example)

Import systems may use external mapping definitions.

Example:

```json
{
"mappings": {
"f1": "db.customer.first_name",
"f2": "db.invoice.total"
}
}
```

---

### Semantic-Based Mapping (Optional)

```json
{
"semanticMappings": {
"person.name": "db.customer.first_name",
"invoice.total": "db.invoice.total"
}
}
```

---

## 6. Import Workflow Integration

During import processing:

1. read field values from `data.json`
2. identify field identifiers
3. optionally evaluate semantic identifiers
4. apply mapping rules
5. store values in target systems

---

## 7. Best Practices

### For Form Designers

- use clear and stable field identifiers
- optionally provide semantic identifiers
- avoid exposing internal system details

---

### For Importers

- treat mappings as configuration, not logic
- support both field-based and semantic-based mapping
- allow manual overrides

---

### For System Architects

- use staging systems for imported data
- validate before integration
- maintain mapping definitions separately from code

---

## 8. Limitations

Semantic identifiers:

- do not guarantee interoperability
- do not replace validation
- do not enforce data structure

Mappings:

- are environment-specific
- must be maintained externally

---

## 9. Future Work

Possible future extensions include:

- shared semantic registries
- standardized naming conventions
- automated mapping tools
- domain-specific profiles

These features may improve interoperability but are not required for basic eForm usage.

## 3.1 Minimal Semantic Naming Convention

This section defines a minimal set of recommended semantic naming patterns.

The goal is to improve interoperability between systems while keeping the specification simple and flexible.

These conventions are:

- optional
- non-binding
- intended as guidance only

---

### General Structure

Semantic identifiers should follow a hierarchical dot-separated structure:

```text
category.field
category.subCategory.field
```

---

### Recommended Top-Level Categories

The following categories are commonly useful across many forms:

| Category | Description |
|----------|-------------|
| person | individual person data |
| address | location or postal address |
| contact | communication data |
| organization | company or institution data |
| invoice | invoice or financial document data |
| payment | payment information |
| document | document metadata |
| system | technical or system fields |

---

### Example Identifiers

```text
person.name
person.birthDate
address.street
address.postalCode
contact.email
organization.name
invoice.total
invoice.currency
payment.amount
document.date
```

---

### Naming Rules

- use lowercase letters
- use dot notation for hierarchy
- avoid spaces and special characters
- prefer full words over abbreviations
- keep names concise but clear

---

### Date and Time Fields

Recommended naming:

```text
person.birthDate
document.createdAt
invoice.issueDate
```

Use ISO 8601 format for values where applicable.

---

### Identifiers and Codes

For identifiers:

```text
person.id
organization.id
invoice.number
```

---

### Financial Fields

```text
invoice.total
invoice.tax
payment.amount
payment.currency
```

---

### Namespacing (Optional)

For domain-specific extensions, namespaces may be used:

```text
gov.de.tax.person.id
com.example.custom.field
```

---

### Conflict Avoidance

If multiple systems define similar semantics:

- prefer widely used common names
- use namespaces when ambiguity exists

---

### Backward Compatibility

Semantic identifiers should remain stable across form versions.

Changing semantic identifiers may break mapping configurations.

---

### Design Philosophy

The semantic naming convention is intentionally minimal.

It provides:

- a shared starting point
- improved interoperability
- flexibility for extensions

It does not aim to define a complete ontology or global standard.

