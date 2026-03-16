# eForm Layout Specification

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

~~~text
layout/page1.svg
layout/page2.svg
~~~

Each SVG file should represent one printable page.

Page order is defined in `manifest.json`.

The order of entries in the `layout` array defines the page order.

---

## 3. Coordinate System

Layouts must use a consistent coordinate system to ensure predictable rendering.

The root SVG element must define a `viewBox`.

Example:

~~~text
&lt;svg viewBox="0 0 210 297"&gt;
~~~

This example corresponds to an A4 page using millimeter-like user units.

The following rules apply:

- The origin `(0,0)` is located at the **top-left corner** of the page.
- Coordinates increase to the **right (x-axis)**.
- Coordinates increase **downward (y-axis)**.

Implementations should interpret **one user unit as one millimeter** unless otherwise specified.

Layouts must not rely on transforms or CSS rules that modify the coordinate system.

---

## 4. Physical Page Size (Future Work)

For accurate printing it may be desirable to define physical page dimensions using real-world units.

Example:

~~~text
&lt;svg width="210mm" height="297mm" viewBox="0 0 210 297"&gt;
~~~

However, the use of physical units such as `mm` currently causes inconsistent rendering behavior in HTML environments.

Because of this, the current specification **does not require physical page size attributes**.

Future viewer implementations may introduce improved printing support that makes use of physical page units.

---

## 5. Allowed SVG Elements

To ensure predictable rendering across viewers, layouts should use a restricted subset of SVG.

Recommended elements include:

- rect
- line
- path
- circle
- ellipse
- text
- g

These elements are sufficient to describe most form layouts.

Viewers should ignore unsupported elements that do not affect layout geometry.

---

## 6. Forbidden SVG Features

The following SVG features must not be used:

- script
- foreignObject
- external resources
- animations
- filters

These features introduce security risks or unpredictable behavior.

Layout SVG documents must be fully self-contained.

---

## 7. Field Anchors

Form fields are defined directly inside the SVG layout.

A field anchor is any SVG element containing the attribute:

~~~text
data-eform-field
~~~

Example:

~~~text
&lt;rect data-eform-field="f1" x="70" y="65" width="100" height="10"/&gt;
~~~

The value must match a field identifier defined in `schema.json`.

The attribute namespace

~~~text
data-eform-*
~~~

is reserved for the eForm specification.

---

## 8. Field Geometry

The geometry of a field is defined by the SVG element that acts as the anchor.

Examples include:

- rect
- circle
- ellipse
- path
- text

Implementations should determine the interactive region of the field using the **bounding box of the anchor element**.

The bounding box defines the editable region used by viewers.

Coordinates should typically correspond to **millimeter-like user units** to match printable page dimensions.

---

## 9. Embedded Field Metadata

Field anchors may include optional metadata attributes.

Example:

~~~text
&lt;rect
  data-eform-field="person.name"
  data-eform-type="string"
  data-eform-required="true"
  x="70"
  y="65"
  width="100"
  height="10"
/&gt;
~~~

These attributes allow layouts to contain minimal self-describing information.

Typical attributes may include:

- `data-eform-type`
- `data-eform-required`
- `data-eform-readonly`
- `data-eform-multiline="true"

These attributes are **optional**.

If both layout metadata and `schema.json` define properties for a field, **the schema definition takes precedence**.

---

## 10. Visual Field Indicators

Field anchors may serve as visible placeholders.

Example:

~~~text
&lt;rect class="field" data-eform-field="f1" x="70" y="65" width="100" height="10"/&gt;
~~~

This ensures the form remains understandable even without a viewer.

Designers may style these elements using CSS classes inside the SVG document.

Visual styling must not affect field geometry.

Boolean fields may be represented as checkboxes.

Radio selections may be represented using multiple anchors with the
same field identifier and a data-eform-value attribute.

---

## 11. Fonts

Fonts may optionally be embedded in the container.

Example directory:

~~~text
fonts/
~~~

Embedding fonts improves rendering consistency across systems.

If fonts are not embedded, viewers should fall back to system fonts.

Layouts should remain readable even when fonts are substituted.

---

## 12. Layout vs Preview

Layout SVG files define the **editable form structure**.

They may contain:

- field anchors
- visual placeholders
- layout elements

The preview SVG represents the **rendered filled form**.

The preview must:

- contain the filled values
- contain no field anchors
- contain no scripts

The preview is a static representation used when no eForm viewer is available.

---

## 13. Static Readability

Even without specialized software, the layout SVG must remain readable and printable as a normal document.

Designers should ensure that:

- labels remain visible
- field areas remain understandable
- the document structure resembles a traditional paper form
