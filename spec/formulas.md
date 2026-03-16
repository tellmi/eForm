# eForm Formula Specification

This document defines how formulas may be used in eForm documents.

Formulas allow form filling software to automatically compute values based on other fields.  
They help reduce user input errors and simplify form completion.

Formulas are optional and serve as **assistance for form filling software**.  
They do **not replace validation performed by receiving systems**.

---

# 1. Field Identifier Principle

Each form field is identified by a **unique field identifier**.

Field identifiers:

- must be unique within a form
- must remain stable across form revisions
- are used consistently across:
  - schema definitions
  - SVG layout anchors
  - data.json
  - formulas

Allowed identifier pattern:

[A-Za-z0-9_.-]+


Example identifiers:

f1
f2
income
tax_rate
invoice.total


Field identifiers must not contain spaces.

---

# 2. Numeric Representation

Numbers must follow **JSON number syntax**.

Example:

10
10.5
-3.25
0.75


Implementations must interpret numeric values as:

IEEE 754 double precision floating point numbers


Form filling software must be aware of floating point rounding behavior when performing calculations.

---

# 3. Formula Location

Formulas are defined in:

formulas/formulas.json


Example structure:

{
"formulas": {
"f7": "f5 - f6"
}
}


This example computes:

profit = income - expenses


---

# 4. Field Value Precedence

Computed values must always take precedence over stored values.

This means:

1. If a field has a formula, its value must be recomputed.
2. Stored values in `data.json` may exist but must not override the computed result.

Stored values are allowed because:

- they allow quick preview rendering
- they provide compatibility with simple viewers
- they allow quick validation of expected results

Importing systems may ignore stored values and recompute all formulas.

---

# 5. Supported Operations

The following operations must be supported by implementations.

Arithmetic operators:

/


Parentheses may be used for grouping.

Example:

f7 = (f5 - f6) * 0.2


---

# 6. Range Expressions

Ranges may be expressed using a colon.

Example:

f1:f3


This represents the fields:

f1, f2, f3


Range expressions may be used inside functions.

---

# 7. Functions

Functions accept comma-separated arguments.

Example:

sum(f1, f2, f3)
sum(f1:f3)


Supported functions:

sum(...)
round(value, digits)


Example:

round(sum(f1:f3), 2)


---

# 8. Currency Rounding

Financial values frequently require rounding to a fixed number of decimal places.

Example:

round(f5 - f6, 2)


This ensures results match currency precision.

Form designers should explicitly apply rounding where required.

---

# 9. Financial Calculation Recommendation

When rounding is involved, intermediate values may differ depending on the order of calculation.

Example problem:

gross = net * (1 + tax_rate)
tax = net * tax_rate


Due to rounding, the result may not equal:

gross = net + tax


To avoid inconsistencies, form designers should prefer:

gross = net + tax


In other words:

- compute intermediate values separately
- derive totals from those values

---

# 10. Splitting Complex Calculations

Complex calculations should be broken into smaller steps.

Example (recommended):

tax = round(net * tax_rate, 2)
gross = net + tax


Instead of:

gross = round(net * (1 + tax_rate), 2)


Splitting calculations improves:

- transparency
- rounding consistency
- cross-system compatibility

---

# 11. Error Handling

If a formula references a field that does not exist, implementations should:

- ignore the formula
- leave the target field unchanged
- optionally log a warning

Formulas must never cause viewer crashes.

---

# 12. Forward Compatibility

Implementations must ignore unknown functions or operations.

This allows the formula system to evolve while maintaining compatibility.

Unknown formulas may be skipped while the rest of the document remains usable.

---
