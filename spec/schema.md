# eForm Schema Specification

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
    "f1": {
      "type": "string",
      "label": "First name",
      "maxLength": 40
    }
  }
}
~~~

Each field should correspond to a field anchor in the SVG layout.

Example anchor:

~~~text
&lt;rect data-eform-field="f1"/&gt;
~~~

The schema defines the **logical meaning** of fields, while the layout defines their **visual placement**.

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
| format | optional semantic format hint |

These properties provide **validation hints and semantic context** for form filling software.

They do not replace validation performed by receiving systems.

Unknown properties should be ignored by implementations to allow forward compatibility.

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

Implementations may support additional types, but unsupported types should fall back to basic text input.

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

## 6. Format Hints

Format hints provide additional semantic information about the expected content of a field.

Example:

~~~json
{
  "email": {
    "type": "string",
    "format": "email"
  }
}
~~~

Format hints may help viewers provide improved input widgets, formatting, or validation.

Examples of possible formats:

~~~text
email
phone
postalCode
iban
url
countryCode
dateISO
~~~

Format hints are **optional** and should be treated as guidance for user interfaces.

Implementations must not rely on format hints for strict validation.

Receiving systems remain responsible for final validation.

Unknown format values should be ignored.

---

## 7. Semantic References

Fields may reference external standards using registries.

Example:

~~~json
{
  "country": {
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

## 8. Field Identifiers

The key of each field entry represents the **field identifier**.

Example:

~~~json
{
  "fields": {
    "f1": {
      "type": "string"
    }
  }
}
~~~

Field identifiers must be **unique within the document**.

Identifiers may contain the following characters:

- a–z
- A–Z
- 0–9
- .
- _

Dot notation may be used to represent hierarchical structures.

Example:

~~~text
person.name
person.address.street
~~~

Field identifiers should remain **stable across form revisions** to ensure compatibility with previously stored data.

These identifiers are used consistently across the document:

- in the schema
- in the SVG layout
- in `data.json`
- in optional formulas

---

## 9. Data Mapping

Field values are stored in `data.json`.

Example:

~~~json
{
  "f1": "Anna",
  "f2": "Müller"
}
~~~

Each key corresponds to a field identifier defined in the schema.

Viewers use this mapping to populate field anchors in the layout.

---

## 10. Field Anchor Mapping

Each schema field should correspond to a field anchor in the SVG layout.

The mapping is defined using the attribute:

~~~text
data-eform-field
~~~

Example:

Schema field:

~~~text
f1
~~~

SVG anchor:

~~~text
&lt;rect data-eform-field="f1"/&gt;
~~~

Viewers use this mapping to connect schema semantics with layout geometry.

---

## 11. Layout Metadata Interaction

Layout elements may include optional metadata attributes.

Example:

~~~text
&lt;rect
  data-eform-field="person.name"
  data-eform-type="string"
  data-eform-required="true"
/&gt;
~~~

These attributes allow simple viewers to interpret fields without fully processing the schema.

If both layout metadata and `schema.json` define properties for a field, **the schema definition takes precedence**.

Layout metadata should therefore be treated as **optional hints**.

---

## 12. Computed Fields (Optional)

Fields may be computed using optional formulas defined in:

~~~text
formulas/formulas.json
~~~

Example formula:

~~~text
f3 = f1 - f2
~~~

Computed fields represent **derived values** based on other fields.

Viewers may automatically calculate these values and update them when source fields change.

Computed fields are typically treated as **read-only** in user interfaces.

Formulas assist form filling but do not replace validation performed by receiving systems.
