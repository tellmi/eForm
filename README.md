# eForm

Version: 0.5

**eForm** is an open document format for electronic forms.

It combines a **stable visual layout**, **structured form data**, and **machine-readable semantics** in a simple container format.

eForm allows forms to be:

- designed visually
- filled in manually or automatically
- transmitted between systems
- displayed without specialized software
- processed by machines

The format separates **visual layout**, **form structure**, and **user data**.

---

## Design Goals

- Long-term readability
- Human-friendly form design
- Machine-readable data
- Open specification
- Independence from proprietary software

An eForm document should remain readable like a paper form even without specialized software.

Opening the document should still show a printable form.

Because eForm layouts are SVG-based, documents can be displayed directly in modern web browsers without specialized software.

---

## What’s New in Version 0.5

Version 0.5 introduces several improvements:

- optional **semantic field identifiers** for better interoperability
- **form identification metadata** in the manifest
- clarified **preview generation rules**
- extended **security considerations**
- documentation for **import processing** and **mapping strategies**

These additions improve integration into real-world systems while keeping the core format simple.

---

## Specification

The specification is located in the `spec/` directory:

- `eform-spec.md` — core format definition
- `formula-spec.md` — formula system
- `layout-spec.md` — SVG layout rules
- `schema-spec.md` — schema definition

Additional documentation:

- `docs/import-processing.md` — import workflows and staging
- `docs/mapping-and-semantics.md` — semantic naming and mapping guidance

---

## Core Technologies

eForm intentionally uses simple and widely supported technologies:

- **SVG** for visual form layout and preview
- **ZIP container** for packaging structured resources
- **JSON** for schema, form data, and optional computation rules

These technologies ensure the format remains readable and easy to implement.

---

## Basic Structure

An `.eform` file consists of two parts:

1. a **static SVG preview**
2. a **ZIP container containing the form resources**

Conceptual structure:

```text
form.eform
├ preview.svg
└ [ZIP container]
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

The preview should be generated automatically from layout and data.

---

### Layout

The **SVG layout** defines the editable structure of the form.

Field positions are defined using **field anchors** embedded in the layout.

---

### Schema

The **schema** describes the logical structure of the form.

It defines:

- field types
- validation hints
- optional semantic identifiers
- optional format hints such as:

```text
email
phone
iban
url
```

---

### Data

The **data file** stores the current values of the form fields.

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
2. locate the embedded ZIP container
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

- `tools/viewer.html`
Interactive form viewer for rendering and editing forms

- `tools/importer.html`
Data importer showing how structured form data can be extracted

These tools demonstrate both:

- user interaction with forms
- system integration and data processing

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

## Project Status

This project is currently **experimental**.

The specification is under active development and subject to change.

The current focus is:

- stabilizing the core format
- improving interoperability
- demonstrating real-world integration

---

## Vision

eForm aims to provide a simple, open, and durable format for digital forms that combines:

- PDF-like visual stability
- web-style openness
- structured machine-readable data

The long-term goal is to enable reliable exchange and processing of forms across systems without proprietary dependencies.

