# eForm Viewer Implementation Guide

---

## 1. Purpose

This document describes how software can implement a viewer or editor for eForm documents.

The goal is to keep viewer implementations simple while ensuring consistent behavior across implementations.

A viewer should be able to:

- open an `.eform` document
- render the SVG layout
- detect field anchors
- display field values
- allow editing of field values
- optionally compute derived values

---

## 2. Loading an eForm

An `.eform` file consists of a **preview SVG followed by an embedded ZIP container**.

A viewer should process the document using the following steps:

1. Locate the embedded ZIP container  
2. Read `manifest.json`  
3. Load the schema  
4. Load the data file (if present)  
5. Load the layout SVG pages  
6. Render the pages  
7. Detect field anchors  

The preview SVG may be used as a quick static rendering of the document.

---

## 3. Detecting Fields

Fields are detected in the SVG layout using the attribute:

~~~text
data-eform-field
~~~

Example:

~~~xml
<rect data-eform-field="f1" x="70" y="65" width="100" height="10"/>
~~~

Each field anchor corresponds to a field defined in `schema.json`.

---

## 4. Rendering Field Values

The viewer should render values from `data.json` inside the corresponding field geometry.

Example `data.json`:

~~~json
{
  "f1": "Anna"
}
~~~

The viewer may render the value using an SVG `<text>` element positioned within the anchor rectangle.

---

## 5. Editing Fields

Viewers may allow editing of field values.

Typical interaction:

~~~text
click field
enter value
update displayed text
~~~

The underlying data structure must be updated accordingly.

Example:

~~~json
{
  "f1": "Anna"
}
~~~

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

~~~text
maxLength
pattern
required
~~~

Viewers may use these hints to assist users during form entry.

However, these hints do not replace server-side validation.

---

## 8. Optional Formula Evaluation

Forms may include an optional formulas component:

~~~text
formulas/formulas.json
~~~

Formulas describe relationships between fields.

Example:

~~~text
f3 = f1 - f2
~~~

A viewer may evaluate these formulas to compute derived field values.

Typical behavior:

1. load formulas  
2. compute derived values  
3. update computed fields when dependent fields change  

Computed fields should typically be treated as **read-only** in the user interface.

Formula evaluation assists form filling but does not replace server-side validation.

---

## 9. Saving Changes

If editing is supported, the viewer should update `data.json`.

Example workflow:

~~~text
user edits fields
viewer updates values
container is rebuilt and saved
~~~

Editors may also regenerate the preview SVG when form data changes.

---

## 10. Preview Rendering

The beginning of the `.eform` file contains a static preview SVG.

Viewers may display this preview for quick rendering.

Editors should regenerate the preview when form data changes.

---

## 11. Error Handling

Viewers should handle inconsistencies gracefully.

Examples:

- schema field missing in layout
- layout anchor missing in schema
- unknown field types
- unsupported formulas

In such cases, viewers should attempt best-effort rendering.

---

## 12. Forward Compatibility

Viewers must ignore unknown files or directories inside the container.

This ensures compatibility with future extensions of the eForm format.
