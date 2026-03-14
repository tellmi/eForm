# eForm Container Format

Version: 0.1

---

## 1. Container

An `.eform` file is a ZIP archive.

File extension:

.eform

---

## 2. MIME Type

The container should include a `mimetype` file as the first entry in the archive.

Content:

application/eform+zip

The mimetype file must not be compressed.

This allows quick identification of the file type.

---

## 3. Required Files

An eForm container must include:

| File | Purpose |
|----|----|
| manifest.json | container metadata |
| schema.json | field definitions |
| layout/\*.svg | form layout |

Optional files:

| File | Purpose |
|----|----|
| data.json | field values |
| view/\*.svg | rendered filled form |
| registries/\* | reference registries |
| fonts/\* | embedded fonts |

---

## 4. Example Structure

example.eform
│
├ mimetype
├ manifest.json
├ schema.json
├ data.json
│
├ layout/
│   page1.svg
│
├ view/
│   page1-filled.svg
│
├ registries/
│   standards.json
│
└ fonts/

---

## 5. Manifest

The manifest describes the internal structure of the form.

Example:

{
  "type": "open-eform",
  "version": "0.2",
  "layout": ["layout/page1.svg"],
  "schema": "schema.json",
  "data": "data.json"
}

---

## 6. Layout Directory

The layout directory contains SVG pages.

Example:

layout/
page1.svg  
page2.svg

Page order is defined in the manifest.

---

## 7. Registries

Registries contain reusable references such as standards or code lists.

Example:

registries/
standards.json

---

## 8. Forward Compatibility

Unknown files or directories must be ignored by viewers.

This allows the format to evolve without breaking compatibility.
