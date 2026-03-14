# eForm Specification

Version: 0.1  
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

Without specialized software:

- the form layout remains visible
- the document remains printable

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
├ layout/
│   page1.svg
│
├ view/
│   page1-filled.svg
│
└ registries/

---

## 4. Main Components

### Layout

The layout defines the visual representation of the form.

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
  "values": {
    "firstname": "Anna"
  }
}

---

### Rendered View (Optional)

A rendered SVG representation of the filled form may be included.

Example:

view/page1-filled.svg

This allows the document to remain readable without specialized software.

---

### Registries (Optional)

Registries provide reusable references such as:

- standards
- code lists

These registries may reference external standards.

---

## 5. Compatibility

eForm is designed so that:

- operating systems can display the SVG layout
- specialized software can provide editing functionality

A viewer may add editing capabilities while preserving the original layout.

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
| Layout | visual representation |
| Field Anchor | SVG element defining field geometry |

---

## 8. Project Status

This specification is experimental and subject to change.
