#!/bin/bash

set -e

echo "eForm packer"
echo

# Go to project root
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

# Add mimetype first (uncompressed)
zip -X -q -0 "../$TMP_ZIP" mimetype

# Add remaining files (deterministic order)
find . -type f ! -name "mimetype" | sort | zip -X -q "../$TMP_ZIP" -@

cd ..

echo "Encoding ZIP to Base64..."

BASE64_ZIP=$(base64 -w 0 "$TMP_ZIP")

echo "Combining preview.svg + embedded container..."

(
  # ensure UTF-8 header exists
  if ! head -n 1 preview.svg | grep -q "<?xml"; then
    echo '<?xml version="1.0" encoding="UTF-8"?>'
  fi

  cat preview.svg
  echo
  echo "<!-- eform-container"
  echo "$BASE64_ZIP"
  echo "-->"
) > "$OUTPUT"

rm "$TMP_ZIP"

echo
echo "Created:"
echo "$FORM_DIR/$OUTPUT"