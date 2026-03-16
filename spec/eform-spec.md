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

~~~text
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
~~~

The preview SVG allows the document to remain readable without specialized software.

The ZIP container stores the structured form resources used by viewers and editors.

The preview SVG may be followed by an open XML comment so that the ZIP container can be appended to the file.

Example physical layout:

~~~text
<svg>...</svg>
<!-- eform-container -->
[ZIP archive]
~~~

ZIP readers locate the archive from the end of the file, so additional data before the archive does not affect extraction.

---

## 4. Main Components

### Preview

The preview is a static SVG document placed at the beginning of the file.

It represents the **rendered filled form**.

Characteristics:

- contains the complete visual representation
- may contain multiple pages
- contains no field anchors
- contains no scripts or external resources

The preview allows the document to remain readable even if no eForm software exists.

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

~~~json
{
  "f1": "Anna"
}
~~~

Each key corresponds to a field identifier defined in `schema.json`.

---

### Formulas (Optional)

The formulas component defines relationships between fields.

Formulas allow automatic computation of derived values based on other field values.

Example:

f7 = f5 - f6

Formulas assist form filling software and reduce the risk of incorrect user input.

Formulas are optional and do not replace validation performed by receiving systems.

---

### Stored Values and Recalculation

Computed field values may be stored in `data.json`.

These stored values represent the value of the field at the time the form was last saved.

Example:

~~~json
{
  "f5": 5000,
  "f6": 3200,
  "f7": 1800
}
~~~

Software processing an eForm should recompute formula results when formulas are present.

If a stored value differs from the recomputed result, the recomputed value should be considered authoritative.

Importers may ignore stored values for computed fields and rely on recomputed results.

This behavior allows:

- consistent validation
- detection of modified or inconsistent data
- compatibility with systems that do not evaluate formulas

---

### Deterministic Evaluation

Formulas must be deterministic and side-effect free.

Formula evaluation must depend only on the values of referenced fields.

Implementations must not rely on:

- external data sources
- random number generation
- system time
- environment-dependent values

This requirement ensures that all implementations compute identical results.

The syntax and evaluation rules of formulas are defined in the
Formula Specification document.

---

### Registries (Optional)

Registries provide reusable references such as:

- standards
- code lists

These registries may reference external standards.

---

## 5. Multi-Page Documents

Forms may contain multiple pages.

The editable layout may therefore contain multiple SVG files:

~~~text
layout/page1.svg
layout/page2.svg
layout/page3.svg
~~~

The preview SVG contains all pages rendered sequentially.

Pages are typically stacked vertically within the preview document.

---

## 6. Compatibility

eForm is designed so that:

- browsers can display the preview SVG directly
- operating systems can display the document without specialized software
- specialized software can provide interactive editing

A viewer reads the ZIP container to access schema, data, layout resources, and optional formulas.

---

## 7. MIME Type

The MIME type for eForm documents is:

~~~text
application/eform+zip
~~~

The ZIP container must include a file named `mimetype` as the first entry in the archive.

The file must contain exactly the MIME type string and must not be compressed.

---

## 8. Versioning

The specification uses semantic versioning.

~~~text
0.x experimental
1.x stable
~~~

The manifest may include the specification version.

---

## 9. Terminology

| Term | Meaning |
|------|--------|
| eForm | document container |
| Viewer | software rendering and editing the form |
| Schema | logical field definition |
| Layout | editable form template |
| Preview | static rendered form document |
| Field Anchor | SVG element defining field geometry |

---

## 10. Project Status

This specification is experimental and subject to change.
