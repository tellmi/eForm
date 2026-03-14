# eForm Viewer Implementation Guide

Version: 0.1

---

## 1. Purpose

This document describes how software can implement a viewer or editor for eForm documents.

The goal is to keep viewer implementations simple while ensuring consistent behavior across implementations.

A viewer should be able to:

- open an `.eform` container
- render the SVG layout
- detect field anchors
- display field values
- allow editing of field values

---

## 2. Loading an eForm

A viewer should process an eForm container using the following steps.

1. Open the `.eform` ZIP container
2. Read `manifest.json`
3. Load the schema
4. Load the data file (if present)
5. Load the layout SVG pages
6. Render the pages
7. Detect field anchors

---

## 3. Detecting Fields

Fields are detected in the SVG layout using the attribute:

data-eform-field

Example:

<rect data-eform-field="firstname" x="70" y="65" width="100" height="10"/>

Each field anchor corresponds to a field defined in `schema.json`.

---

## 4. Rendering Field Values

The viewer should render values from `data.json` inside the corresponding field geometry.

Example:

data.json

{
  "values": {
    "firstname": "Anna"
  }
}

The viewer may render the value using an SVG `<text>` element positioned within the anchor rectangle.

---

## 5. Editing Fields

Viewers may allow editing of field values.

Typical interaction:

click field  
enter value  
update displayed text

The underlying data structure must be updated accordingly.

Example:

{
  "values": {
    "firstname": "Anna"
  }
}

---

## 6. Field Type Rendering

Viewers may render different UI widgets depending on field type.

Example mapping:

| Field Type | Suggested Rendering |
|-------------|---------------------|
| string | text input |
| number | numeric input |
| date | date input |
| boolean | checkbox |
| selection | radio buttons or dropdown |

The exact UI is implementation-specific.

---

## 7. Validation Hints

The schema may contain validation hints such as:

maxLength  
pattern  
required

Viewers may use these hints to assist users during form entry.

However, these hints do not replace server-side validation.

---

## 8. Saving Changes

If editing is supported, the viewer should update `data.json`.

Example workflow:

user edits fields  
viewer updates values  
container is rebuilt and saved

---

## 9. Rendered View

If the container includes a rendered SVG representation:

view/page1-filled.svg

the viewer may display this as a static preview.

Editors should regenerate this view when form data changes.

---

## 10. Error Handling

Viewers should handle inconsistencies gracefully.

Examples:

- schema field missing in layout
- layout anchor missing in schema
- unknown field types

In such cases, viewers should attempt best-effort rendering.

---

## 11. Forward Compatibility

Viewers must ignore unknown files or directories inside the container.

This ensures compatibility with future extensions.
