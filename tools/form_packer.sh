#!/bin/bash

set -e

echo "eForm packer"
echo

cd "$(dirname "$0")/.."

EXAMPLES_DIR="examples"

echo "Available forms:"
ls -1 "$EXAMPLES_DIR"
echo

read -p "Enter form name: " FORM

FORM_DIR="$EXAMPLES_DIR/$FORM"

if [ ! -d "$FORM_DIR" ]; then
  echo "Form not found."
  exit 1
fi

cd "$FORM_DIR"

if [ ! -f "preview.svg" ]; then
  echo "preview.svg missing."
  exit 1
fi

if [ ! -d "extracted" ]; then
  echo "extracted/ directory missing."
  exit 1
fi

TMP_ZIP="container.zip"
OUTPUT="$FORM.eform"

echo
echo "Packing $FORM..."

cd extracted

rm -f "../$TMP_ZIP"

# mimetype first (no compression)
zip -X -q -0 "../$TMP_ZIP" mimetype

# rest (deterministic)
find . -type f ! -name "mimetype" | sort | zip -X -q "../$TMP_ZIP" -@

cd ..

echo "Encoding ZIP to Base64..."

BASE64_ZIP=$(base64 "$TMP_ZIP" | tr -d '\n')

echo "Combining preview.svg + embedded container..."

MARKER="<!-- eform-container"

(
  # Ensure XML header
  if ! head -n 1 preview.svg | grep -q "<?xml"; then
    echo '<?xml version="1.0" encoding="UTF-8"?>'
  fi

  cat preview.svg
  echo ""
  echo "$MARKER"
  echo "$BASE64_ZIP"
  echo "-->"
  echo ""
) > "$OUTPUT"

rm "$TMP_ZIP"

echo
echo "Created:"
echo "$FORM_DIR/$OUTPUT"