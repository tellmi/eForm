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
  tableBody.innerHTML = "";

  try {
    const text = await file.text();

    let zipBuffer = extractZipFromText(text);

    if (!zipBuffer) {
      // fallback for old format
      zipBuffer = await file.arrayBuffer();
    }

    const zip = await JSZip.loadAsync(zipBuffer);

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

function extractZipFromText(text) {
  const marker = "<!-- eform-container";

  const start = text.indexOf(marker);
  if (start < 0) return null;

  const end = text.indexOf("-->", start);
  if (end < 0) return null;

  const base64 = text
    .slice(start + marker.length, end)
    .trim();

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}


