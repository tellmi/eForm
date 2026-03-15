# eForm Designer Guide

Version: 0.2

This guide explains how to create eForm layouts using standard vector design tools such as **Inkscape**.

The visual layout of an eForm is stored as **SVG**.

Form fields are defined using **field anchors** inside the SVG layout.

---

## 1. Page Setup

Create a document with real-world page dimensions.

Example for A4:

~~~text
width: 210 mm
height: 297 mm
~~~

Example SVG root element:

`<svg width="210mm" height="297mm">`

Using millimeters ensures predictable printing and consistent layout across systems.

Coordinates inside the SVG should use the same unit system (typically millimeters).

---

## 2. Designing the Form

Design the form visually using common SVG elements.

Recommended elements:

- text (labels)
- line
- rect
- path
- g

Example label:

`<text x="20" y="60">First name</text>`

These elements are sufficient to design most paper-style forms.

The layout should resemble a traditional printed form.

---

## 3. Creating a Field

Form fields are represented by rectangles defining the editable area.

Example:

`<rect x="70" y="65" width="100" height="10"/>`

This rectangle represents the area where the user will enter data.

The geometry defines the interactive region used by viewers.

---

## 4. Defining a Field Anchor

To connect a visual field to the form schema, add the attribute:

~~~text
data-eform-field
~~~

Example:

`<rect data-eform-field="firstname" x="70" y="65" width="100" height="10"/>`

The value must match a field name defined in `schema.json`.

This attribute creates the mapping between:

- the **visual layout**
- the **schema field definition**
- the **data.json value**

---

## 5. Example Layout

Example snippet:

~~~text
<text x="20" y="60">First name</text>
<rect data-eform-field="firstname" x="70" y="65" width="100" height="10"/>
~~~

When rendered by a viewer, the rectangle becomes an editable field.

---

## 6. Visual Styling

Field rectangles should remain visible so the form remains understandable even without a viewer.

Example style:

~~~css
.field {
  fill: none;
  stroke: black;
  stroke-width: 0.3;
}
~~~

This allows the document to remain readable and printable.

Designers may apply additional visual styling to improve usability.

---

## 7. Best Practices

Recommended layout rules:

- Use millimeter units
- Align labels and fields in columns
- Keep fields large enough for handwriting or text input
- Avoid overlapping elements
- Maintain consistent spacing between rows
- Ensure labels remain readable in printed form

Forms should resemble traditional paper documents to support intuitive use.

---

## 8. Result

The SVG layout defines:

- page design
- field positions
- printable form structure

A viewer detects all elements containing:

~~~text
data-eform-field
~~~

and attaches interactive editing behavior automatically.

This separation allows the same form to be:

- visually designed
- interactively filled
- machine processed
- printed like a traditional document
