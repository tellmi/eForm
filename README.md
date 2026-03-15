# eForm

Version: 0.3

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

---

## Core Technologies

eForm intentionally uses simple and widely supported technologies:

- **SVG** for visual form layout and preview
- **ZIP container** for packaging structured resources
- **JSON** for schema and form data

These technologies ensure the format remains readable and easy to implement.

---

## Basic Structure

An `.eform` file consists of two parts:

1. a **static SVG preview**
2. a **ZIP container containing the form resources**

Conceptual structure:

```
form.eform

preview.svg

[ZIP container]

mimetype
manifest.json
schema.json
data.json

layout/
  page1.svg

registries/
  standards.json
```

### Preview

`preview.svg` contains a static rendering of the filled form so the document remains readable even without specialized software.

### Layout

The **SVG layout** defines the editable structure of the form.

### Schema

The **schema** describes field types and validation hints.

### Data

The **data file** stores the current values of the form fields.

---

## Field Anchors

Form fields are defined directly in the SVG layout using **field anchors**.

Example:

```
<rect data-eform-field="firstname" x="70" y="65" width="100" height="10"/>
```

The `data-eform-field` attribute links the visual layout to the field defined in `schema.json`.

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

This design keeps viewer implementations simple.

---

## Repository Structure

```
spec/       format specifications
examples/   example forms
viewer/     reference viewer prototype
tools/      helper utilities
docs/       documentation and guides
```

---

## Project Status

This project is currently **experimental**.

The specification and tooling are under active development.
