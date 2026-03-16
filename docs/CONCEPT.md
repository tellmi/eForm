# eForm Concept

eForm is an open document format for electronic forms.

The goal of the project is to provide a simple and durable format for digital forms that combines:

- stable visual layout
- structured machine-readable data
- long-term readability

An eForm behaves like a **digital equivalent of a paper form**.

---

# Core Idea

An eForm document separates several concerns:

layout  
schema  
data  
formulas (optional)

| Component | Purpose |
|--------|---------|
| Layout (SVG) | visual form design |
| Schema (JSON) | logical field definition |
| Data (JSON) | current form values |
| Formulas (JSON, optional) | relationships between fields |

This separation keeps the format flexible while maintaining readability and simplicity.

---

# Design Philosophy

The design of eForm follows several key principles.

## Simplicity

The format is intentionally minimal and relies only on widely supported technologies:

- SVG preview
- ZIP container
- JSON metadata

No proprietary technologies are required.

---

## Human-first documents

An eForm must remain understandable even without specialized software.

Opening the preview SVG should still show a printable form.

This mirrors the behavior of traditional paper forms.

---

## Long-term readability

Documents must remain accessible decades later.

Using open and well-supported technologies ensures long-term compatibility.

---

## Structured data

While visually resembling paper forms, eForms also contain structured data.

This allows:

- automatic processing
- system integration
- machine-readable workflows

---

## Assistive computation

Forms may optionally include formulas that describe relationships between fields.

These formulas allow form filling software to automatically compute values and reduce user errors.

Formulas are optional and do not replace server-side validation.

---

# Architecture

An `.eform` file combines a **static preview document** and a **ZIP container** containing the editable form resources.

Conceptual structure:

~~~text
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
~~~

The preview SVG ensures that the document remains readable even without specialized eForm software.

The ZIP container stores the structured resources used by viewers and editors.

---

# Field Anchors

Form fields are defined directly inside the SVG layout using **field anchors**.

Example:

`<rect data-eform-field="f1" x="70" y="65" width="100" height="10"/>`

The attribute connects the visual layout to the schema definition.

---

# Viewer Model

A viewer processes an eForm using the following steps:

1. locate the embedded ZIP container  
2. read `manifest.json`  
3. load layout SVG pages  
4. detect field anchors  
5. load schema definitions  
6. populate values from `data.json`  
7. apply optional formulas to compute derived values  

This model allows viewer implementations to remain small and simple.

---

# Optional Extensions

The core eForm format intentionally avoids complex features.

More specialized use cases may define derived formats, such as:

- `.ebill` — structured invoice profile
- `.ecase` — case container for multiple documents

These formats extend eForm while keeping the core specification stable.

---

# Project Goals

The long-term goal of the project is to provide a simple open format that combines:

- PDF-like layout stability  
- web-style openness  
- machine-readable data  

eForm aims to make digital forms easier to design, exchange, and process.
