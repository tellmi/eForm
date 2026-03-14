# eForm Designer Guide

This guide explains how to create eForm layouts using standard vector design tools such as **Inkscape**.

The visual layout of an eForm is stored as **SVG**.

Form fields are defined using **field anchors** inside the SVG layout.

---

# 1. Page Setup

Create a document with real-world page dimensions.

Example for A4:

width: 210 mm  
height: 297 mm

Example SVG root element:

<svg width="210mm" height="297mm">

Using millimeters ensures predictable printing and consistent layout across systems.

---

# 2. Designing the Form

Design the form visually using common SVG elements.

Recommended elements:

- text (labels)
- line
- rect
- path
- g

Example label:

<text x="20" y="60">First name</text>

These elements are sufficient to design most paper-style forms.

---

# 3. Creating a Field

Form fields are represented by rectangles defining the editable area.

Example:

<rect x="70" y="65" width="100" height="10"/>

This rectangle represents the area where the user will enter data.

---

# 4. Defining a Field Anchor

To connect a visual field to the form schema, add the attribute:

data-eform-field

Example:

<rect  
  data-eform-field="firstname"  
  x="70"  
  y="65"  
  width="100"  
  height="10"/>

The value must match a field name defined in `schema.json`.

---

# 5. Example Layout

Example snippet:

<text x="20" y="60">First name</text>  
<rect data-eform-field="firstname" x="70" y="65" width="100" height="10"/>

---

# 6. Visual Styling

Field rectangles should remain visible so the form remains understandable even without a viewer.

Example style:

.field {
  fill: none;
  stroke: black;
  stroke-width: 0.3;
}

This allows the document to remain readable and printable.

---

# 7. Best Practices

Recommended layout rules:

- Use millimeter units
- Align labels and fields in columns
- Keep fields large enough for handwriting or text input
- Avoid overlapping elements
- Keep consistent spacing between rows

---

# 8. Result

The SVG layout defines:

- page design
- field positions
- printable form structure

A viewer detects all elements containing:

data-eform-field

and attaches interactive editing behavior automatically.
