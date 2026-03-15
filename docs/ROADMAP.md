# eForm Project Roadmap

Version: 0.2

This document outlines the planned development stages of the eForm project.

The goal is to evolve the format gradually while keeping the core specification stable and simple.

---

# Phase 1 — Prototype

Status: completed

The initial prototype demonstrates the core architecture of the eForm format.

Completed work:

- container architecture defined
- hybrid file structure (`preview.svg + ZIP`)
- MIME type definition
- SVG layout concept
- field anchor mechanism
- schema definition
- data model (`data.json`)
- example form
- form packer script
- basic viewer prototype

The viewer can now:

- open `.eform` documents
- render SVG layouts
- detect field anchors
- edit field values
- update `data.json`

The format is now **functionally demonstrable**.

---

# Phase 2 — Basic Tooling

Focus: enabling real-world usage.

Planned work:

## Viewer improvements

- inline text editing
- cursor support
- keyboard navigation
- zoom controls
- improved field highlighting

## Editing features

- update `data.json`
- regenerate `preview.svg`
- rebuild `.eform` container

## Field rendering

Support additional field types:

- checkbox fields
- radio button groups
- dropdown selections
- date fields

## Validation hints

Viewer-side guidance for schema hints:

- `maxLength`
- `pattern`
- `required`

Server-side validation remains the responsibility of receiving systems.

---

# Phase 3 — Ecosystem

Focus: supporting a wider developer ecosystem.

Planned additions:

- reference viewer implementation
- form editor prototype
- additional example forms
- improved documentation
- schema registry examples
- form validation examples

This phase aims to make the format easier to adopt by developers.

---

# Phase 4 — Format Stabilization

Focus: preparing a stable specification.

Goals:

- finalize container structure
- define SVG restrictions
- clarify schema semantics
- improve compatibility rules
- stabilize MIME type definition
- document hybrid container behavior

Once stabilized, the specification may reach **version 1.0**.

---

# Phase 5 — Format Profiles

Specialized formats may be derived from eForm.

Examples:

## eBill

Structured invoice format using eForm.

Possible features:

- standardized invoice fields
- code list references
- validation profiles

---

## eCase

Container format for case files or document bundles.

Possible features:

- multiple forms
- supporting documents
- case metadata

These profiles extend the base eForm architecture without modifying the core specification.

---

# Long-Term Vision

The long-term goal is to establish eForm as a simple open standard for digital forms.

Potential future areas include:

- government forms
- legal document workflows
- business form exchange
- structured document archives

The project prioritizes:

- simplicity
- durability
- openness
