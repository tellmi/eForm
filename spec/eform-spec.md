# eForm Specification

Status: Draft
Project: open-eform

---

## 1. Overview

**eForm** is an open document format for interactive digital forms.

The format combines:

- stable visual layout (SVG)
- structured data (JSON)
- machine-readable schema (JSON)

An eForm behaves as the **digital equivalent of a paper form**.

The document must remain readable and printable even without specialized software.

---

## Normative Language

The key words "must", "must not", "should", and "may" are to be interpreted as follows:

- "must" indicates a requirement
- "must not" indicates a prohibition
- "should" indicates a recommendation
- "may" indicates an optional feature

---

## 2. Design Principles

### Long-term readability

Documents must remain readable decades later.

This is achieved through the use of widely supported technologies:

- SVG
- ZIP container
- JSON metadata

### Self-contained documents

All resources required to render the form must be contained inside the document.

External resources must not be required.

### Human-first design

eForm is primarily a **user interface format**.

Users may enter incorrect data.  
Final validation is the responsibility of the receiving system.

### Graceful degradation

Without specialized software:

- the filled form must remain readable
- the document must remain printable

This is achieved through a static SVG preview embedded at the beginning of the file.

---

## 3. File Structure

An `.eform` file consists of two parts:

1. a **static SVG preview document**
2. a **ZIP container containing the form resources**

Example structure:

    form.eform
    │
    ├ preview.svg
    │
    └ [ZIP container]
       ├ mimetype
       ├ manifest.json
       ├ schema.json
       ├ data.json
       │
       ├ layout/
       │   page1.svg
       │
       ├ formulas/
       │   formulas.json
       │
       └ registries/

The preview SVG allows the document to remain readable without specialized software.

The ZIP container stores the structured form resources used by viewers and editors.

The preview SVG may be followed by an open XML comment so that the container can be appended to the file.  
Note: Opening an .eform file directly in a browser may still show raw container data.  
Use the reference viewer for proper rendering.

Example physical layout:

    <svg>...</svg>
    <!-- eform-container
    BASE64_ENCODED_ZIP_DATA
    -->

The container is base64-encoded and embedded inside an XML comment.

Implementations must extract and decode this section to access the ZIP container.

---

## 4. Components

### Preview

The preview is a static SVG document placed at the beginning of the file.

It represents the **rendered filled form**.

Characteristics:

- contains the complete visual representation
- may contain multiple pages
- contains no field anchors
- contains no scripts or external resources

The preview allows the document to remain readable even if no eForm software exists.

### Preview Consistency

The preview SVG must represent the current state of the form data.

The preview should be visually consistent with the values stored in `data.json`.

Minor rendering differences (e.g. font substitution) are acceptable, but the semantic content must match.

### Preview Generation

The preview SVG should be generated automatically from the layout and the current form data.

This ensures that the preview accurately represents the current state of the form.

Implementations may include a pre-generated preview without recomputing it, but the preview must remain consistent with the data stored in `data.json`.

If inconsistencies are detected, implementations should prefer the structured data and may regenerate the preview.

---

### Layout

The layout defines the editable structure of the form.

Layouts use **SVG**.

The layout is the authoritative source for:

- page geometry
- field positioning

Layouts must not contain scripts or external resource references.

---

### Layout Coordinate System

All layout SVG documents must use a consistent coordinate system.

The following rules apply:

- The origin (0,0) is located at the top-left corner of the page
- Coordinates increase to the right (x-axis) and downward (y-axis)
- Units are interpreted as SVG user units

Layouts must define a `viewBox` attribute on the root `<svg>` element.

Example:

    <svg viewBox="0 0 210 297">

Implementations should interpret one user unit as one millimeter unless otherwise specified.

Layouts must not rely on transforms or CSS rules that change the coordinate system.

---

### Field Anchors

A field anchor defines the geometry of a form field within the layout.

Any SVG element containing the attribute

    data-eform-field

is considered a field anchor.

Example:

    <rect data-eform-field="person.name" x="70" y="65" width="100" height="10"/>

---

### Embedded Layout Metadata

Optional metadata attributes may be embedded in layout elements.

If a field is defined both in layout metadata and in `schema.json`, the schema definition takes precedence.

---

### Schema

The schema defines logical field properties such as:

- field type
- validation hints
- semantic references

The schema typically defines a set of fields identified by unique field identifiers.

The schema does not define layout geometry.

#### Semantic Hints (Optional)

Fields may include an optional semantic identifier that describes the meaning of the field.

Example:

    {
      "fields": {
        "f1": {
          "type": "string",
          "semantic": "person.name"
        }
      }
    }

---

### Data

The data file stores the current field values.

---

### Formulas (Optional)

Formulas define relationships between fields and may compute derived values.

---

### Deterministic Evaluation

Formulas must be deterministic and side-effect free.

---

### Registries (Optional)

Registries provide reusable references such as standards or code lists.

---

## 5. Multi-Page Documents

Forms may contain multiple pages.

---

## 6. Manifest

The file `manifest.json` describes the structure of the eForm container.

Example:

    {
      "specVersion": "0.65",
      "layout": ["layout/page1.svg"],
      "schema": "schema.json",
      "data": "data.json",
      "formulas": "formulas/formulas.json"
    }

---

## 6.1 Form Identification

To support automated processing and interoperability, the manifest may include form identification metadata.

### Fields

- formPublisher
- publisherDepartment
- formName
- formVersion

---

## 7. Encoding

All textual resources must use UTF-8 encoding.

---

## 8. Compatibility

eForm is designed for direct browser rendering and system processing.

---

## 8.1 Profiles

eForm supports derived formats called **profiles**.

Profiles extend the base format for specific domains while remaining fully compatible with the core specification.

### Examples

- eCase
- eBill

### Declaration

A profile may be declared in `manifest.json`:

    {
      "profile": "eBill"
    }

### Rules

- Profiles must remain valid eForm containers
- Core structure must not be broken

---

## 9. MIME Type

    application/eform+zip

---

## 10. ZIP Container Requirements

Standard ZIP format must be used.

---

## 11. Versioning

Semantic versioning applies.

---

## 12. Terminology

| Term | Meaning |
|------|--------|
| eForm | document container |
| Viewer | software rendering and editing the form |

---

## 12.1 Naming and Compliance

The identifiers:

- eForm
- eCase
- eBill

are part of the official specification.

Use of these names requires compliance with the corresponding specification and profile definitions.

---

## 13. Project Status

This specification is experimental and subject to change.

---

## 14. Security Considerations

Implementations must treat all input as untrusted.

SVG must not contain scripts or external references.

JSON must not be executed.

---

## 17. Signature Fields (Experimental)

Signatures are typically stored in `data.json`:

    {
      "type": "svg",
      "value": "<svg>...</svg>"
    }

Viewer implementations should render signatures and include them in previews.

## 18. Visual Identity (Non-Normative)

Derived formats may define visual identifiers such as icons to improve recognition and usability.

### Design Principles

Visual identifiers should:

- reflect the semantic purpose of the format
- remain simple and recognizable at small sizes
- be visually consistent across the eForm ecosystem

### Examples

- eCase may use a container or suitcase symbol to represent grouped documents
- eBill may use a currency symbol combined with document elements to represent invoices

### Scope

Visual identity is not part of the core specification and remains optional.

Implementations may define their own visual representations as long as they do not imply incompatible behavior.

