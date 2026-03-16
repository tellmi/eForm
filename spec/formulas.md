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

If a formula references a field that does not exist, implementations should:

- ignore the formula
- leave the target field unchanged
- optionally log a warning

Division by zero should result in an undefined value.

Implementations may leave the target field empty or unchanged.

Formulas must never cause viewer crashes.

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


