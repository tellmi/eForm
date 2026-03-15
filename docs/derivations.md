# eForm Format Derivations

Version: 0.2

---

## 1. Overview

The eForm format is designed as a minimal document format.

Specialized use cases may define derivative formats built on top of the eForm container.

These derivatives extend eForm without modifying the core specification.

Examples include:

- electronic invoices
- case files
- document bundles

Derived formats inherit the base eForm architecture and may define additional constraints or conventions.

---

## 2. Design Philosophy

The base eForm format focuses on three core concepts:

visual layout  
structured form data  
machine-readable schema  

Complex workflows, attachments, or domain-specific rules are intentionally excluded from the core format.

Derived formats may define additional rules while remaining compatible with the eForm container structure.

---

## 3. eBill Format

The `.ebill` format is a specialized profile of eForm used for structured invoices.

An eBill document remains an eForm container but defines additional constraints.

Typical requirements may include:

- mandatory fields (invoice number, amount, currency)
- standardized semantics
- reference code lists
- validation rules

Example structure:

~~~text
invoice.ebill

preview.svg

[ZIP container]

mimetype
manifest.json
schema.json
data.json

layout/
  invoice.svg

registries/
~~~

The manifest may include a profile identifier.

Example:

~~~json
{
  "type": "open-eform",
  "profile": "ebill"
}
~~~

Specialized software may validate that required fields are present and conform to the invoice profile.

---

## 4. eCase Format

The `.ecase` format represents a case or dossier containing multiple documents.

Unlike eForm, eCase acts as a **container for multiple resources**.

An eCase may include:

- multiple eForms
- supporting documents
- case metadata

Example structure:

~~~text
case.ecase

manifest.json

forms/
  application.eform
  tax.eform

documents/
  passport.pdf
  contract.pdf
~~~

The eCase container typically uses ZIP packaging.

The manifest describes the contents of the case.

Example:

~~~json
{
  "type": "open-ecase",
  "version": "1.0",
  "forms": [
    "forms/application.eform"
  ],
  "documents": [
    "documents/passport.pdf"
  ]
}
~~~

---

## 5. Compatibility

Derived formats must remain compatible with the base eForm specification.

Software that understands only eForm should still be able to extract and render individual forms contained in derived formats.

Derived formats should therefore avoid modifying the fundamental structure of eForm documents.

---

## 6. Future Extensions

Possible future derivatives include:

- application packages
- legal filing bundles
- invoice archives
- document exchange containers

The eForm specification intentionally keeps the base format minimal to allow such extensions.
