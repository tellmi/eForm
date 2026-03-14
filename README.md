# eForm

Version: 0.2

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

- **ZIP container** for packaging
- **SVG** for visual form layout
- **JSON** for schema and form data

These technologies ensure the format remains readable and easy to implement.

---

## Basic Structure

An `.eform` file is a ZIP container containing the form resources.

Example structure:

```
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
│   page1.svg
│
└ registries/
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
&lt;rect data-eform-field="firstname" x="70" y="65" width="100" height="10"/&gt;
```

The `data-eform-field` attribute links the visual layout to the field defined in `schema.json`.

---

## How It Works

A viewer processes an eForm roughly as follows:

1. open the `.eform` ZIP container  
2. read `manifest.json`  
3. load the SVG layout  
4. detect field anchors  
5. match them with `schema.json`  
6. display values from `data.json`  

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
