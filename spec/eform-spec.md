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

The data component stores the current field values.

The default format is:

    data.json

Profiles may define alternative data representations (e.g. XML).

The data resource must be referenced in manifest.json.

Implementations must not assume a specific data format unless required by the active profile.

Further examples will use data.json.

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

Example (non-normative):

    {
      "specVersion": "0.6.5",
      "layout": ["layout/page1.svg"],
      "schema": "schema.json",
      "data": "data.json",
      "formulas": "formulas/formulas.json"
    }

The field `specVersion` is optional and informational.
Implementations must not rely on it for compatibility decisions.

The manifest must reference the primary data resource.

The default is "data.json", but profiles may define alternative data files (e.g. "data.xml").

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

## 8.1 Profiles (Informative)

eForm supports derived formats called profiles.

Profiles extend the base format for specific domains while remaining compatible with the core specification.

Examples include:

- eBill
- eCase

Profile definitions are specified in:

    spec/derivations.md

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

eForm documents may originate from untrusted sources.

Implementations must treat all content as untrusted input.

---

### 14.1 General Principles

- All input must be validated and sanitized before processing
- Implementations must not execute embedded code
- Implementations must fail safely when encountering invalid content

---

### 14.2 SVG Processing

SVG content (preview and layout) must be treated as untrusted.

Implementations must sanitize SVG content before rendering.

At minimum, the following must be removed or ignored:

- `<script>` elements
- event handler attributes (`onload`, `onclick`, etc.)
- `<foreignObject>` elements
- external resource references (`href`, `xlink:href`)
- `<image>` elements referencing external content

Implementations should prefer a whitelist-based approach, allowing only safe SVG elements such as:

- `rect`, `circle`, `ellipse`
- `path`, `line`, `polyline`, `polygon`
- `text`
- `g`

---

### 14.3 Data Handling

Form data must be treated strictly as data.

Implementations must:

- render values as plain text
- not interpret values as HTML or executable code

---

### 14.4 Formula Evaluation

Formulas must not allow execution of arbitrary code.

Implementations must restrict formula evaluation to safe, deterministic expressions.

Use of general-purpose code execution (e.g. `eval`, `Function`) is strongly discouraged.

---

### 14.5 Embedded SVG (Signatures)

If SVG content is embedded within form data (e.g. signatures):

- it must be sanitized using the same rules as layout SVG
- only safe graphical elements should be rendered

---

### 14.6 Resource Limits

Implementations should enforce limits to prevent denial-of-service attacks:

- maximum file size
- maximum SVG complexity
- maximum JSON size

---

### 14.7 Trust and Authenticity

eForm does not define authentication or identity mechanisms.

Authenticity and integrity are typically ensured by the transmission channel.

Examples include:

- authenticated portals
- secure upload systems
- controlled document exchange workflows

---

## 15. Signatures and Authenticity

eForm does not require built-in signature mechanisms.

In many use cases, document authenticity and integrity are ensured by the transmission channel, such as:

- secure upload portals
- authenticated communication systems
- trusted document exchange platforms

### Optional Document Signing

If electronic signatures are applied at the document level, implementations may sign selected resources within the container.

Typical candidates include:

- data.json
- layout SVG files
- preview.svg

The exact signature mechanism is not defined by this specification.

Future versions may define standardized approaches for embedded signatures.

### Design Principle

Signature handling should not interfere with:

- readability of the preview
- accessibility of structured data
- long-term preservation of documents

---

## 16. Informative Documents

Additional implementation guidance is provided in separate documents.

These documents are informative and not part of the core specification.

Examples include:

- docs/import-processing.md
- docs/mapping-and-semantics.md
- docs/form-design.md

Implementations may use these documents for guidance, but they are not required for compliance.

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

