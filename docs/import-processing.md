# Import Processing Guide

Status: Informative
Applies to: eForm ecosystem

---

## 1. Purpose

This document describes how eForm documents may be automatically imported, validated, and integrated into external systems.

It is intended as **implementation guidance** and is not part of the core eForm specification.

The goal is to enable reliable and secure ingestion of structured form data into:

- government systems
- business applications
- document management systems

---

## 2. Overview

eForm documents may be processed automatically by importing systems.

Typical input sources include:

- email inboxes
- monitored directories
- document management systems
- upload portals

Importing systems must treat all incoming documents as **untrusted input**.

---

## 3. Import Workflow

A typical import process consists of the following stages:

### 3.1 Detection

The system scans configured input sources for files with the extension:

```text
.eform
```

---

### 3.2 Extraction

The importer:

1. locates the embedded ZIP container
2. extracts `manifest.json`
3. loads referenced resources

---

### 3.3 Identification

The importer reads form identification metadata from the manifest:

- formPublisher
- formName
- formVersion

The system determines whether the form type is supported.

---

### 3.4 Compatibility Check

The importer verifies:

- supported specification version
- supported form type
- required resources present

Unsupported forms may be rejected or stored for manual review.

---

### 3.5 Parsing

The importer loads:

- schema definitions
- data (JSON or XML)
- layout metadata (optional)
- formulas (optional)

---

### 3.6 Validation (Stage 1)

Initial validation may include:

- schema validation
- required field checks
- format validation
- type validation

This stage ensures structural correctness.

---

### 3.7 Sanitization

All input must be sanitized.

This includes:

- ignoring unknown fields
- removing unsupported structures
- rejecting unsafe content

Examples of unsafe content:

- embedded scripts
- external references
- malformed data structures

---

### 3.8 Intermediate Storage

Validated data is stored in an intermediate system (staging database).

This stage isolates untrusted input from production systems.

---

### 3.9 Manual Review (Optional)

Records may be flagged for manual review if they are:

- incomplete
- inconsistent
- suspicious

Operators may:

- correct values
- request additional information
- approve or reject records

---

### 3.10 Validation (Stage 2)

Final validation may include:

- business rule validation
- cross-field consistency checks
- integration checks with existing data

---

### 3.11 Integration

After successful validation, data is transferred into production systems.

---

## 4. Staging Database

Importing systems should use an intermediate data store.

### Purpose

- isolate untrusted input
- support validation workflows
- enable human review
- prevent corruption of production systems

### Characteristics

The staging system may contain:

- incomplete records
- invalid data
- unverified submissions

Only validated data should be transferred to production systems.

---

## 5. Error Handling

Importers must handle errors gracefully.

### Recommendations

- do not crash on invalid input
- log errors and warnings
- isolate faulty documents
- allow retry or manual correction

---

## 6. Security Considerations

Importing systems must assume that all input is untrusted.

### Required Measures

- disable script execution
- ignore external resource references
- validate all structured data
- sanitize input before processing

### XML Safety

If XML is used:

- disable external entities
- disable DTD processing

---

## 7. Extensibility

Import systems should be designed to handle future extensions.

### Recommendations

- ignore unknown manifest fields
- ignore unsupported schema properties
- allow partial processing

---

## 8. Future Work

Future enhancements may include:

- standardized field mapping systems
- semantic identifiers
- automated validation profiles
- integration with registries

These features may further improve interoperability and automation.

