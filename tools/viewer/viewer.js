let zip;
let manifest;
let schema;
let formulas = {};
let data = {};
let fields = {};

let originalFileName = "form.eform";
let activeEditor = null;

let selectedFieldId = null;
let signatureSVG = null;

document.getElementById("fileInput").addEventListener("change", openForm);
document.getElementById("saveBtn").addEventListener("click", saveForm);

document.addEventListener("click", e =>
{
    if (activeEditor && e.target === activeEditor.input)
    {
        return; // don't close when clicking inside input
    }

    closeEditor();
});

document.getElementById("signatureInput")?.addEventListener("change", async e =>
{
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".svg"))
    {
        alert("Please upload an SVG file.");
        return;
    }

    signatureSVG = await file.text();

    // APPLY immediately after loading
    if (selectedFieldId)
    {
        applySignatureToField(selectedFieldId, signatureSVG);
    }
});

document.getElementById("applySignatureBtn")?.addEventListener("click", () =>
{
    if (!selectedFieldId)
    {
        alert("Select a field first.");
        return;
    }

    const field = schema.fields[selectedFieldId];

    if (!field || field.type !== "signature")
    {
        alert("Please select the signature field.");
        return;
    }

    // open file picker
    document.getElementById("signatureInput").click();
});


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

    const text = await file.text();

    let zipBuffer = extractZipFromText(text);

    if (!zipBuffer)
    {
        // fallback to old binary format
        const buffer = await file.arrayBuffer();
        zipBuffer = buffer;
    }

    zip = await JSZip.loadAsync(zipBuffer);

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

        const value = data[fieldId];

        if (typeof value === "object" && value?.type === "svg")
        {
            renderSignature(anchor, value.value);
        }
        else
        {
            updateAnchor(anchor, value ?? "");
        }

        anchor.addEventListener("click", e =>
        {
            e.stopPropagation();

            selectedFieldId = fieldId;

            // ❌ block editing if computed
            if (fieldId in formulas)
            {
                return;
            }
            // if already editing same field → just reposition cursor
            if (activeEditor && activeEditor.fieldId === fieldId)
            {
                moveCursorToClick(anchor, e);
                return;
            }
            openEditor(anchor, fieldId);
        });

        if (fieldId in formulas)
        {
            const rect = anchor.querySelector("rect");
            if (rect)
            {
                rect.setAttribute("stroke", "#999");
                rect.setAttribute("stroke-dasharray", "4 2");
            }
        }
        
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

    const currentValue = data[fieldId];

    if (typeof currentValue !== "object")
    {
        input.value = currentValue ?? "";
    }

    input.style.position = "absolute";
    input.style.left = (screen.x + scrollX) + "px";
    input.style.top = (screen.y + scrollY) + "px";
    input.style.width = bbox.width + "px";
    input.style.height = bbox.height + "px";
    input.style.boxSizing = "border-box";

    document.body.appendChild(input);

    input.focus();
    input.select();

    activeEditor = { input, fieldId };

    input.addEventListener("keydown", e =>
    {
        if (e.key === "Enter")
        {
            commitEditor();
        }
        else if (e.key === "Escape")
        {
            closeEditor();
        }
        else if (e.key === "Tab")
        {
            e.preventDefault();

            const ordered = Array.from(document.querySelectorAll("[data-eform-field]"))
              .filter(el =>
              {
                  const id = el.getAttribute("data-eform-field");
                  return !(id in formulas); // skip computed
              });

            const currentId = activeEditor.fieldId;

            let index = ordered.findIndex(el =>
                el.getAttribute("data-eform-field") === currentId
            );

            index += e.shiftKey ? -1 : 1;

            if (index < 0) index = ordered.length - 1;
            if (index >= ordered.length) index = 0;

            const next = ordered[index];
            const nextId = next.getAttribute("data-eform-field");

            // prevent double commit
            input.removeEventListener("blur", commitEditor);

            commitEditor();
            openEditor(next, nextId);
        }
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
    renderAllSignatures();
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

    // update data.json inside zip
    const json = JSON.stringify(data, null, 2);
    zip.file(manifest.data || "data.json", json);

    // generate zip as binary
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // convert to base64
    const arrayBuffer = await zipBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let binary = "";
    for (let i = 0; i < bytes.length; i++)
    {
        binary += String.fromCharCode(bytes[i]);
    }

    const base64 = btoa(binary);

    // IMPORTANT: load preview SVG (first layout page or preview.svg)
    let previewSVG = "";

    if (manifest.layout && manifest.layout.length > 0)
    {
        previewSVG = await generatePreviewSVG();
    }
    else
    {
        previewSVG = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    }
    
    if (!previewSVG || !previewSVG.includes("<svg"))
    {
        previewSVG = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    }

    // ensure UTF-8 header
    if (!previewSVG.startsWith("<?xml"))
    {
        previewSVG =
            `<?xml version="1.0" encoding="UTF-8"?>\n` + previewSVG;
    }

    // append base64 container
    const insertIndex = previewSVG.lastIndexOf("</svg>");

    const finalContent =
        previewSVG.slice(0, insertIndex) +
        `\n<!-- eform-container\n${base64}\n-->\n` +
    previewSVG.slice(insertIndex);

    // save as file
    console.log(finalContent.slice(0, 200));
    const blob = new Blob([finalContent], { type: "application/octet-stream" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    if (!originalFileName.endsWith(".eform"))
    {
        originalFileName = originalFileName.replace(/\.\w+$/, "") + ".eform";
    }

    link.download = originalFileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function applySignatureToField(fieldId, svgText)
{
    data[fieldId] = {
        type: "svg",
        value: svgText
    };

    const anchors = fields[fieldId] || [];

    anchors.forEach(anchor =>
    {
        renderSignature(anchor, svgText);
    });
}

function renderSignature(anchor, svgText)
{
    const rect = anchor.querySelector("rect");
    if (!rect) return;

    // remove old signature
    const existing = anchor.querySelector(".signature");
    if (existing) existing.remove();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const sig = doc.documentElement;
    
    // ensure viewBox exists
    if (!sig.getAttribute("viewBox"))
    {
        const w = sig.getAttribute("width") || 200;
        const hAttr = sig.getAttribute("height") || 50;

        sig.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(hAttr)}`);
    }

    let h = 50;

    if (sig.viewBox && sig.viewBox.baseVal && sig.viewBox.baseVal.height)
    {
        h = sig.viewBox.baseVal.height;
    }
    else if (sig.getAttribute("height"))
    {
        h = parseFloat(sig.getAttribute("height"));
    }

    const box = rect.getBBox();

    const scale = (box.height * 0.9) / h;

    // center inside field
    const offsetY = (box.height - h * scale) / 2;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    g.setAttribute("class", "signature");

    g.setAttribute("transform",
        `translate(${box.x}, ${box.y + offsetY}) scale(${scale})`
    );

    sig.removeAttribute("width");
    sig.removeAttribute("height");

    const imported = document.importNode(sig, true);

    // move children instead of whole SVG
    while (imported.childNodes.length > 0)
    {
        g.appendChild(imported.childNodes[0]);
    }

    anchor.appendChild(g);
}

function getFieldOrder()
{
    return Array.from(document.querySelectorAll("[data-eform-field]"));
}

function focusNextField(currentFieldId)
{
    const ordered = getFieldOrder();

    const index = ordered.findIndex(el =>
        el.getAttribute("data-eform-field") === currentFieldId
    );

    if (index < 0) return;

    const next = ordered[index + 1];

    const nextEl = next || ordered[0];

    const nextId = next.getAttribute("data-eform-field");

    openEditor(next, nextId);
}

function moveCursorToClick(anchor, event)
{
    if (!activeEditor) return;

    const rect = anchor.querySelector("rect");
    if (!rect) return;

    const svg = rect.ownerSVGElement;
    const bbox = rect.getBBox();

    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());

    const relativeX = cursor.x - bbox.x;

    const input = activeEditor.input;

    // approximate character position
    const textLength = input.value.length;
    const ratio = Math.max(0, Math.min(1, relativeX / bbox.width));

    const position = Math.round(textLength * ratio);

    input.setSelectionRange(position, position);
}

function renderAllSignatures()
{
    for (const fieldId in data)
    {
        const value = data[fieldId];

        if (typeof value === "object" && value?.type === "svg")
        {
            const anchors = fields[fieldId] || [];

            anchors.forEach(anchor =>
            {
                renderSignature(anchor, value.value);
            });
        }
    }
}

function extractZipFromText(text)
{
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

    for (let i = 0; i < binary.length; i++)
    {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

async function generatePreviewSVG()
{
    let svgText = "";

    if (zip.file("preview.svg"))
    {
        svgText = await zip.file("preview.svg").async("string");
    }
    else if (manifest.layout?.length > 0)
    {
        svgText = await zip.file(manifest.layout[0]).async("string");
    }
    else
    {
        return `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");

    const svg = doc.documentElement;

    const anchors = svg.querySelectorAll("[data-eform-field]");

    anchors.forEach(anchor =>
    {
        const fieldId = anchor.getAttribute("data-eform-field");
        const value = data[fieldId];

        // TEXT
        if (typeof value !== "object")
        {
            const text = anchor.querySelector("text");
            if (text)
            {
                text.textContent = value ?? "";
            }
        }

        // SIGNATURE
        if (typeof value === "object" && value?.type === "svg")
        {
            const rect = anchor.querySelector("rect");
            if (!rect) return;

            // 🔥 remove existing content (important!)
            const text = anchor.querySelector("text");
            if (text) text.textContent = "";

            const parser = new DOMParser();
            const sigDoc = parser.parseFromString(value.value, "image/svg+xml");
            const sig = sigDoc.documentElement;

            // ensure viewBox exists
            if (!sig.getAttribute("viewBox"))
            {
                const w = sig.getAttribute("width") || 200;
                const h = sig.getAttribute("height") || 50;
                sig.setAttribute("viewBox", `0 0 ${w} ${h}`);
            }

            // 🔥 safe height extraction
            let h = 50;
            const vbAttr = sig.getAttribute("viewBox");

            if (vbAttr)
            {
                const parts = vbAttr.trim().split(/\s+/).map(Number);
                if (parts.length === 4 && parts[3] > 0)
                {
                    h = parts[3];
                }
            }
            else if (sig.getAttribute("height"))
            {
                h = parseFloat(sig.getAttribute("height")) || 50;
            }

            const box = {
                x: parseFloat(rect.getAttribute("x")) || 0,
                y: parseFloat(rect.getAttribute("y")) || 0,
                width: parseFloat(rect.getAttribute("width")) || 100,
                height: parseFloat(rect.getAttribute("height")) || 40
            };

            // 🔥 prevent invalid scale
            const scale = h > 0 ? (box.height * 0.9) / h : 1;

            const offsetY = (box.height - h * scale) / 2;

            const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");

            g.setAttribute("transform",
                `translate(${box.x}, ${box.y + offsetY}) scale(${scale})`
            );

            sig.removeAttribute("width");
            sig.removeAttribute("height");

            const imported = doc.importNode(sig, true);

            while (imported.childNodes.length > 0)
            {
                g.appendChild(imported.childNodes[0]);
            }

            anchor.appendChild(g);
        }
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
}


