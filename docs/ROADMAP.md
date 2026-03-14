
---

# ROADMAP.md

Version: 0.1

```markdown
# eForm Project Roadmap

This document outlines the planned development stages of the eForm project.

The goal is to evolve the format gradually while keeping the core specification stable and simple.

---

# Phase 1 — Prototype

Status: completed

The initial prototype demonstrates the core architecture.

Completed work:

- container format defined
- SVG layout concept
- field anchor mechanism
- schema definition
- example form
- basic viewer prototype

The format is now functionally demonstrable.

---

# Phase 2 — Basic Tooling

Focus: enabling real-world usage.

Planned work:

viewer improvements

- inline text editing
- cursor support
- keyboard navigation

editing features

- update `data.json`
- rebuild `.eform` container

field rendering

- checkbox fields
- radio button groups
- dropdown selections
- date fields

validation hints

- maxLength
- pattern
- required

---

# Phase 3 — Ecosystem

Focus: supporting a wider developer ecosystem.

Planned additions:

- reference viewer implementation
- form editor prototype
- additional example forms
- improved documentation
- schema registry examples

---

# Phase 4 — Format Stabilization

Focus: preparing a stable specification.

Goals:

- finalize container structure
- define SVG restrictions
- clarify schema semantics
- improve compatibility rules

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

---

# Long-Term Vision

The long-term goal is to establish eForm as a simple open standard for digital forms.

Potential future areas include:

- government forms
- legal document workflows
- business form exchange
- structured document archives

The project prioritizes **simplicity, durability, and openness**.
