const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const table = document.getElementById("resultTable");
const thead = table.querySelector("thead");
const tbody = table.querySelector("tbody");
const previewContent = document.getElementById("previewContent");

let importedForms = [];
let allFieldIds = new Set();
let selectedRow = null;

/* ---------------------------
   DRAG & DROP
--------------------------- */

dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
});

/* ---------------------------
   FILE PICKER
--------------------------- */

fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    await handleFiles(files);
});

/* ---------------------------
   CORE
--------------------------- */

async function handleFiles(files)
{
    importedForms = [];
    allFieldIds.clear();

    for (const file of files)
    {
        const form = await loadForm(file);
        if (!form) continue;

        importedForms.push(form);

        Object.keys(form.data).forEach(id => allFieldIds.add(id));
    }

    renderTable();
    clearPreview();
}

/* ---------------------------
   LOAD FORM
--------------------------- */

async function loadForm(file)
{
    try
    {
        const text = await file.text();

        let zipBuffer = extractZipFromText(text);
        if (!zipBuffer)
            zipBuffer = await file.arrayBuffer();

        const zip = await JSZip.loadAsync(zipBuffer);

        const manifest = await readJSON(zip, "manifest.json");
        const data = await readJSON(zip, manifest.data || "data.json");

        let previewSVG = "";

        const marker = "<!-- eform-container";
        const index = text.indexOf(marker);

        if (index > 0)
            previewSVG = text.slice(0, index).trim();

        if (!previewSVG && manifest.layout?.length)
        {
            const file = zip.file(manifest.layout[0]);
            if (file)
                previewSVG = await file.async("string");
        }

        return {
            name: file.name,
            data,
            previewSVG: sanitizeSVG(previewSVG)
        };
    }
    catch (e)
    {
        console.warn("Failed:", file.name, e);
        return null;
    }
}

async function readJSON(zip, path)
{
    const file = zip.file(path);
    if (!file) return {};
    return JSON.parse(await file.async("string"));
}

/* ---------------------------
   TABLE
--------------------------- */

function renderTable()
{
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const fields = Array.from(allFieldIds);

    const headerRow = document.createElement("tr");

    headerRow.appendChild(th("File"));
    fields.forEach(f => headerRow.appendChild(th(f)));

    thead.appendChild(headerRow);

    importedForms.forEach((form, index) =>
    {
        const row = document.createElement("tr");

        row.addEventListener("click", () =>
        {
            selectRow(row, form);
        });

        row.appendChild(td(form.name));

        fields.forEach(id =>
        {
            const value = form.data[id];
            const cell = document.createElement("td");

            if (typeof value === "object" && value?.type === "svg")
                cell.textContent = "[signature]";
            else
                cell.textContent = value ?? "";

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

/* ---------------------------
   SELECTION + PREVIEW
--------------------------- */

function selectRow(row, form)
{
    if (selectedRow)
        selectedRow.classList.remove("selected");

    selectedRow = row;
    row.classList.add("selected");

    showPreview(form.previewSVG);
}

function showPreview(svgText)
{
    if (!svgText)
    {
        previewContent.innerHTML =
            "<div style='color:#888'>No preview</div>";
        return;
    }

    previewContent.innerHTML = svgText;

    const svg = previewContent.querySelector("svg");
    if (!svg) return;

    svg.removeAttribute("width");
    svg.removeAttribute("height");

    svg.style.width = "100%";
    svg.style.height = "auto";
}

function clearPreview()
{
    previewContent.innerHTML =
        "<div style='color:#888;text-align:center;'>Select a row to preview</div>";
}

/* ---------------------------
   HELPERS
--------------------------- */

function th(text)
{
    const el = document.createElement("th");
    el.textContent = text;
    return el;
}

function td(text)
{
    const el = document.createElement("td");
    el.textContent = text;
    return el;
}

function sanitizeSVG(svg)
{
    return svg
        ?.replace(/^\uFEFF/, "")
        .replace(/<\?xml[\s\S]*?\?>/gi, "")
        .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
        .replace(/font-family:\s*sans\b/g, "sans-serif")
        .trim() || "";
}

/* ---------------------------
   ZIP EXTRACTION
--------------------------- */

function extractZipFromText(text)
{
    const marker = "<!-- eform-container";

    const start = text.indexOf(marker);
    if (start < 0) return null;

    const end = text.indexOf("-->", start);
    if (end < 0) return null;

    const base64 = text
        .slice(start + marker.length, end)
        .replace(/\s+/g, "");

    try
    {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);

        return bytes.buffer;
    }
    catch (e)
    {
        console.error("Base64 decode failed", e);
        return null;
    }
}
