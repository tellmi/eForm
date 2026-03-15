# eForm Schema Specification

Version: 0.3

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

~~~json
{
  "fields": {
    "firstname": {
      "type": "string",
      "label": "First name",
      "maxLength": 40
    }
  }
}
~~~

Each field must correspond to a field anchor in the SVG layout.

Example anchor:

`<rect data-eform-field="firstname"/>`

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

These properties provide **validation hints and semantic context** for form filling software.

They do not replace validation performed by receiving systems.

---

## 4. Field Types

Supported field types:

~~~text
string
number
date
boolean
selection
~~~

Viewers may render different UI widgets depending on the field type.

Examples:

- `string` → text input  
- `number` → numeric input  
- `date` → date input or formatted text field  
- `boolean` → checkbox  
- `selection` → dropdown or list selection  

---

## 5. Validation Hints

Validation hints guide form filling software but do not enforce strict validation rules.

Examples:

~~~text
maxLength
pattern
required
~~~

Receiving systems remain responsible for final validation of submitted data.

---

## 6. Semantic References

Fields may reference external standards using registries.

Example:

~~~json
{
  "birthcountry": {
    "type": "selection",
    "codeList": "std_iso3166"
  }
}
~~~

The referenced registry must be defined in:

~~~text
registries/standards.json
~~~

Registries provide references to standardized code lists or classification systems.

The actual code list values may be provided by external systems or form filling software.

---

## 7. Field Identifier

The key of each field entry represents the **field identifier**.

Example:

~~~json
{
  "fields": {
    "firstname": {
      "type": "string"
    }
  }
}
~~~

This identifier is used consistently across the document:

- in the schema
- in the SVG layout
- in `data.json`

Field identifiers should remain **stable across form revisions** to ensure compatibility with previously stored data.

---

## 8. Data Mapping

Field values are stored in `data.json`.

Example:

~~~json
{
  "firstname": "Anna",
  "lastname": "Müller"
}
~~~

Each key corresponds to a field identifier defined in the schema.

Viewers use this mapping to populate field anchors in the layout.

---

## 9. Field Anchor Mapping

Each schema field must correspond to a field anchor in the SVG layout.

The mapping is defined using the attribute:

~~~text
data-eform-field
~~~

Example:

Schema field:

~~~text
firstname
~~~

SVG anchor:

`<rect data-eform-field="firstname"/>`

Viewers use this mapping to connect schema semantics with layout geometry.
