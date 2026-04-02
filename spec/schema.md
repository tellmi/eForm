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

The number type may represent either free numeric input or a discrete numeric scale (e.g. slider), depending on UI hints.

Viewers may render different UI widgets depending on the field type.

Examples:

- `string` → text input  
- `number` → numeric input  
- `date` → date input or formatted text field  
- `boolean` → checkbox  
- `selection` → dropdown or list selection  

Implementations may support additional types, but unsupported types should fall back to basic text input.

## 4.1 UI Hints

Fields may include optional UI hints to guide rendering.

Example:

```json
{
  "f22": {
    "type": "number",
    "min": 0,
    "max": 10,
    "step": 1,
    "ui": {
      "widget": "slider"
    }
  }
}
```
step — defines the step size between consecutive valid values (step size)

### Supported UI widgets (examples)

```text
text
textarea
checkbox
radio
dropdown
slider
```

UI hints:

- are **optional**  
- affect only presentation  
- must not affect stored data  
- may be ignored by implementations  

If no UI hint is provided, viewers should choose a default representation based on the field type.

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

```json
{
  "email": {
    "type": "string",
    "format": "email"
  }
}
```

Format hints may help viewers provide improved input widgets, formatting, or validation.

Examples of possible formats:

```text
email
phone
postalCode
iban
url
countryCode
dateISO
currency
```

### 6.1 Simple Formats

Simple format values (e.g. `"email"`, `"phone"`) are treated as general UI hints.

Implementations may use them to:

* select appropriate input widgets
* apply formatting
* assist user input

---

### 6.2 Registry-Based Formats

Format values may reference standardized definitions provided via registries.

If a format value matches an entry in:

```
registries/standards.json
```

implementations may use the referenced definition to apply advanced formatting rules.

Example:

```json
{
  "amount": {
    "type": "number",
    "format": "std_currency"
  }
}
```

Registry definitions may include:

* formatting rules
* localization behavior
* dependencies on other fields (e.g. currency selection)

---

### 6.3 Behavior

Format hints are **optional** and should be treated as guidance for user interfaces.

Implementations must:

* treat format hints as non-binding
* not rely on them for strict validation
* ignore unknown format values safely

Receiving systems remain responsible for final validation of submitted data.

Format hints must not alter the stored data values.

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
