# eForm Schema Specification

Version: 0.2

---

## 1. Purpose

The schema defines the logical structure of the form.

It describes:

- field types
- validation hints
- semantic references

The schema does **not define layout geometry**.

Field positions are defined in the SVG layout using field anchors.

---

## 2. Field Structure

Example field definition:

```json
{
  "fields": {
    "firstname": {
      "type": "string",
      "label": "First name",
      "maxLength": 40
    }
  }
}
```

Each field must correspond to a field anchor in the SVG layout.

Example anchor:

```
&lt;rect data-eform-field="firstname"/&gt;
```

---

## 3. Field Properties

| Property | Description |
|--------|-------------|
| type | field data type |
| label | human-readable field label |
| maxLength | maximum character count |
| required | indicates a mandatory field |
| pattern | optional validation pattern |
| codeList | reference to a standard value list |

---

## 4. Field Types

Supported field types:

```
string
number
date
boolean
selection
```

Viewers may render different UI widgets depending on the field type.

---

## 5. Validation Hints

Validation hints guide the form filling software but do not replace server-side validation.

Examples:

```
maxLength
pattern
required
```

---

## 6. Semantic References

Fields may reference external standards using registries.

Example:

```json
{
  "birthcountry": {
    "type": "selection",
    "codeList": "std_iso3166"
  }
}
```

The referenced registry must be defined in:

```
registries/standards.json
```

---

## 7. Field Identifier

The key of each field entry represents the **field identifier**.

Example:

```json
{
  "fields": {
    "firstname": {
      "type": "string"
    }
  }
}
```

This identifier is used consistently across the document:

- in the schema
- in the SVG layout
- in `data.json`

---

## 8. Field Anchor Mapping

Each schema field must correspond to a field anchor in the SVG layout.

The mapping is defined using the attribute:

```
data-eform-field
```

Example:

Schema field:

```
firstname
```

SVG anchor:

```
&lt;rect data-eform-field="firstname"/&gt;
```

Viewers use this mapping to connect schema semantics with layout geometry.
