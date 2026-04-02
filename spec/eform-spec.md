# eForm Specification

Status: Draft
Project: open-eform

---

## 1. Overview

**eForm** is an open document format for interactive digital forms.

The format combines:

* stable visual layout (SVG)
* structured data (JSON or alternative formats)
* machine-readable schema (JSON)

An eForm behaves as the **digital equivalent of a paper form**.

The document must remain readable and printable even without specialized software.

---

## Normative Language

The key words "must", "must not", "should", and "may" are to be interpreted as follows:

* "must" indicates a requirement
* "must not" indicates a prohibition
* "should" indicates a recommendation
* "may" indicates an optional feature

---

## 2. Design Principles

### Long-term readability

Documents must remain readable decades later.

This is achieved through the use of widely supported technologies:

* SVG
* ZIP container
* JSON metadata

---

### Self-contained documents

All resources required to render the form must be contained inside the document.

External resources must not be required.

---

### Human-first design

eForm is primarily a **user interface format**.

Users may enter incorrect data.
Final validation is the responsibility of the receiving system.

---

### Graceful degradation

Without specialized software:

* the filled form must remain readable
* the document must remain printable

This is achieved through a static SVG preview embedded at the beginning of the file.

---

## 3. File Structure

An `.eform` file consists of two parts:

1. a **static SVG preview document**
2. a **ZIP container containing the form resources**

Example structure:

```
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
```

The preview SVG allows the document to remain readable without specialized software.

The ZIP container stores the structured form resources used by viewers and editors.

The preview SVG may be followed by an open XML comment so that the container can be appended to the file.
Note: Opening an `.eform` file directly in a browser may still show raw container data.
Use the reference viewer for proper rendering.

Example physical layout:

```
<svg>...</svg>
<!-- eform-container
BASE64_ENCODED_ZIP_DATA
-->
```

The container is base64-encoded and embedded inside an XML comment.

Implementations must extract and decode this section to access the ZIP container.

---

## 4. Components

### Preview

The preview is a static SVG document placed at the beginning of the file.

It represents the **rendered filled form**.

Characteristics:

* contains the complete visual representation
* may contain multiple pages
* contains no field anchors
* contains no scripts or external resources

---

### Preview Consistency

The preview SVG must represent the current state of the form data.

The preview should be visually consistent with the values stored in the data resource.

Minor rendering differences (e.g. font substitution) are acceptable, but the semantic content must match.

---

### Preview Generation

The preview SVG should be generated automatically from the layout and the current form data.

If inconsistencies are detected, implementations should prefer the structured data.

---

### Layout

The layout defines the editable structure of the form.

Layouts use **SVG** and are the authoritative source for:

* page geometry
* field positioning

Layouts must not contain scripts or external resource references.

---

### Layout Coordinate System

* origin (0,0) is top-left
* x increases right, y increases downward
* units are SVG user units

Layouts must define a `viewBox`.

Example:

```
<svg viewBox="0 0 210 297">
```

---

### Field Anchors

Any SVG element with:

```
data-eform-field
```

is a field anchor.

Example:

```
<rect data-eform-field="person.name"/>
```

---

### Schema

The schema defines logical field properties such as:

* field type
* validation hints
* semantic references

It does not define layout geometry.

---

### Data

The data component stores the current field values.

The default format is:

```
data.json
```

Profiles may define alternative formats (e.g. XML).

The data resource referenced in `manifest.json` is the **authoritative source of field values**.

Implementations must not assume a specific data format unless required by a profile.

---

### Formulas (Optional)

Formulas define relationships between fields.

They must be deterministic and side-effect free.

---

### Registries (Optional)

Registries provide reusable references such as standards or code lists.

Registry identifiers (e.g. `codeList`, `format`) reference entries in registries.

Implementations may resolve identifiers using:

* built-in knowledge
* external definitions
* embedded registry files

Documents should include only the registry data required.

👉 See Section 5 for registry resolution behavior.

---

## 5. Registry Resolution (Non-Normative)

This section describes how registry references are resolved.

### Embedded Registry (Highest Priority)

If present:

```
registries/standards.json
```

must be used.

---

### Built-in Definitions

Implementations may use built-in standards:

* ISO-3166
* ISO-4217
* common formats

---

### External Resolution (Optional)

External lookup may be used but must not be required.

---

### Fallback Behavior

If unresolved:

* treat as basic field
* ignore unknown identifiers
* keep document renderable

---

### Design Principles

* must not affect stored data values
* must not change interpretation of stored data
* must be optional
* must fail gracefully

---

## 6. Multi-Page Documents

Forms may contain multiple pages.

---

## 7. Manifest

The file `manifest.json` describes the container structure and references all primary resources of the form.

Example (non-normative):

{
  "layout": ["layout/page1.svg"],
  "schema": "schema.json",
  "data": "data.json"
}

---

### Required Properties

The manifest must include:

- `layout` → array of layout SVG files (page order)
- `schema` → path to the schema definition
- `data` → path to the primary data resource

The manifest must reference the primary data resource used by the form.

---

### Optional Properties

The manifest may include references to additional resources:

