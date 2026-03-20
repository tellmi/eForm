# eForm

Version: 0.6.6

**eForm** is an open document format for electronic forms.

It combines a **stable visual layout**, **structured form data**, and **machine-readable semantics** in a simple container format.

eForm allows forms to be:

* designed visually
* filled in manually or automatically
* transmitted between systems
* displayed without specialized software
* processed by machines

The format separates **visual layout**, **form structure**, and **user data**.

---

## Design Goals

* Long-term readability
* Human-friendly form design
* Machine-readable data
* Open specification
* Independence from proprietary software

An eForm document should remain readable like a paper form even without specialized software.

Opening the document should still show a printable form.
Note: Opening an `.eform` file directly in a browser may still show raw container data.
Use the reference viewer for proper rendering.

Because eForm layouts are SVG-based, documents can be displayed directly in modern web browsers without specialized software.

---

## What’s New in Version 0.65

Version 0.65 introduces important improvements to usability, preview handling, and format governance:

### Improved Preview Handling

* eForms now embed the container as **base64 inside an SVG comment**
* enables **direct SVG preview in browsers**
* UTF-8 header ensures correct rendering

### Signature Support (Enhanced)

* SVG signatures are now:

  * stored in `data.json`
  * rendered in the viewer
  * included in generated previews
* preview generation now reflects **actual filled state**, including signatures

### Viewer Improvements

* fixed tab navigation (computed fields skipped)
* improved editor behavior and field focus
* fixed positioning with scrolling layouts
* consistent rendering of all field types

### Stable Save Format

* saving now produces valid `.eform` files again (not raw SVG)
* preview + embedded container are correctly combined

### Introduction of Format Profiles

eForm introduces the concept of **derived profiles**:

* **eCase** — case management and administrative workflows
* **eBill** — billing and invoice documents

Profiles extend the base format while remaining fully compatible.

### Governance and Naming Rules

The identifiers:

* **eForm**
* **eCase**
* **eBill**

are part of the official specification.

Use of these names requires compliance with the respective specification and profiles.

This ensures consistency and prevents incompatible forks of the format.

### changes in 0.6.6
fixed importer.js to load the new eform spec.

---

## Specification

The specification is located in the `spec/` directory:

* `eform-spec.md` — core format definition
* `formula-spec.md` — formula system
* `layout-spec.md` — SVG layout rules
* `schema-spec.md` — schema definition

Additional documentation:

* `docs/import-processing.md` — import workflows and staging
* `docs/mapping-and-semantics.md` — semantic naming and mapping guidance

---

## Core Technologies

eForm intentionally uses simple and widely supported technologies:

* **SVG** for visual form layout and preview
* **ZIP container** for packaging structured resources
* **JSON** for schema, form data, and optional computation rules

These technologies ensure the format remains readable and easy to implement.

---

## Basic Structure

An `.eform` file consists of two parts:

1. a **static SVG preview**
2. an **embedded container (base64-encoded ZIP)**

Conceptual structure:

```text
form.eform
├ preview.svg
└ [embedded ZIP container]
   ├ mimetype
   ├ manifest.json
   ├ schema.json
   ├ data.json
   ├ layout/
   │   └ page1.svg
   ├ formulas/
   │   └ formulas.json
   └ registries/
       └ standards.json
```

---

## Components

### Preview

`preview.svg` contains a static rendering of the filled form so the document remains readable even without specialized software.

The preview is automatically generated from layout and data and may include:

* text field values
* computed values
* embedded signatures

---

### Layout

The **SVG layout** defines the editable structure of the form.

Field positions are defined using **field anchors** embedded in the layout.

---

### Schema

The **schema** describes the logical structure of the form.

It defines:

* field types
* validation hints
* optional semantic identifiers
* optional format hints such as:

```text
email
phone
iban
url
```

---

### Data

The **data file** stores the current values of the form fields.

This may include structured values such as:

```json
{
  "signature": {
    "type": "svg",
    "value": "<svg>...</svg>"
  }
}
```

---

### Formulas (Optional)

The **formulas** component defines relationships between fields.

Example:

```text
f3 = f1 - f2
```

---

## Field Anchors

Form fields are defined directly in the SVG layout using **field anchors**.

Example:

```text
<rect data-eform-field="f1" x="70" y="65" width="100" height="10"/>
```

---

## How It Works

A viewer processes an eForm roughly as follows:

1. open the `.eform` file
2. extract the embedded container
3. read `manifest.json`
4. load the SVG layout
5. detect field anchors
6. match them with `schema.json`
7. display values from `data.json`
8. apply optional formulas

This design keeps viewer implementations simple while enabling automated processing.

---

## Demo

Two minimal tools demonstrate the eForm concept:

* `tools/viewer.html`
  Interactive form viewer for rendering and editing forms

* `tools/importer.html`
  Data importer showing how structured form data can be extracted

These tools demonstrate both:

* user interaction with forms
* system integration and data processing

---

## Repository Structure

```text
spec/       format specifications  
examples/   example forms  
viewer/     reference viewer prototype  
tools/      helper utilities  
docs/       documentation and guides  
```

---

## License

This project is licensed under the **Mozilla Public License 2.0 (MPL-2.0)**.

* Modifications to existing files must remain open
* New components may be combined with proprietary systems

This ensures openness of the core while allowing broad adoption.

---

## Project Status

This project is currently **experimental**.

The specification is under active development and subject to change.

The current focus is:

* stabilizing the core format
* improving interoperability
* defining standard profiles (eCase, eBill)
* enabling real-world integration

---

## Vision

eForm aims to provide a simple, open, and durable format for digital forms that combines:

* PDF-like visual stability
* web-style openness
* structured machine-readable data

The long-term goal is to enable reliable exchange and processing of forms across systems without proprietary dependencies.

