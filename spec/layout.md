# eForm Layout Specification

Version: 0.2

---

## 1. Purpose

The layout defines the **editable visual structure** of an eForm.

Layouts use **SVG**.

The layout is the authoritative source for:

- page geometry
- field positioning
- printable form structure

Layout SVG files may contain **field anchors** which define interactive form fields.

---

## 2. Page Model

Each page of a form is represented by one SVG file.

Example:

layout/page1.svg  
layout/page2.svg

Each SVG file should represent one printable page.

Page order is defined in `manifest.json`.

---

## 3. Page Size

Pages should define real-world dimensions.

Example:

```
&lt;svg width="210mm" height="297mm"&gt;
```

Using physical units ensures predictable printing.

---

## 4. Allowed SVG Elements

To ensure predictable rendering across viewers, layouts should use a restricted subset of SVG.

Recommended elements:

- rect
- line
- path
- text
- g

These elements are sufficient to describe most form layouts.

---

## 5. Forbidden SVG Features

The following SVG features must not be used:

- script
- foreignObject
- external resources
- animations
- filters

These features introduce security risks or unpredictable behavior.

---

## 6. Field Anchors

Form fields are defined directly inside the SVG layout.

A field anchor is an SVG element containing the attribute:

```
data-eform-field
```

Example:

```
&lt;rect data-eform-field="firstname" x="70" y="65" width="100" height="10"/&gt;
```

The value must match a field defined in `schema.json`.

---

## 7. Field Geometry

Field geometry is defined by the SVG element attributes.

For rectangular fields:

- x
- y
- width
- height

Units should use millimeters.

---

## 8. Visual Field Indicators

Field anchors may serve as visible placeholders.

Example:

```
&lt;rect class="field" data-eform-field="firstname" x="70" y="65" width="100" height="10"/&gt;
```

This ensures the form remains understandable even without a viewer.

---

## 9. Fonts

Fonts may be embedded in the container.

Example directory:

```
fonts/
```

Embedding fonts ensures consistent rendering across systems.

---

## 10. Layout vs Preview

Layout SVG files define the **editable form structure**.

They may contain:

- field anchors
- visual placeholders
- layout elements

The preview SVG represents the **rendered filled form** and must **not contain field anchors**.

---

## 11. Static Readability

Even without specialized software, the layout SVG must remain readable and printable as a normal document.
