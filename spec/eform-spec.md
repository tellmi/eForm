# eForm Specification

Version: 0.2  
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

## 2. Design Principles

### Long-term readability

Documents must remain readable decades later.

This is achieved through the use of widely supported technologies:

- ZIP container
- SVG layout
- JSON metadata

### Self-contained documents

All resources required to render the form must be contained inside the document.

External resources must not be required.

### Human-first design

eForm is primarily a **user interface format**.

Users may enter incorrect data.  
Final validation is the responsibility of the receiving system.

### Graceful degradation

Without specialized software the document must remain readable.

This is achieved through a static SVG preview of the filled form.

---

## 3. File Structure

An `.eform` file is a ZIP container.

Example structure:

form.eform
│
├ mimetype
├ manifest.json
├ schema.json
├ data.json
│
├ preview.svg
│
├ layout/
│ page1.svg
│
└ registries/


The preview SVG contains a static rendering of the filled form and allows the document to remain readable without specialized software.

The ZIP container stores the structured form resources used by viewers and editors.

---

## 4. Main Components

### Preview

The preview is a static SVG representation of the filled form.

The preview:

- contains the complete visual representation of the document
- may contain multiple pages
- must not contain field anchors
- must not contain scripts or external resources

The preview ensures that the document remains readable even without eForm software.

---

### Layout

The layout defines the editable structure of the form.

Layouts use **SVG**.

The layout is the authoritative source for:

- page geometry
- field positioning

Field anchors are defined directly in the SVG layout.

---

### Schema

The schema defines logical field properties such as:

- field type
- validation hints
- semantic references

The schema does **not define layout geometry**.

---

### Data

The data file stores the current field values.

Example:

{
"firstname": "Anna"
}


---

### Registries (Optional)

Registries provide reusable references such as:

- standards
- code lists

These registries may reference external standards.

---

## 5. Compatibility

eForm is designed so that:

- operating systems can display the preview SVG directly
- browsers can display the document without specialized software
- specialized software can provide interactive editing

A viewer reads the container to access schema, data, and layout resources.

---

## 6. Versioning

The specification uses semantic versioning.

0.x experimental
1.x stable


The manifest must include the specification version.

---

## 7. Terminology

| Term | Meaning |
|-----|------|
| eForm | document container |
| Viewer | software rendering and editing the form |
| Schema | logical field definition |
| Layout | editable form template |
| Preview | static rendered form document |
| Field Anchor | SVG element defining field geometry |

---

## 8. Project Status

This specification is experimental and subject to change.

Change Log (building for your commit)

Current tracked changes:

SPEC REFACTOR (draft)

Architecture
- remove view/ directory concept
- introduce preview.svg static rendering
- simplify container structure

Specification
- clarify preview vs layout responsibilities
- simplify data.json example

Compatibility
- allow direct rendering via preview.svg
