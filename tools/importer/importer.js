const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const tableBody = document.querySelector("#resultTable tbody");

// --- Initialize table with placeholder ---
showPlaceholder();

// --- Drag & Drop ---

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// --- File Picker ---

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// --- Core Logic ---

async function handleFile(file) {
  // Clear table immediately (no placeholder flicker)
  tableBody.innerHTML = "";

  try {
    const arrayBuffer = await file.arrayBuffer();

    // JSZip finds ZIP even if appended after SVG
    const zip = await JSZip.loadAsync(arrayBuffer);

    const manifest = await readJSON(zip, "manifest.json");
    const data = await readJSON(zip, manifest.data || "data.json");
    const schema = await readJSON(zip, manifest.schema || "schema.json");

    renderTable(data, schema);

  } catch (err) {
    console.error(err);
    alert("Failed to read eForm file.");
    showPlaceholder();
  }
}

// --- Helpers ---

async function readJSON(zip, path) {
  const file = zip.file(path);
  if (!file) return {};
  const text = await file.async("string");
  return JSON.parse(text);
}

function renderTable(data, schema) {
  const fields = (schema && schema.fields) || {};

  // Ensure table is clean
  tableBody.innerHTML = "";

  // Structured rendering (preferred)
  if (Object.keys(fields).length > 0) {
    Object.entries(fields).forEach(([key, fieldDef]) => {
      const value = data[key] ?? "";
      const semantic = fieldDef.semantic || "";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHTML(key)}</td>
        <td>${escapeHTML(String(value))}</td>
        <td>${escapeHTML(semantic)}</td>
      `;

      tableBody.appendChild(row);
    });
  } else {
    // Fallback: no schema available
    Object.entries(data).forEach(([key, value]) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHTML(key)}</td>
        <td>${escapeHTML(String(value))}</td>
        <td></td>
      `;

      tableBody.appendChild(row);
    });
  }

  // If still empty → show placeholder
  if (tableBody.children.length === 0) {
    showPlaceholder();
  }
}

function showPlaceholder() {
  tableBody.innerHTML = `
    <tr>
      <td colspan="3" style="text-align:center;color:#888;">
        No data loaded
      </td>
    </tr>
  `;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
