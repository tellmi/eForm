# eForm Layout Specification

Version: 0.1

---

## 1. Purpose

The layout defines the visual appearance of the form.

Layouts use **SVG**.

The layout is the authoritative source for page geometry and field positioning.

---

## 2. Page Model

Each page of a form is represented by one SVG file.

Example:

layout/page1.svg  
layout/page2.svg

Each page should represent a printable page.

---

## 3. Page Size

Pages should define real-world dimensions.

Example:

<svg width="210mm" height="297mm">

Using physical units ensures predictable printing.

---

## 4. Allowed SVG Elements

To ensure predictable rendering, layouts should use a restricted subset of SVG.

Recommended elements:

- rect
- line
- path
- text
- g

These elements are sufficient for most form layouts.

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

A field anchor is an SVG element containing:

data-eform-field

Example:

<rect data-eform-field="firstname" x="70" y="65" width="100" height="10"/>

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

<rect class="field" data-eform-field="firstname" x="70" y="65" width="100" height="10"/>

This ensures the form remains understandable without specialized software.

---

## 9. Fonts

Fonts may be embedded in the container.

Example directory:

fonts/

Embedding fonts ensures consistent rendering.

---

## 10. Static Rendering

Even without specialized software, the SVG layout must remain readable and printable.