- `formulas` → path to a formulas definition file
- `registries` → array of registry files

Example:

{
  "layout": ["layout/page1.svg"],
  "schema": "schema.json",
  "data": "data.json",
  "formulas": "formulas/formulas.json",
  "registries": ["registries/standards.json"]
}

---

### Behavior

- The order of entries in `layout` defines the page order
- Optional resources may be omitted without affecting document validity
- Implementations must ignore unknown properties
---

## 7.1 Form Identification

Optional metadata:

* formPublisher
* publisherDepartment
* formName
* formInternalName (e.g. "tax0815")
* formVersion
* formURL

### Description

These properties provide additional identification and reference information for the form.

They are intended to support:

* human-readable identification (`formName`)
* internal system references (`formInternalName`)
* version tracking (`formVersion`)
* optional publisher reference (`formURL`)

All properties in this section are optional.

Implementations must:

* treat these properties as metadata only
* not require their presence for rendering or processing
* ignore unknown or unsupported properties

---

### formInternalName

A stable identifier used by the publishing organization.

Characteristics:

* may be cryptic or system-oriented
* should remain stable across revisions
* may be used for database mapping or backend processing

This value is not intended for end-user display.

---

### formURL

A reference URL provided by the form publisher.

It may be used by implementations to:

* provide access to the publisher’s website
* allow users to manually check for newer versions of the form
* provide additional information about the form

#### Security Requirements

The `formURL` value is part of the document and must be treated as untrusted input.

Implementations must:

* not assume the URL is trustworthy
* not automatically open the URL
* not perform automatic network requests based on this value
* not automatically download or replace form content

Access to the URL must require explicit user interaction.

Implementations must:

* clearly display the full target URL before navigation
* inform the user when leaving the local document context

Implementations must ensure that:

* form usability does not depend on accessing the URL
* failure to access the URL does not affect form functionality

## 7.1.1 Update System (Informative)

Implementations may provide an optional mechanism to check whether a newer version of a form is available.

This mechanism may use the `formURL` as a reference to the publisher.

### Behavior

Update checks must be:

* explicitly triggered by the user
* optional
* non-blocking

Implementations must not:

* perform automatic update checks without user interaction
* automatically download updated forms
* automatically replace the currently opened form
* prevent users from continuing to use an older version

---

### User Interaction

If an implementation provides update functionality:

* the user must initiate the check (e.g. "Check for updates")
* the target URL must be clearly visible
* the user must be informed before any network request is made

If a newer version is detected:

* implementations may inform the user
* implementations may offer a download option
* the user must decide whether to proceed

---

### Security Considerations

The update mechanism must treat all remote content as untrusted.

Implementations must:

* not execute remote code
* not render remote HTML without sanitization
* validate all received data

---

### Design Principles

The update system must follow these principles:

* offline-first: the form must remain usable without network access
* user control: all network actions require explicit consent
* non-destructive: existing form data must not be modified or lost
* transparency: all external interactions must be visible to the user

---

## 8. Encoding

All text must use UTF-8.

---

## 9. Compatibility

eForm is designed for browser rendering and system processing.

---

### Profiles (Informative)

Profiles extend the base format.

They may define:

* alternative data formats
* additional processing rules

Examples:

* eBill
* eCase

Defined in:

```
spec/derivations.md
```

---

## 10. MIME Type

```
application/eform+zip
```

---

## 11. ZIP Container Requirements

Standard ZIP format must be used.

---

## 12. Versioning

Semantic versioning applies.

---

## 13. Terminology

| Term   | Meaning            |
| ------ | ------------------ |
| eForm  | document container |
| Viewer | rendering software |

---

## 13.1 Naming and Compliance

The identifiers:

* eForm
* eCase
* eBill

require compliance with their specifications.

---

## 14. Project Status

Experimental and subject to change.

---

## 15. Security Considerations

All content must be treated as untrusted.

---

### General Principles

* validate and sanitize input
* do not execute embedded code
* fail safely

---

### SVG Processing

Must sanitize before rendering or processing.

Remove:

* `<script>`
* event handlers
* `<foreignObject>`
* external references
* `<image>`

Allow safe elements only.

---

### Data Handling

* treat as plain text
* no HTML execution

---

### Formula Evaluation

* no arbitrary code
* deterministic only

---

### Embedded SVG (Signatures)

* must be sanitized
* only safe elements rendered

---

### Resource Limits

Implement limits for:

* file size
* SVG complexity
* JSON size

---

### Trust and Authenticity

Handled by external systems (e.g. portals).

---

## 16. Signatures and Authenticity

No built-in signature mechanism required.

Optional document-level signing may include:

* data
* layout
* preview

---

## 17. Informative Documents

See:

* docs/import-processing.md
* docs/mapping-and-semantics.md
* docs/form-design.md

---

## 18. Signature Fields (Experimental)

Example:

```
{
  "type": "svg",
  "value": "<svg>...</svg>"
}
```

---

## 19. Visual Identity (Non-Normative)

Profiles may define icons.

Examples:

* eCase → container / suitcase
* eBill → currency + document

Visual identity is optional.

