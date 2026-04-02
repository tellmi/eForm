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

~~~text
[A-Za-z0-9_.-]+
~~~

Example identifiers:

~~~text
f1
f2
income
tax_rate
invoice.total
~~~

Field identifiers must not contain spaces.

The colon character `:` is reserved for **range expressions** and must not appear in identifiers.

The key of each formula entry must be a valid field identifier defined in the schema.

Formulas do not create new fields.
They only define computed values for existing fields.

A formula must not directly reference its own target field.

Example (invalid):

f1 = f1 + 1

If a referenced field has no value:

- implementations may treat it as undefined
- the result of the formula should be considered undefined

Implementations may:
- leave the target field empty
- or skip evaluation

Implementations must not crash.

Formulas must be side-effect free.

They must not modify any field other than their target field.

Example behaviour:

{
  "input": { "f1": 10, "f2": 5 },
  "formula": "f3 = f1 - f2",
  "expected": { "f3": 5 }
}

---

# 2. Numeric Representation

Numbers must follow **JSON number syntax**.

Example:

~~~text
10
10.5
-3.25
0.75
~~~

Implementations must interpret numeric values as:

**IEEE 754 double precision floating point numbers**

Form filling software must be aware of floating point rounding behavior when performing calculations.

---

# 3. Formula Location

Formulas are defined in:

~~~text
formulas/formulas.json
~~~

Example structure:

~~~json
{
  "formulas": {
    "f7": "f5 - f6"
  }
}
~~~

This example computes:

~~~text
profit = income - expenses
~~~

The key defines the **target field** whose value is computed.

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

The following arithmetic operators must be supported:

~~~text
+
-
*
/
~~~

Parentheses may be used for grouping.

Example:

~~~text
(f5 - f6) * 0.2
~~~

---

# 6. Operator Precedence

Operators must follow this precedence order:

1. Parentheses `( )`
2. Multiplication `*` and division `/`
3. Addition `+` and subtraction `-`

Operators with the same precedence are evaluated left to right.

---

# 7. Formula Evaluation Order

Formulas should be evaluated according to their **field dependencies**.

If a formula references other fields, those fields must be evaluated first.

Implementations should determine an evaluation order that respects these dependencies.

Example:

~~~text
f2 = f1 * 0.2
f3 = f1 + f2
~~~

Evaluation order:

~~~text
f1 → f2 → f3
~~~

If multiple formulas are independent, implementations may evaluate them in any order.

Implementations may use the order defined in `formulas.json` as an **evaluation hint**, but must not rely on it for correctness.

---

# 8. Range Expressions

Ranges may be expressed using a colon.

Example:

~~~text
f1:f3
~~~

This represents the fields:

~~~text
f1, f2, f3
~~~

Range expressions may be used inside functions and should reference fields in ascending order.
If a range is specified with descending identifiers (e.g. f3:f1), implementations may ignore the range or treat it as invalid.

---

# 9. Functions

Functions accept comma-separated arguments.

Example:

~~~text
sum(f1, f2, f3)
sum(f1:f3)
~~~

Supported functions:

~~~text
sum(...)
round(value, digits)
~~~

Example:

~~~text
round(sum(f1:f3), 2)
~~~

Formulas are intentionally limited to simple arithmetic expressions.

They are not intended to represent business logic, validation rules, or decision-making processes.

This ensures:
- security
- transparency
- long-term compatibility

---

# 10. Currency Rounding

Financial values frequently require rounding to a fixed number of decimal places.

Example:

~~~text
round(f5 - f6, 2)
~~~

This ensures results match currency precision.

Form designers should explicitly apply rounding where required.

---

# 11. Financial Calculation Recommendation

When rounding is involved, intermediate values may differ depending on the order of calculation.

Example problem:

~~~text
gross = net * (1 + tax_rate)
tax = net * tax_rate
~~~

Due to rounding, the result may not equal:

~~~text
gross = net + tax
~~~

To avoid inconsistencies, form designers should prefer:

~~~text
gross = net + tax
~~~

In other words:

- compute intermediate values separately
- derive totals from those values

---

# 12. Splitting Complex Calculations

Complex calculations should be broken into smaller steps.

Example (recommended):

~~~text
tax = round(net * tax_rate, 2)
gross = net + tax
~~~

Instead of:

~~~text
gross = round(net * (1 + tax_rate), 2)
~~~

Splitting calculations improves:

- transparency
- rounding consistency
- cross-system compatibility

---

# 13. Error Handling

## Missing Value Handling

If a formula references fields with missing values, implementations should:

- evaluate the expression as far as possible
- compute a result if it can be determined unambiguously
- otherwise treat the result as undefined

---

## Numeric Interpretation

For arithmetic operations:

- missing numeric values may be treated as `0` if doing so allows a meaningful and unambiguous result
- implementations must not produce results that could be misleading to users

---

## Division

Division requires all operands to be defined.

- If an operand of a division is missing, the result must be treated as undefined
- Division by zero must result in an undefined value

---

## Result Handling

If a formula result is undefined, implementations may:

- leave the target field empty
- or leave the previous value unchanged

---

## Stability

Formulas must never cause viewer crashes or undefined behavior.

---

# 14. Dependency Cycles

If formulas create a dependency cycle, implementations should ignore the formulas involved in the cycle.

Example cycle:

~~~text
f1 = f2 + 1
f2 = f1 + 1
~~~

Implementations may report a warning but must not enter infinite evaluation loops.

---

# 15. Forward Compatibility

Implementations must ignore unknown functions or operations.

This allows the formula system to evolve while maintaining compatibility.

Unknown formulas may be skipped while the rest of the document remains usable.

# 16. Formula Grammar

Formulas follow a simple expression grammar.

The following EBNF-style grammar defines the allowed syntax.

~~~text
expression      = term { ("+" | "-") term } ;

term            = factor { ("*" | "/") factor } ;

factor          = number
                | identifier
                | function_call
                | "(" expression ")" ;

function_call   = identifier "(" argument_list ")" ;

argument_list   = expression
                | expression { "," expression }
                | range ;

range           = identifier ":" identifier ;

identifier      = letter { letter | digit | "_" | "." | "-" } ;

number          = ["-"] digit { digit } [ "." digit { digit } ] ;

letter          = "A"…"Z" | "a"…"z" ;
digit           = "0"…"9" ;
~~~

Examples of valid expressions:

~~~text
f1 + f2
f5 - f6
(f5 - f6) * 0.2
sum(f1:f3)
round(sum(f1:f3), 2)
~~~

Implementations should parse formulas according to this grammar.

Whitespace between tokens may be ignored.

