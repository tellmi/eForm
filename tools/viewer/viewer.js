let zip;
let manifest;
let schema;
let formulas = {};
let data = {};
let fields = {};

let originalFileName = "form.eform";
let activeEditor = null;

document.getElementById("fileInput").addEventListener("change", openForm);
document.getElementById("saveBtn").addEventListener("click", saveForm);

document.addEventListener("click", closeEditor);

/* ---------------------------
   Drag & Drop Support
--------------------------- */

document.addEventListener("dragover", e => e.preventDefault());

document.addEventListener("drop", async e =>
{
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    if (file)
    {
        await loadEForm(file);
    }
});

/* ---------------------------
   Open Form
--------------------------- */

async function openForm(event)
{
    const file = event.target.files[0];

    if (!file) return;

    await loadEForm(file);
}

/* ---------------------------
   Load eForm (supports preview+zip)
--------------------------- */

async function loadEForm(file)
{
    originalFileName = file.name;

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    /* find ZIP header */

    let zipStart = -1;

    for (let i = 0; i < bytes.length - 3; i++)
    {
        if (
            bytes[i] === 0x50 &&
            bytes[i+1] === 0x4B &&
            bytes[i+2] === 0x03 &&
            bytes[i+3] === 0x04
        )
        {
            zipStart = i;
            break;
        }
    }

    if (zipStart < 0)
    {
        alert("ZIP container not found in eForm file.");
        return;
    }

    const zipData = buffer.slice(zipStart);

    zip = await JSZip.loadAsync(zipData);

    if (!zip.file("manifest.json"))
    {
        alert("Invalid eForm container.");
        return;
    }

    manifest = JSON.parse(await zip.file("manifest.json").async("string"));

    schema = JSON.parse(await zip.file(manifest.schema).async("string"));

    data = {};

    if (manifest.data && zip.file(manifest.data))
    {
        data = JSON.parse(await zip.file(manifest.data).async("string"));
    }

    formulas = {};

    if (manifest.formulas && zip.file(manifest.formulas))
    {
        try
        {
            const f = JSON.parse(await zip.file(manifest.formulas).async("string"));
            formulas = f.formulas || {};
        }
        catch(e)
        {
            console.warn("Invalid formulas.json");
        }
    }

    fields = {};

    await renderLayout();
}

/* ---------------------------
   Render Layout
--------------------------- */

async function renderLayout()
{
    const container = document.getElementById("container");
    container.innerHTML = "";

    for (const svgPath of manifest.layout)
    {
        const svgText = await zip.file(svgPath).async("string");

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");

        const svg = doc.documentElement;

        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        normalizeSVG(svg);

        const wrapper = document.createElement("div");
        wrapper.className = "page";

        wrapper.appendChild(svg);
        container.appendChild(wrapper);

        renderFields(svg);
    }

    computeFormulas();
}

/* ---------------------------
   Normalize SVG
--------------------------- */

function normalizeSVG(svg)
{
    let viewBox = svg.getAttribute("viewBox");

    if (!viewBox)
    {
        const w = svg.getAttribute("width");
        const h = svg.getAttribute("height");

        const width = parseFloat(w) || 794;
        const height = parseFloat(h) || 1123;

        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    svg.removeAttribute("width");
    svg.removeAttribute("height");
}

/* ---------------------------
   Field Registry
--------------------------- */

function registerField(anchor)
{
    const id = anchor.getAttribute("data-eform-field");

    if (!fields[id]) fields[id] = [];

    fields[id].push(anchor);
}

/* ---------------------------
   Render Fields
--------------------------- */

function renderFields(svg)
{
    const anchors = svg.querySelectorAll("[data-eform-field]");

    anchors.forEach(anchor =>
    {
        registerField(anchor);

        const fieldId = anchor.getAttribute("data-eform-field");

        const value = data[fieldId] ?? "";

        updateAnchor(anchor, value);

        anchor.addEventListener("click", e =>
        {
            e.stopPropagation();
            openEditor(anchor, fieldId);
        });
    });
}

/* ---------------------------
   Anchor Renderer
--------------------------- */

function updateAnchor(anchor, value)
{
    const text = anchor.querySelector("text");

    if (!text) return;

    text.textContent = value ?? "";
}

/* ---------------------------
   Field Update
--------------------------- */

function updateField(fieldId, value)
{
    data[fieldId] = value;

    const anchors = fields[fieldId] || [];

    anchors.forEach(anchor =>
    {
        updateAnchor(anchor, value);
    });
}

/* ---------------------------
   Editor
--------------------------- */

function openEditor(anchor, fieldId)
{
        closeEditor();

    const rect = anchor.querySelector("rect");
    if (!rect) return;

    const svg = rect.ownerSVGElement;

    const bbox = rect.getBBox();

    const pt = svg.createSVGPoint();
    pt.x = bbox.x;
    pt.y = bbox.y;

    const screen = pt.matrixTransform(svg.getScreenCTM());

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const input = document.createElement("input");

    input.style.position = "absolute";
    input.style.left = (screen.x + scrollX) + "px";
    input.style.top = (screen.y + scrollY) + "px";
    input.style.width = bbox.width + "px";
    input.style.height = bbox.height + "px";
    input.style.boxSizing = "border-box";

    document.body.appendChild(input);

    input.focus();

    activeEditor = { input, fieldId };

    input.addEventListener("keydown", e =>
    {
        if (e.key === "Enter") commitEditor();
        if (e.key === "Escape") closeEditor();
    });

    input.addEventListener("blur", commitEditor);
}

function commitEditor()
{
    if (!activeEditor) return;

    const { input, fieldId } = activeEditor;

    const value = input.value;

    updateField(fieldId, Number(value) || value);

    document.body.removeChild(input);

    activeEditor = null;

    computeFormulas();
}

function closeEditor()
{
    if (!activeEditor) return;

    document.body.removeChild(activeEditor.input);

    activeEditor = null;
}

/* ---------------------------
   Formula Engine
--------------------------- */

function computeFormulas()
{
    for (const target in formulas)
    {
        try
        {
            const result = evaluateExpression(formulas[target]);

            updateField(target, result);
        }
        catch (e)
        {
            console.warn("Formula error:", target);
        }
    }
}

/* ---------------------------
   Expression Evaluation
--------------------------- */

function evaluateExpression(expr)
{
    expr = expandRanges(expr);

    expr = expr.replace(/[A-Za-z0-9_.-]+/g, id =>
    {
        if (data[id] !== undefined)
            return Number(data[id]) || 0;

        return id;
    });

    expr = expr.replace(/sum\((.*?)\)/g, (_, args) =>
    {
        return args.split(",").map(Number).reduce((a,b)=>a+b,0);
    });

    expr = expr.replace(/round\((.*?),(.*?)\)/g, (_, val, digits) =>
    {
        const factor = Math.pow(10, Number(digits));
        return Math.round(Number(val) * factor) / factor;
    });

    return Function("return " + expr)();
}

function expandRanges(expr)
{
    return expr.replace(/f(\d+):f(\d+)/g, (_, start, end) =>
    {
        const ids = [];

        for (let i = Number(start); i <= Number(end); i++)
        {
            ids.push(`f${i}`);
        }

        return ids.join(",");
    });
}

/* ---------------------------
   Save Form
--------------------------- */

async function saveForm()
{
    if (!zip || !manifest) return;

    const json = JSON.stringify(data, null, 2);

    zip.file(manifest.data || "data.json", json);

    const blob = await zip.generateAsync({ type: "blob" });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = originalFileName;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
}

