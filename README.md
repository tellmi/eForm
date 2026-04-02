# eForm

Version: 0.7.1

A document format for forms that are readable by humans and systems alike.
**eForm** is an open document format for electronic forms.

It combines:

* **SVG** (visual layout)
* **JSON** (data + schema)
* **ZIP container** (packaging)

➡️ Result: a form that is human-readable, machine-readable, and directly processable

No OCR. No manual data extraction.
Every submitted form is immediately usable as structured data.

---

## 🚀 What is eForm?

An eForm behaves like a **digital paper form**:

* looks like a document
* can be filled digitally
* can be processed automatically
* remains readable without special software

---

## 🧭 How it Works

```
Design (SVG)
   ↓
Add schema + data (JSON)
   ↓
Package (ZIP → embedded in SVG)
   ↓
Open in viewer OR browser
   ↓
Process / transmit / archive
```

---

## ✨ Key Features

* 📄 **Always readable** (SVG preview)
* 🧠 **Structured data** (JSON)
* 🔗 **System integration ready**
* 🔓 **Open standard (MPL 2.0)**
* 🧩 **Extensible via profiles (eCase, eBill)**
* ⚙️ **Built-in computation** (formulas for automated evaluation)

---

## 📦 File Structure

```
form.eform
├ preview.svg
└ embedded container (base64 ZIP)
   ├ manifest.json
   ├ schema.json
   ├ data.json
   ├ layout/
   └ formulas/
```

👉 The preview ensures the document is always viewable
👉 The container enables full processing

---

## 🧱 Core Concepts

| Component               | Purpose           |
| ----------------------- | ----------------- |
| **Layout (SVG)**        | visual structure  |
| **Schema (JSON)**       | field definitions |
| **Data (JSON)**         | field values      |
| **Preview (SVG)**       | static rendering  |
| **Formulas (optional)** | computed values   |

---

## 🔐 Design Goals

* Long-term readability
* Human-friendly form design
* Machine-readable data
* Open specification
* Independence from proprietary software

---

## 🧩 Profiles (Extensions)

eForm supports specialized formats:

* **eCase** → document bundles (forms + attachments)
* **eBill** → invoice envelope (XML-based standards like XRechnung / ZUGFeRD)

Profiles extend eForm without breaking compatibility.

---

## 🆕 What’s New (0.6.6)

### Format Improvements

* embedded container via **base64 in SVG**
* reliable preview generation

### Signature Support

* SVG signatures stored in `data.json`
* rendered in viewer and preview

### Viewer Stability

* improved editing behavior
* fixed navigation and layout issues

### Profiles Introduced

* eCase
* eBill

### Fixes

* importer updated for new container format

---

## What's New (0.7)

Version 0.7 suggests on **security and robustness** of the eForm format.

## What’s New (0.7.1)
### Core Value Clarification
* emphasized machine-readable output as primary design goal
* clarified elimination of OCR and post-processing
* improved positioning for automated workflows and computation use cases

### Security Improvements
* stricter SVG sanitization rules
* defined safe element whitelist
* improved handling of embedded SVG (e.g. signatures)
* stronger restrictions for formula evaluation
* guidance for secure viewer implementations
* recommendations for resource limits (DoS protection)

These changes prepare eForm for use in production environments handling untrusted documents.

### Manifest Clarification
* clarified required manifest properties (layout, schema, data)
* defined optional resource references:
    * formulas
    * registries
* defined behavior for unknown manifest properties (must be ignored)
* clarified that layout order defines page order

These clarifications improve interoperability and forward compatibility without changing the format structure.

### Comprehensive Example Form
introduced a comprehensive example form demonstrating all core features:
* field types (string, number, date, boolean, selection)
* multi-page layout
* registries (ISO examples)
* formulas and computed fields
* signature field (embedded SVG)
* questionnaire with scoring
serves as a reference implementation for form designers and implementers

---

## 📚 Specification

Detailed specifications are located in `/spec`:

* `eform-spec.md` — core format
* `layout-spec.md` — SVG rules
* `schema-spec.md` — schema
* `formula-spec.md` — formulas

Additional docs:

* `docs/form-design.md`
* `docs/import-processing.md`
* `docs/mapping-and-semantics.md`

---

## 🛠 Demo Tools

* `tools/viewer.html` → interactive form viewer
* `tools/importer.html` → data extraction

---

## 📁 Repository Structure

```
spec/       specifications  
examples/   sample forms  
viewer/     reference viewer  
tools/      utilities  
docs/       documentation  
```

---

## 📜 License

Licensed under **MPL 2.0**

* core modifications must remain open
* allows integration into proprietary systems

---

## ⚠️ Status

Experimental — under active development

Focus areas:

* stabilization
* interoperability
* real-world adoption
* profile definition

---

## 🌍 Vision

eForm combines:

* PDF-like visual stability
* web-style openness
* structured data

➡️ A durable, open format for digital forms across systems.

