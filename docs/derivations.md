# eForm Format Derivations

---

## 1. Overview

The eForm format is designed as a minimal and extensible document format.

Specialized use cases may define **derived formats (profiles)** built on top of the eForm container.

Derived formats extend eForm without modifying the core specification.

Examples include:

- electronic invoices (eBill)
- case files (eCase)
- document bundles

All derived formats must remain compatible with the base eForm structure.

---

## 2. Design Principles

The base eForm format focuses on:

- visual layout (SVG)
- structured data
- machine-readable schema
- optional computation rules

Domain-specific logic such as:

- business rules
- attachments
- workflows

is intentionally excluded from the core format.

Derived formats may define such rules while preserving compatibility.

---

## 3. Profiles

Derived formats are referred to as **profiles**.

A profile must:

- declare itself in `manifest.json`
- remain a valid eForm container
- not break core compatibility

Example:

    {
      "profile": "eBill"
    }

Unknown profiles must not prevent a document from being rendered as a standard eForm.

---

## 4. eBill Profile

The **eBill** profile defines a standardized usage of eForm for electronic invoices.

It integrates established invoice standards such as:

- ZUGFeRD
- XRechnung

---

### 4.1 Core Principle

In eBill documents:

- the XML invoice is the **authoritative business data**
- the SVG layout is a **human-readable representation**
- the eForm container provides transport and rendering

---

### 4.2 Data Model

The standard `data.json` file is replaced by:

    data.xml

The XML must conform to a recognized invoice standard.

---

### 4.3 File Structure

    invoice.ebill
    │
    ├ preview.svg
    │
    └ [embedded container]
       ├ mimetype
       ├ manifest.json
       ├ schema.json
       ├ data.xml
       │
       ├ layout/
       │   invoice.svg
       │
       └ registries/

---

### 4.4 Manifest Requirements

The manifest must include:

    {
      "profile": "eBill"
    }

The manifest must reference `data.xml`.

---

### 4.5 Behavior

- `data.xml` is the single source of truth
- viewers must not treat layout values as authoritative
- the preview must reflect the XML content

---

### 4.6 Mapping

The schema may define mappings between layout fields and XML elements.

Example:

    {
      "fields": {
        "invoice.total": {
          "type": "number",
          "source": "/Invoice/LegalMonetaryTotal/PayableAmount"
        }
      }
    }

Mappings are optional.

---

### 4.7 Compatibility Rules

- eBill must remain a valid eForm container
- generic viewers must render the preview
- generic viewers may ignore `data.xml`

If both `data.json` and `data.xml` exist:

- `data.xml` must take precedence
- `data.json` must be ignored for business logic

---

### 4.8 Constraints

- `data.xml` must be UTF-8 encoded
- XML must be self-contained
- XML must not reference external resources

---

## 5. eCase Profile

The **eCase** profile defines a container for grouping documents.

An eCase consists of:

- one or more eForms
- additional attachments

---

### 5.1 Structure

    case.ecase
    │
    ├ manifest.json
    ├ forms/
    │   ├ form1.eform
    │   └ form2.eform
    │
    └ attachments/
        ├ document.pdf
        └ image.png

---

### 5.2 Manifest Example

    {
      "type": "open-ecase",
      "version": "1.0",
      "forms": [
        "forms/form1.eform"
      ],
      "attachments": [
        "attachments/document.pdf"
      ]
    }

---

### 5.3 Behavior

- eCase acts as a container only
- contained eForms remain independent and valid
- attachments are not interpreted by the eForm specification

---

## 6. Compatibility

Derived formats must remain compatible with the base eForm specification.

Software that supports only eForm should still be able to:

- extract embedded forms
- render previews
- access structured data where applicable

Derived formats must not modify the fundamental structure of eForm documents.

---

## 7. Naming and Compliance

The identifiers:

- eForm
- eBill
- eCase

are part of the specification.

Implementations must not use these names for incompatible formats.

---

## 8. Future Extensions

Possible future profiles include:

- application packages
- legal filing bundles
- invoice archives
- document exchange containers

The eForm format is intentionally minimal to support such extensions.
