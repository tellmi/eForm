# eForm Format Derivations

Version: 0.1

---

## 1. Overview

The eForm format is designed as a minimal document format.

Specialized use cases may define derivative formats built on top of the eForm container.

These derivatives extend eForm without modifying the core specification.

Examples include:

- electronic invoices
- case files
- document bundles

---

## 2. Design Philosophy

The base eForm format focuses on:

visual layout  
structured form data  
machine-readable schema

Complex workflows, attachments, or domain-specific rules are intentionally excluded from the core format.

Derived formats may define additional conventions.

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

invoice.ebill

├ manifest.json  
├ schema.json  
├ data.json  
├ layout/  
│   invoice.svg  

The manifest may include a profile identifier.

Example:

{
  "type": "open-eform",
  "profile": "ebill"
}

Specialized software may validate that required fields are present.

---

## 4. eCase Format

The `.ecase` format represents a case or dossier containing multiple documents.

Unlike eForm, eCase acts as a **container for multiple resources**.

An eCase may include:

- multiple eForms
- supporting documents
- case metadata

Example structure:

case.ecase

├ manifest.json  
├ forms/  
│   application.eform  
│   tax.eform  
│
├ documents/  
│   passport.pdf  
│   contract.pdf  

The eCase container may also use ZIP packaging.

The manifest describes the contents of the case.

Example:

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

---

## 5. Compatibility

Derived formats must remain compatible with the base eForm specification.

Software that understands only eForm should still be able to extract and render individual forms contained in derived formats.

---

## 6. Future Extensions

Possible future derivatives include:

- application packages
- legal filing bundles
- invoice archives

The eForm specification intentionally keeps the base format minimal to allow such extensions.
