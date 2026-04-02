const DEBUG_FORMULAS = true;
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
let dependencyGraph = {};
let reverseGraph = {};
let currentPageIndex = 0;
let evaluationOrder = [];
let formulaTooltip = null;
let cyclicFields = new Set();


let currentLocale = null; // e.g. "de-DE", "en-US", or null (raw mode)
const SLIDER_ULTRA_CLEAN = true;

function formatNumber(value)
{
    if (typeof value !== "number") return value;

    if (!currentLocale) return value; // raw mode (default)

    return value.toLocaleString(currentLocale);
}

/* ---------------------------
   INIT
--------------------------- */

document.getElementById("fileInput").addEventListener("change", openForm);
document.getElementById("saveBtn").addEventListener("click", saveForm);
document.getElementById("prevPageBtn").onclick = prevPage;
document.getElementById("nextPageBtn").onclick = nextPage;

document.getElementById("applySignatureBtn").onclick = () =>
{
    document.getElementById("signatureInput").click();
};

document.getElementById("signatureInput")
    .addEventListener("change", loadSignature);

document.addEventListener("keydown", e =>
{
    if (!selectedFieldId) return;

    const field = schema?.fields?.[selectedFieldId];
    if (!field || field.format !== "svg") return;

    if (e.key === "Delete" || e.key === "Backspace")
    {
        deleteSignature(selectedFieldId);
    }
});

document.addEventListener("click", e =>
{
    if (activeEditor && e.target === activeEditor.input) return;

    closeEditor();

    document.querySelectorAll("[data-eform-field]")
        .forEach(el => el.classList.remove("active"));

    selectedFieldId = null;
});

/* ---------------------------
   OPEN / LOAD
--------------------------- */

async function openForm(event)
{
    const file = event.target.files[0];
    if (!file) return;
    await loadEForm(file);
}

async function loadEForm(file)
{
    originalFileName = file.name;

    let zipBuffer;

    // 🔥 ALWAYS read as binary FIRST
    const arrayBuffer = await file.arrayBuffer();

    // try extracting embedded zip
    const text = new TextDecoder().decode(arrayBuffer);
    zipBuffer = extractZipFromText(text);

    // fallback: raw file
    if (!zipBuffer)
        zipBuffer = arrayBuffer;

    zip = await JSZip.loadAsync(zipBuffer);

    if (!zip.file("manifest.json"))
    {
        alert("Invalid eForm container.");
        return;
    }

    manifest = JSON.parse(await zip.file("manifest.json").async("string"));

    /* ---------------------------
       AUTO-DISCOVER LAYOUT
    --------------------------- */
    if (!manifest.layout || manifest.layout.length === 0)
    {
        manifest.layout = Object.keys(zip.files)
            .filter(name =>
                name.startsWith("layout/") && name.endsWith(".svg")
            )
            .sort((a, b) =>
            {
                const getParts = str =>
                    str.match(/(\d+|\D+)/g).map(part =>
                        isNaN(part) ? part : Number(part)
                    );

                const pa = getParts(a);
                const pb = getParts(b);

                const len = Math.max(pa.length, pb.length);

                for (let i = 0; i < len; i++)
                {
                    if (pa[i] === undefined) return -1;
                    if (pb[i] === undefined) return 1;

                    if (pa[i] === pb[i]) continue;

                    if (typeof pa[i] === "number" && typeof pb[i] === "number")
                        return pa[i] - pb[i];

                    return String(pa[i]).localeCompare(String(pb[i]));
                }

                return 0;
            });
    }

    // normalize layout paths
    if (manifest.layout)
    {
        manifest.layout = manifest.layout
            .map(p => typeof p === "string" ? p.trim() : p)
            .filter(Boolean);
    }

    /* ---------------------------
       LOAD SCHEMA + DATA
    --------------------------- */

    schema = JSON.parse(await zip.file(manifest.schema).async("string"));

    data = manifest.data && zip.file(manifest.data)
        ? JSON.parse(await zip.file(manifest.data).async("string"))
        : {};

    /* ---------------------------
       BOOLEAN NORMALIZATION
    --------------------------- */

    for (const id in schema.fields)
    {
        if (schema.fields[id].type === "boolean")
        {
            data[id] = data[id] === true;
        }
    }

    /* ---------------------------
       LOAD FORMULAS
    --------------------------- */

    formulas = {};

    if (manifest.formulas && zip.file(manifest.formulas))
    {
        try
        {
            formulas = JSON.parse(
                await zip.file(manifest.formulas).async("string")
            ).formulas || {};
        }
        catch (e)
        {
            console.warn("Failed to load formulas:", e);
        }
    }

    /* ---------------------------
       BUILD DEPENDENCY GRAPH
    --------------------------- */

    dependencyGraph = buildDependencyGraph(formulas);
    reverseGraph = buildReverseGraph(dependencyGraph);

    /* ---------------------------
       DETECT CYCLES (Section 14)
    --------------------------- */

    cyclicFields = detectCycles(dependencyGraph);

    if (cyclicFields.size > 0)
    {
        console.warn("⚠️ Formula cycle detected:", [...cyclicFields]);
    }

    evaluationOrder = buildEvaluationOrder(dependencyGraph, cyclicFields);

    console.log("Evaluation order:", evaluationOrder);

    /* ---------------------------
       INIT RENDER STATE
    --------------------------- */

    fields = {};
    currentPageIndex = 0;

    /* ---------------------------
       INITIAL RENDER
    --------------------------- */

    await renderPage(currentPageIndex);

    updatePageIndicator();
}

/* ---------------------------
   RENDER PAGE
--------------------------- */

async function renderPage(index)
{
    const container = document.getElementById("container");
    container.innerHTML = "";

    if (!manifest.layout?.[index])
    {
        console.warn("No layout for page:", index);
        return;
    }

    const svgPath = resolveLayoutPath(manifest.layout[index]);

    if (!svgPath)
    {
        console.error("❌ Could not resolve layout path:", manifest.layout[index]);
        return;
    }

    const file = zip.file(svgPath);

    if (!file)
    {
        console.error("❌ File not found in zip:", svgPath);
        return;
    }

    const svgText = await file.async("string");

    if (!svgText || !svgText.trim())
    {
        console.error("❌ Empty SVG file:", svgPath);
        return;
    }

    const clean = sanitizeSVG(svgText);

    const doc = new DOMParser().parseFromString(clean, "image/svg+xml");

    if (doc.getElementsByTagName("parsererror").length > 0)
    {
        console.error("❌ SVG parse error:", svgPath);
        return;
    }

    let svg = doc.documentElement;

    // ensure root svg
    if (svg.tagName !== "svg")
    {
        const wrapperSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        wrapperSvg.appendChild(svg);
        svg = wrapperSvg;
    }

    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    normalizeSVG(svg);

    const wrapper = document.createElement("div");
    wrapper.className = "page";
    wrapper.appendChild(svg);

    container.appendChild(wrapper);

    renderFields(svg);

    updatePageIndicator();
    updateNavButtons();
}

/* ---------------------------
   SVG NORMALIZE
--------------------------- */

function normalizeSVG(svg)
{
    if (!svg.getAttribute("viewBox"))
    {
        const w = parseFloat(svg.getAttribute("width")) || 794;
        const h = parseFloat(svg.getAttribute("height")) || 1123;

        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    }

    svg.removeAttribute("width");
    svg.removeAttribute("height");
}

/* ---------------------------
   FIELD RENDERING
--------------------------- */

function renderFields(svg)
{
    if (!DEBUG_FORMULAS)
    {
        document.querySelectorAll(".formula-source")
            .forEach(el => el.classList.remove("formula-source"));

        document.querySelectorAll(".formula-target")
            .forEach(el => el.classList.remove("formula-target"));
    }

    svg.querySelectorAll("[data-eform-field]").forEach(el =>
    {
        registerFieldShape(el);

        const fieldId = el.getAttribute("data-eform-field");

        if (isSliderField(fieldId))
        {
            el.classList.add("slider-field");
        }

        attachFieldClick(el, fieldId);

        /* ---------------------------
           🔥 FORMULA DEBUG + TOOLTIP
        --------------------------- */
        if (DEBUG_FORMULAS)
        {
            el.addEventListener("mouseenter", (e) =>
            {
                console.log("HOVER:", fieldId);

                const deps = dependencyGraph[fieldId] || [];
                const dependents = reverseGraph[fieldId] || [];

                // highlight self
                fields[fieldId]?.shapes.forEach(s =>
                    s.classList.add("formula-target")
                );

                // highlight dependencies
                deps.forEach(dep =>
                {
                    fields[dep]?.shapes.forEach(s =>
                        s.classList.add("formula-source")
                    );
                });

                // highlight dependents
                dependents.forEach(dep =>
                {
                    fields[dep]?.shapes.forEach(s =>
                        s.classList.add("formula-target")
                    );
                });

                /* -------- TOOLTIP -------- */
                const expr = formulas[fieldId];

                if (expr)
                {
                    const resolved = resolveExpression(expr);
                    const evaluated = evaluateExpression(expr);

                    const text =
                        expr +
                        "\n→ " + resolved +
                        "\n= " + evaluated;

                    showFormulaTooltip(text, e.pageX + 10, e.pageY + 10);
                }
            });

            el.addEventListener("mouseleave", () =>
            {
                document.querySelectorAll(".formula-source")
                    .forEach(el => el.classList.remove("formula-source"));

                document.querySelectorAll(".formula-target")
                    .forEach(el => el.classList.remove("formula-target"));

                hideFormulaTooltip();
            });
        }

        const value = data[fieldId];

        if (isSliderField(fieldId))
        {
            const field = schema.fields[fieldId];
            const min = field.min ?? 0;

            const v = (value !== undefined) ? value : min;

            if (value === undefined)
                data[fieldId] = v;

            renderFieldValue(el, v);
        }
        else
        {
            if (value !== undefined)
            {
                if (typeof value === "object" && value?.type === "svg")
                    renderSignature(el, value.value);
                else
                    renderFieldValue(el, value);
            }
        }
    });

    svg.querySelectorAll("[data-eform-label]").forEach(el =>
    {
        registerFieldLabel(el);

        const fieldId = el.getAttribute("data-eform-label");

        decorateLabelWithFieldId(el, fieldId);
        updateCharCounter(fieldId);
    });

    computeFormulas();
}

/* ---------------------------
   FIELD STORAGE
--------------------------- */

function registerFieldShape(el)
{
    const id = el.getAttribute("data-eform-field");

    if (!fields[id])
        fields[id] = { shapes: [], labels: [] };

    fields[id].shapes.push(el);
}

function registerFieldLabel(el)
{
    const id = el.getAttribute("data-eform-label");

    if (!fields[id])
        fields[id] = { shapes: [], labels: [] };

    fields[id].labels.push(el);
}

/* ---------------------------
   FIELD UPDATE
--------------------------- */

function updateField(fieldId, value, skipDeps = false)
{
    const type = getFieldType(fieldId);

    if (type === "boolean")
        value = (value === true);

    data[fieldId] = value;

    const entry = fields[fieldId];
    if (!entry) return;

    updateCharCounter(fieldId);

    /* 🔥 FIX: CLEAN PER SHAPE (not root!) */
    entry.shapes.forEach(shape =>
    {
        const parent = shape.parentNode;

        parent.querySelectorAll(`.field-value[data-field="${fieldId}"]`)
            .forEach(el => el.remove());

        parent.querySelectorAll(`.signature`)
            .forEach(el =>
            {
                if (el.getAttribute("data-field") === fieldId)
                    el.remove();
            });
    });

    /* signature */
    if (typeof value === "object" && value?.type === "svg")
    {
        entry.shapes.forEach(s => renderSignature(s, value.value));
        return;
    }

    /* normal render */
    entry.shapes.forEach(shape =>
    {
        renderFieldValue(shape, value);
    });

    console.log("updateField:", fieldId, value);

    if (!skipDeps)
        updateDependents(fieldId);
}

function renderFieldValue(shape, value)
{
    const fieldId = shape.getAttribute("data-eform-field");

    if (typeof value === "object") return;

    if (isSliderField(fieldId))
    {
        renderSliderValue(shape, value, fieldId);
        return;
    }

    const type = getFieldType(fieldId);
    const bbox = getBBoxSafe(shape);

    renderField({
        doc: document,
        shape,
        value,
        fieldId,
        bbox
    });
}

/* ---------------------------
   CLICK HANDLING
--------------------------- */

function attachFieldClick(el, fieldId)
{
    el.addEventListener("click", e =>
    {
        e.stopPropagation();
        e.preventDefault();

        console.log("CLICK:", fieldId);

        selectedFieldId = fieldId;

        document.querySelectorAll("[data-eform-field]")
            .forEach(el => el.classList.remove("active"));

        el.classList.add("active");

        const type = getFieldType(fieldId);

        /* ---------------------------
           BOOLEAN
        --------------------------- */
        if (type === "boolean")
        {
            const current = data[fieldId] === true;
            console.log("TOGGLE BOOLEAN:", fieldId, current, "→", !current);
            updateField(fieldId, !current);
            return;
        }

        /* ---------------------------
           SELECTION / RADIO
        --------------------------- */
        if (el.hasAttribute("data-eform-value"))
        {
            const raw = el.getAttribute("data-eform-value");

            let value;

            if (type === "number")
                value = Number(raw);
            else
                value = raw;

            console.log("SELECT:", fieldId, value);
            updateField(fieldId, value);
            return;
        }

        /* ---------------------------
           SLIDER (🔥 MUST BE BEFORE EDITOR)
        --------------------------- */
        if (isSliderField(fieldId))
        {
            console.log("SLIDER CLICK:", fieldId);
            handleSliderClick(el, fieldId, e);
            return;
        }
        
        /* ---------------------------
           COMBO (🔥 MUST BE BEFORE EDITOR)
        --------------------------- */
        if (schema?.fields?.[fieldId]?.ui?.widget === "dropdown")
        {
            openDropdown(el, fieldId);
            return;
        }

        /* ---------------------------
           EDITOR / TEXT
        --------------------------- */
        if (activeEditor && activeEditor.fieldId === fieldId)
        {
            moveCursorToClick(el, e);
            return;
        }

        if (isComputedField(fieldId)) return;

        if (type === "text" &&
            schema?.fields?.[fieldId]?.format === "svg")
        {
            return;
        }

        console.log("OPEN EDITOR:", fieldId);
        openEditor(el, fieldId);
    });
}

/* ---------------------------
   EDITOR
--------------------------- */

function openEditor(shape, fieldId)
{
    closeEditor();

    const bbox = getBBoxSafe(shape);
    const svg = shape.ownerSVGElement;

    const pt = svg.createSVGPoint();
    pt.x = bbox.x;
    pt.y = bbox.y;

    const screen = pt.matrixTransform(svg.getScreenCTM());

    const input = document.createElement("input");

    input.value = data[fieldId] ?? "";

    input.style.position = "absolute";
    input.style.left = (screen.x + window.scrollX) + "px";
    input.style.top = (screen.y + window.scrollY) + "px";
    input.style.width = bbox.width + "px";

    /* 🔥 FIX: consistent editor sizing */
    const minHeight = 22;
    const scaleFactor = 2.5;

    input.style.height = Math.max(bbox.height * scaleFactor, minHeight) + "px";

    input.style.padding = "2px 4px";
    input.style.boxSizing = "border-box";

    const max = getMaxLength(fieldId);
    if (max)
        input.maxLength = max;

    document.body.appendChild(input);
    input.focus();

    const len = input.value.length;
    input.setSelectionRange(len, len);

    activeEditor = { input, fieldId };

    /* 🔥 FIX: clean live rendering (no stacking) */
    input.addEventListener("input", () =>
    {
        const value = input.value;

        data[fieldId] = value;
        updateCharCounter(fieldId);

        const entry = fields[fieldId];
        if (!entry) return;

        // 🔥 CLEAR before render
        entry.shapes.forEach(shape =>
        {
            shape.parentNode
                .querySelectorAll(`.field-value[data-field="${fieldId}"]`)
                .forEach(el => el.remove());
        });

        entry.shapes.forEach(s => renderFieldValue(s, value));
    });

    /* navigation */
    input.addEventListener("keydown", e =>
    {
        if (e.key === "Tab" || e.key === "Enter")
        {
            e.preventDefault();

            const nav = getNavigableFields();
            const index = nav.findIndex(f => f.id === fieldId);

            if (index === -1) return;

            let nextIndex = e.shiftKey ? index - 1 : index + 1;

            if (nextIndex < 0) nextIndex = nav.length - 1;
            if (nextIndex >= nav.length) nextIndex = 0;

            const next = nav[nextIndex];

            commitEditor();

            setTimeout(() =>
            {
                next.el.dispatchEvent(new Event("click"));
            }, 0);
        }
    });

    input.addEventListener("blur", commitEditor);
}

function commitEditor()
{
    if (!activeEditor) return;

    const { input, fieldId } = activeEditor;

    // 🔹 flexible number parsing (intl-safe)
    const parsed = parseNumberFlexible(input.value);

    updateField(fieldId, parsed);

    document.body.removeChild(input);
    activeEditor = null;
}

function closeEditor()
{
    if (!activeEditor) return;

    document.body.removeChild(activeEditor.input);
    activeEditor = null;
}

/* ---------------------------
   FORMULAS
--------------------------- */

function computeFormulas()
{
    for (const fieldId of evaluationOrder)
    {
        try
        {
            const expr = formulas[fieldId];

            if (!expr) continue;

            const result = evaluateExpression(expr);

            console.log("COMPUTE:", fieldId, "=", expr, "→", result);

            if (result !== undefined)
            {
                // 🔥 IMPORTANT: prevent recursive propagation
                updateField(fieldId, result, true);
            }
        }
        catch (e)
        {
            console.warn("Formula error in", fieldId, e);
        }
    }

    // optional: warn about skipped cyclic fields
    if (typeof cyclicFields !== "undefined" && cyclicFields.size > 0)
    {
        console.warn("Skipped cyclic formulas:", [...cyclicFields]);
    }
}

function buildEvaluationOrder(graph, cyclicFields)
{
    const inDegree = {};
    const order = [];

    // initialize
    for (const node in graph)
    {
        inDegree[node] = 0;
    }

    // count dependencies
    for (const node in graph)
    {
        graph[node].forEach(dep =>
        {
            if (graph[dep] !== undefined)
            {
                inDegree[node]++;
            }
        });
    }

    // queue = nodes with no dependencies
    const queue = [];

    for (const node in inDegree)
    {
        if (inDegree[node] === 0 && !cyclicFields.has(node))
            queue.push(node);
    }

    while (queue.length)
    {
        const node = queue.shift();
        order.push(node);

        for (const n in graph)
        {
            if (graph[n].includes(node))
            {
                inDegree[n]--;

                if (inDegree[n] === 0 && !cyclicFields.has(n))
                    queue.push(n);
            }
        }
    }

    return order;
}

function evaluateExpression(expr)
{
    console.log("RAW FORMULA:", expr);

    // 🔹 expand ranges: f1:f3 → f1,f2,f3
    expr = expandRanges(expr);

    console.log("AFTER RANGE:", expr);

    // 🔹 replace identifiers (fields only, NOT functions)
    expr = expr.replace(/\b[A-Za-z][A-Za-z0-9_.-]*\b/g, id =>
    {
        // ✅ keep known functions untouched
        if (FORMULA_FUNCTIONS[id])
            return id;

        const v = data[id];

        if (v === undefined || v === null || v === "")
            return 0;

        // 🔹 flexible parsing
        const num = parseNumberFlexible(String(v));

        return (typeof num === "number" && !isNaN(num)) ? num : 0;
    });

    console.log("AFTER REPLACE:", expr);

    try
    {
        // 🔹 inject functions into execution context
        const result = Function(
            ...Object.keys(FORMULA_FUNCTIONS),
            "return " + expr
        )(...Object.values(FORMULA_FUNCTIONS));

        console.log("RESULT:", result);

        return result;
    }
    catch (e)
    {
        console.warn("Formula error:", expr, e);
        return undefined;
    }
}

function expandRanges(expr)
{
    return expr.replace(/f(\d+):f(\d+)/g, (_, a, b) =>
    {
        let ids = [];
        for (let i = +a; i <= +b; i++) ids.push(`f${i}`);
        return ids.join(",");
    });
}

/* ---------------------------
   DEPENDENCIES
--------------------------- */

function buildDependencyGraph(formulas)
{
    const graph = {};

    for (const t in formulas)
    {
        graph[t] = extractDependencies(formulas[t]);
    }

    return graph;
}

function buildReverseGraph(graph)
{
    const reverse = {};

    for (const t in graph)
    {
        graph[t].forEach(dep =>
        {
            if (!reverse[dep]) reverse[dep] = [];
            reverse[dep].push(t);
        });
    }

    return reverse;
}

function extractDependencies(expr)
{
    const matches = expr.match(/\b[A-Za-z][A-Za-z0-9_.-]*\b/g) || [];

    return matches.filter(id =>
        !FORMULA_FUNCTIONS[id] // exclude functions
    );
}

function updateDependents(changedFieldId)
{
    const affected = new Set();

    // 🔹 collect all affected fields (BFS over reverse graph)
    const queue = [changedFieldId];

    while (queue.length)
    {
        const current = queue.shift();

        (reverseGraph[current] || []).forEach(dep =>
        {
            if (!affected.has(dep) && !cyclicFields.has(dep))
            {
                affected.add(dep);
                queue.push(dep);
            }
        });
    }

    console.log("Affected fields:", [...affected]);

    // 🔹 recompute in topological order
    for (const fieldId of evaluationOrder)
    {
        if (!affected.has(fieldId)) continue;

        try
        {
            const expr = formulas[fieldId];
            if (!expr) continue;

            const result = evaluateExpression(expr);

            console.log("RECOMPUTE:", fieldId, "=", expr, "→", result);

            if (result !== undefined)
            {
                // 🔥 IMPORTANT: do NOT trigger further propagation
                updateField(fieldId, result, true);
            }
        }
        catch (e)
        {
            console.warn("Error recomputing", fieldId, e);
        }
    }
}

function detectCycles(graph)
{
    const visited = new Set();
    const stack = new Set();
    const cycles = new Set();

    function dfs(node)
    {
        if (stack.has(node))
        {
            cycles.add(node);
            return;
        }

        if (visited.has(node)) return;

        visited.add(node);
        stack.add(node);

        (graph[node] || []).forEach(dep =>
        {
            dfs(dep);

            // if dependency is cyclic → current also cyclic
            if (cycles.has(dep))
                cycles.add(node);
        });

        stack.delete(node);
    }

    for (const node in graph)
        dfs(node);

    return cycles;
}

/* ---------------------------
   SIGNATURE
--------------------------- */

function renderSignature(shape, svgText, doc = document)
{
    if (!svgText) return;

    const fieldId = shape.getAttribute("data-eform-field");
    const root = shape.ownerSVGElement;

    /* ---------------------------
       REMOVE EXISTING SIGNATURE
    --------------------------- */
    const existing = root.querySelector(
        `.signature[data-field="${fieldId}"]`
    );

    if (existing) existing.remove();

    /* ---------------------------
       PARSE SIGNATURE SVG
    --------------------------- */
    const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");

    if (parsed.querySelector("parsererror"))
    {
        console.warn("Invalid signature SVG");
        return;
    }

    let sig = parsed.documentElement;

    /* ---------------------------
       GET FIELD BBOX (PREVIEW SAFE)
    --------------------------- */
    const bbox = {
        x: parseFloat(shape.getAttribute("x")) || 0,
        y: parseFloat(shape.getAttribute("y")) || 0,
        width: parseFloat(shape.getAttribute("width")) || 100,
        height: parseFloat(shape.getAttribute("height")) || 30
    };

    /* ---------------------------
       DETERMINE SIGNATURE SIZE
    --------------------------- */
    let sigWidth = 100;
    let sigHeight = 50;

    const vb = sig.getAttribute("viewBox");

    if (vb)
    {
        const parts = vb.split(/\s+/).map(Number);

        if (parts.length === 4)
        {
            sigWidth = parts[2];
            sigHeight = parts[3];
        }
    }
    else
    {
        sigWidth = parseFloat(sig.getAttribute("width")) || sigWidth;
        sigHeight = parseFloat(sig.getAttribute("height")) || sigHeight;
    }

    /* ---------------------------
       SCALE TO FIT FIELD
    --------------------------- */
    const scaleX = bbox.width / sigWidth;
    const scaleY = bbox.height / sigHeight;

    // keep aspect ratio
    const scale = Math.min(scaleX, scaleY) * 0.9;

    const offsetX = (bbox.width - sigWidth * scale) / 2;
    const offsetY = (bbox.height - sigHeight * scale) / 2;

    /* ---------------------------
       CREATE GROUP
    --------------------------- */
    const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");

    g.setAttribute("class", "signature");
    g.setAttribute("data-field", fieldId);

    g.setAttribute(
        "transform",
        `translate(${bbox.x + offsetX}, ${bbox.y + offsetY}) scale(${scale})`
    );

    /* ---------------------------
       CLEAN SIGNATURE ROOT
    --------------------------- */
    sig.removeAttribute("width");
    sig.removeAttribute("height");

    /* ---------------------------
       IMPORT INTO TARGET DOC
    --------------------------- */
    const imported = doc.importNode(sig, true);

    // move children into group (avoid nested <svg>)
    while (imported.childNodes.length > 0)
    {
        g.appendChild(imported.childNodes[0]);
    }

    /* ---------------------------
       APPEND TO ROOT SVG
    --------------------------- */
    root.appendChild(g);
}

/* ---------------------------
   SAVE
--------------------------- */

async function saveForm()
{
    if (!zip || !manifest) return;

    zip.file(manifest.data || "data.json", JSON.stringify(data, null, 2));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const arrayBuffer = await zipBlob.arrayBuffer();

    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    let previewSVG = await generatePreviewSVG();

    if (!previewSVG.startsWith("<?xml"))
        previewSVG = `<?xml version="1.0" encoding="UTF-8"?>\n` + previewSVG;

    const i = previewSVG.lastIndexOf("</svg>");

    const finalContent =
        previewSVG.slice(0, i) +
        `\n<!-- eform-container\n${base64}\n-->\n` +
        previewSVG.slice(i);

    const blob = new Blob([finalContent]);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = originalFileName.endsWith(".eform")
        ? originalFileName
        : originalFileName + ".eform";

    link.click();
}

async function generatePreviewSVG()
{
    if (!manifest.layout?.length)
        return `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;

    const doc = document.implementation.createDocument(
        "http://www.w3.org/2000/svg",
        "svg",
        null
    );

    const root = doc.documentElement;

    let offsetY = 0;
    let maxWidth = 0;

    for (let i = 0; i < manifest.layout.length; i++)
    {
        const path = resolveLayoutPath(manifest.layout[i]);

        if (!path)
        {
            console.warn("Missing layout page:", i);
            continue;
        }

        const svgText = await zip.file(path).async("string");
        const clean = sanitizeSVG(svgText);

        const pageDoc = new DOMParser().parseFromString(clean, "image/svg+xml");
        let pageSVG = pageDoc.documentElement;

        if (pageDoc.querySelector("parsererror"))
        {
            console.warn("Invalid SVG page:", path);
            continue;
        }

        /* ---------------------------
           PAGE SIZE
        --------------------------- */
        let width = 800;
        let height = 1100;

        const vb = pageSVG.getAttribute("viewBox");

        if (vb)
        {
            const parts = vb.split(/\s+/).map(Number);
            if (parts.length === 4)
            {
                width = parts[2];
                height = parts[3];
            }
        }

        maxWidth = Math.max(maxWidth, width);

        /* ---------------------------
           WRAP PAGE
        --------------------------- */
        const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");

        g.setAttribute("transform", `translate(0, ${offsetY})`);

        const imported = doc.importNode(pageSVG, true);

        // move children instead of nesting <svg>
        while (imported.childNodes.length > 0)
        {
            g.appendChild(imported.childNodes[0]);
        }

        root.appendChild(g);

        /* ---------------------------
           RENDER FIELDS
        --------------------------- */
        g.querySelectorAll("[data-eform-field]").forEach(el =>
        {
            const fieldId = el.getAttribute("data-eform-field");
            const value = data[fieldId];

            if (value === undefined || value === null)
                return;

            const bbox = {
                x: parseFloat(el.getAttribute("x")) || 0,
                y: parseFloat(el.getAttribute("y")) || 0,
                width: parseFloat(el.getAttribute("width")) || 100,
                height: parseFloat(el.getAttribute("height")) || 30
            };

            if (typeof value === "object" && value?.type === "svg")
            {
                renderSignature(el, value.value, doc);
                return;
            }

            renderField({
                doc,
                shape: el,
                value,
                fieldId,
                bbox
            });
        });

        /* ---------------------------
           NEXT PAGE OFFSET
        --------------------------- */
        offsetY += height + 20; // spacing between pages
        
        // optional separator
        const line = doc.createElementNS("http://www.w3.org/2000/svg", "line");

        line.setAttribute("x1", 0);
        line.setAttribute("x2", maxWidth);
        line.setAttribute("y1", offsetY - 10);
        line.setAttribute("y2", offsetY - 10);

        line.setAttribute("stroke", "#ccc");
        line.setAttribute("stroke-width", "1");
        line.setAttribute("stroke-width", "0.5");
        line.setAttribute("stroke-dasharray", "4,4");

        root.appendChild(line);
    }

    /* ---------------------------
       FINAL SIZE
    --------------------------- */
    root.setAttribute("viewBox", `0 0 ${maxWidth} ${offsetY}`);

    return new XMLSerializer().serializeToString(doc);
}

/* ---------------------------
   HELPERS
--------------------------- */

function extractZipFromText(text)
{
    const start = text.indexOf("<!-- eform-container");
    if (start < 0) return null;

    const end = text.indexOf("-->", start);
    if (end < 0) return null;

    const base64 = text.slice(start + 21, end).trim();

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);

    return bytes.buffer;
}

function getBBoxSafe(el)
{
    try { return el.getBBox(); }
    catch { return { x: 0, y: 0, width: 100, height: 30 }; }
}

function getFieldType(id)
{
    const t = schema?.fields?.[id]?.type;

    if (t === "string") return "text";
    return t || "text";
}

function isComputedField(id)
{
    return schema?.fields?.[id]?.computed === true;
}

function updateLabel(el, value)
{
    if (el.tagName !== "text") return;

    // Preserve original label text
    if (!el.dataset.baseText)
        el.dataset.baseText = el.textContent;

    // Clear everything
    el.textContent = el.dataset.baseText + " " + (value ?? "");
}

/* ---------------------------
   NAVIGATION
--------------------------- */

function updatePageIndicator()
{
    document.getElementById("pageIndicator").textContent =
        `Page ${currentPageIndex + 1} / ${manifest.layout.length}`;
}

async function nextPage()
{
    if (currentPageIndex < manifest.layout.length - 1)
    {
        currentPageIndex++;
        await renderPage(currentPageIndex);
        updatePageIndicator();
    }
}

async function prevPage()
{
    if (currentPageIndex > 0)
    {
        currentPageIndex--;
        await renderPage(currentPageIndex);
        updatePageIndicator();
    }
}

function resolveLayoutPath(path)
{
    if (!path) return null;

    path = path.trim().replace(/^\/+/, "");

    const candidates = [
        path,
        path.toLowerCase(),
        "layout/" + path.replace(/^layout\//, ""),
        path.replace(/^layout\//, "") // 🔥 NEW fallback
    ];

    for (const p of candidates)
    {
        if (zip.file(p)) return p;
    }

    console.error("❌ Layout file not found:", path);
    return null;
}

function moveCursorToClick(shape, event)
{
    if (!activeEditor) return;

    const svg = shape.ownerSVGElement;
    const bbox = getBBoxSafe(shape);

    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());

    const relativeX = cursor.x - bbox.x;

    const input = activeEditor.input;

    const textLength = input.value.length;
    const ratio = Math.max(0, Math.min(1, relativeX / bbox.width));

    const position = Math.round(textLength * ratio);

    input.setSelectionRange(position, position);
}

function updateNavButtons()
{
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");

    if (!manifest?.layout?.length)
    {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    prevBtn.disabled = currentPageIndex === 0;
    nextBtn.disabled = currentPageIndex === manifest.layout.length - 1;
}

function sanitizeSVG(svgText)
{
    return svgText
        .replace(/^\uFEFF/, "")                         // strip BOM
        .replace(/<\?xml[\s\S]*?\?>/gi, "")             // remove XML header
        .replace(/<!DOCTYPE[\s\S]*?>/gi, "")            // remove doctype
        .replace(/font-family:\s*sans\b/g, "sans-serif")// fix invalid font
        .trim();
}

function getDisplayId(fieldId)
{
    return fieldId.replace(/^f/, "");
}

function decorateLabelWithFieldId(labelEl, fieldId)
{
    if (!labelEl || !fieldId) return;

    // prevent duplicate superscripts
    if (labelEl.querySelector(".field-id")) return;

    const displayId = getDisplayId(fieldId);

    const sup = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

    sup.setAttribute("class", "field-id");
    
    sup.setAttribute("baseline-shift", "super");

    // slight offset → superscript look
    sup.setAttribute("dx", "2");
    sup.setAttribute("dy", "-2");

    sup.textContent = displayId;

    labelEl.appendChild(sup);
}

function updateCharCounter(fieldId)
{
    const entry = fields[fieldId];
    if (!entry) return;

    const max = getMaxLength(fieldId);
    if (!max) return;

    const value = String(data[fieldId] ?? "");
    const remaining = max - value.length;

    entry.shapes.forEach(shape =>
    {
        const id = shape.getAttribute("data-eform-field");

        let counter = shape.parentNode.querySelector(
            `.char-counter[data-field="${id}"]`
        );

        if (!counter)
        {
            const bbox = getBBoxSafe(shape);

            counter = document.createElementNS("http://www.w3.org/2000/svg", "text");

            counter.setAttribute("class", "char-counter");
            counter.setAttribute("data-field", id);

            // 👉 POSITION: below left corner of field
            counter.setAttribute("x", bbox.x);
            counter.setAttribute("y", bbox.y + bbox.height + 4);

            shape.parentNode.appendChild(counter);
        }

        counter.textContent = `(${remaining})`;
    });
}

function getMaxLength(fieldId)
{
    return schema?.fields?.[fieldId]?.maxLength;
}

function getNavigableFields()
{
    const seen = new Set();
    const list = [];

    document.querySelectorAll("[data-eform-field]").forEach(el =>
    {
        const id = el.getAttribute("data-eform-field");

        if (seen.has(id)) return; // avoid duplicates (radio etc.)
        if (isComputedField(id)) return;

        seen.add(id);
        list.push({ id, el });
    });

    return list;
}

async function loadSignature(event)
{
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();

    signatureSVG = text;

    // apply to selected field
    const sigField =
        selectedFieldId ||
        Object.keys(schema.fields)
            .find(id => schema.fields[id]?.format === "svg");

    if (sigField)
        applySignatureToField(sigField);
    else
        alert("No signature field found.");

    // reset input so same file can be re-selected
    event.target.value = "";
}

function applySignatureToField(fieldId)
{
    if (!signatureSVG) return;

    // optional safety check
    const field = schema?.fields?.[fieldId];
    if (!field || field.format !== "svg")
    {
        alert("Selected field is not a signature field.");
        return;
    }

    updateField(fieldId, {
        type: "svg",
        value: signatureSVG
    });
}

function deleteSignature(fieldId)
{
    data[fieldId] = null;

    const entry = fields[fieldId];
    if (!entry) return;

    entry.shapes.forEach(shape =>
    {
        const sig = shape.parentNode.querySelector(".signature");
        if (sig) sig.remove();
    });
}

function renderField({ doc, shape, value, fieldId, bbox })
{
    const parent = shape.parentNode;

    const optionValue = shape.getAttribute("data-eform-value");

    /* ---------------------------
       RADIO ●
    --------------------------- */
    if (optionValue !== null)
    {
        let opt = optionValue;

        if (!isNaN(opt))
            opt = Number(opt);

        if (value !== opt) return;

        const dot = doc.createElementNS("http://www.w3.org/2000/svg", "circle");

        dot.setAttribute("class", "field-value");
        dot.setAttribute("data-field", fieldId);

        /* ---------------------------
           🔥 USE REAL CIRCLE CENTER
        --------------------------- */
        const cx = parseFloat(shape.getAttribute("cx")) || 0;
        const cy = parseFloat(shape.getAttribute("cy")) || 0;
        const rBase = parseFloat(shape.getAttribute("r")) || 2;

        /* ---------------------------
           SIZE (relative to original)
        --------------------------- */
        const r = rBase * 0.6; // inner dot

        dot.setAttribute("cx", cx);
        dot.setAttribute("cy", cy);
        dot.setAttribute("r", r);

        dot.setAttribute("fill", "black");

        parent.appendChild(dot);
        return;
    }

    /* ---------------------------
       CHECKBOX ✔
    --------------------------- */
    if (typeof value === "boolean")
    {
        if (!value) return;

        const text = doc.createElementNS("http://www.w3.org/2000/svg", "text");

        text.setAttribute("class", "field-value");
        text.setAttribute("data-field", fieldId);

        const fontSize = Math.max(4, bbox.height * 0.30);

        text.setAttribute("font-size", fontSize);

        text.setAttribute("x", bbox.x + bbox.width / 2);
        text.setAttribute("y", bbox.y + bbox.height / 2);

        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");

        text.textContent = "✔";

        parent.appendChild(text);
        return;
    }

    /* ---------------------------
       TEXT / NUMBER
    --------------------------- */
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "object") return;

    const text = doc.createElementNS("http://www.w3.org/2000/svg", "text");

    text.setAttribute("class", "field-value");
    text.setAttribute("data-field", fieldId);

    const fontSize = Math.max(4, bbox.height * 0.30);

    text.setAttribute("font-size", fontSize);

    text.setAttribute("x", bbox.x + 4);
    text.setAttribute("y", bbox.y + bbox.height / 2);

    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("text-anchor", "start");

    text.textContent = formatNumber ? formatNumber(value) : value;

    parent.appendChild(text);
}

function isSliderField(fieldId)
{
    return schema?.fields?.[fieldId]?.ui?.widget === "slider";
}

function handleSliderClick(shape, fieldId, event)
{
    const field = schema.fields[fieldId];
    if (!field) return;

    const min = field.min ?? 0;
    const max = field.max ?? 100;
    const step = field.step ?? 1;

    const svg = shape.ownerSVGElement;
    const bbox = getBBoxSafe(shape);

    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());

    let relative = (cursor.x - bbox.x) / bbox.width;
    relative = Math.max(0, Math.min(1, relative));

    let value = min + relative * (max - min);

    value = Math.round(value / step) * step;
    value = Math.max(min, Math.min(max, value));

    console.log("SLIDER VALUE:", fieldId, value);

    // ✅ ONLY THIS
    updateField(fieldId, value);

    console.log("SLIDER:", fieldId, "→", value);
}

function renderSliderValue(shape, value, fieldId)
{
    const field = schema.fields[fieldId];
    if (!field) return;

    const min = field.min ?? 0;
    const max = field.max ?? 100;
    const step = field.step ?? 1;

    if (value === undefined || value === null) return;

    const bbox = getBBoxSafe(shape);
    const parent = shape.parentNode;

    const steps = Math.floor((max - min) / step);

    /* ---------------------------
       TRACK LINE (lighter)
    --------------------------- */
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("class", "field-value");
    line.setAttribute("data-field", fieldId);

    line.setAttribute("x1", bbox.x);
    line.setAttribute("y1", bbox.y + bbox.height / 2);
    line.setAttribute("x2", bbox.x + bbox.width);
    line.setAttribute("y2", bbox.y + bbox.height / 2);

    line.setAttribute("stroke", "#bbb");
    line.setAttribute("stroke-width", "0.3");

    parent.appendChild(line);

    /* ---------------------------
       STEP MARKERS (ultra-clean aware)
    --------------------------- */
    for (let i = 0; i <= steps; i++)
    {
        // 🔥 ULTRA CLEAN: skip every second tick
        if (SLIDER_ULTRA_CLEAN && i % 2 !== 0)
            continue;

        const v = min + i * step;
        const ratio = (v - min) / (max - min);

        const x = bbox.x + bbox.width * ratio;

        const tick = document.createElementNS("http://www.w3.org/2000/svg", "rect");

        tick.setAttribute("class", "field-value");
        tick.setAttribute("data-field", fieldId);

        tick.setAttribute("x", x - 0.5);
        tick.setAttribute("y", bbox.y + bbox.height / 2 - 1);

        tick.setAttribute("width", 1);
        tick.setAttribute("height", 2);

        tick.setAttribute("fill", "#777");

        parent.appendChild(tick);

        /* ---------------------------
           OPTIONAL LABELS
        --------------------------- */
        if (steps <= 10 && (!SLIDER_ULTRA_CLEAN || i % 2 === 0))
        {
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");

            label.setAttribute("class", "field-value");
            label.setAttribute("data-field", fieldId);

            label.setAttribute("x", x);
            label.setAttribute("y", bbox.y + bbox.height + 4);

            label.setAttribute("text-anchor", "middle");
            label.setAttribute("font-size", "2.5");
            label.setAttribute("fill", "#666");

            label.textContent = formatNumber(v);

            parent.appendChild(label);
        }
    }

    /* ---------------------------
       ACTIVE MARKER (rounded)
    --------------------------- */
    const ratio = (value - min) / (max - min);
    const x = bbox.x + bbox.width * ratio;

    const marker = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    marker.setAttribute("class", "field-value");
    marker.setAttribute("data-field", fieldId);

    marker.setAttribute("x", x - 1);
    marker.setAttribute("y", bbox.y);

    marker.setAttribute("width", 2);
    marker.setAttribute("height", bbox.height);

    marker.setAttribute("fill", "#222");
    marker.setAttribute("opacity", "0.8");

    // 🔥 rounded edges (modern look)
    marker.setAttribute("rx", 1);
    marker.setAttribute("ry", 1);

    parent.appendChild(marker);
}

/* ---------------------------
   FORMULA FUNCTIONS
--------------------------- */

function fn_sum(...args)
{
    return args.reduce((a, b) => a + (Number(b) || 0), 0);
}

function fn_round(value, digits = 0)
{
    const factor = Math.pow(10, digits);
    return Math.round((Number(value) || 0) * factor) / factor;
}

function fn_avg(...args)
{
    if (!args.length) return 0;
    return fn_sum(...args) / args.length;
}

const FORMULA_FUNCTIONS = {
    sum: fn_sum,
    round: fn_round,
    avg: fn_avg
};

function openDropdown(shape, fieldId)
{
    closeEditor();

    const field = schema.fields[fieldId];
    const options = field.options || [];

    const bbox = getBBoxSafe(shape);
    const svg = shape.ownerSVGElement;

    const pt = svg.createSVGPoint();
    pt.x = bbox.x;
    pt.y = bbox.y;

    const screen = pt.matrixTransform(svg.getScreenCTM());

    const select = document.createElement("select");

    select.style.position = "absolute";
    select.style.left = (screen.x + window.scrollX) + "px";
    select.style.top = (screen.y + window.scrollY) + "px";
    select.style.width = bbox.width + "px";
    select.style.height = (bbox.height * Math.min(options.length, 6)) + "px";

    // populate options
    options.forEach(opt =>
    {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
    });

    // set current value
    if (data[fieldId] !== undefined)
        select.value = data[fieldId];

    document.body.appendChild(select);
    select.focus();

    activeEditor = { input: select, fieldId };

    select.addEventListener("change", () =>
    {
        updateField(fieldId, select.value);
    });

    select.addEventListener("blur", closeEditor);
}

function parseNumberFlexible(input)
{
    if (typeof input !== "string") return input;

    let s = input.trim();

    // detect decimal separator (last occurrence of . or ,)
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");

    let decimalSep = null;

    if (lastDot > lastComma) decimalSep = ".";
    else if (lastComma > lastDot) decimalSep = ",";

    if (decimalSep)
    {
        const thousandsSep = decimalSep === "." ? "," : ".";

        // remove thousands separators
        s = s.replace(new RegExp(`\\${thousandsSep}`, "g"), "");

        // normalize decimal to dot
        if (decimalSep === ",")
            s = s.replace(",", ".");
    }

    const num = Number(s);
    return isNaN(num) ? input : num;
}

function showFormulaTooltip(text, x, y)
{
    if (!formulaTooltip)
    {
        formulaTooltip = document.createElement("div");

        formulaTooltip.style.position = "absolute";
        formulaTooltip.style.background = "rgba(0,0,0,0.85)";
        formulaTooltip.style.color = "white";
        formulaTooltip.style.padding = "6px 8px";
        formulaTooltip.style.borderRadius = "4px";
        formulaTooltip.style.fontSize = "12px";
        formulaTooltip.style.pointerEvents = "none";
        formulaTooltip.style.whiteSpace = "pre";
        formulaTooltip.style.zIndex = 2000;

        // ✨ optional polish
        formulaTooltip.style.transition = "opacity 0.1s ease";
        formulaTooltip.style.opacity = "0";

        document.body.appendChild(formulaTooltip);
    }

    formulaTooltip.textContent = text;

    formulaTooltip.style.left = x + "px";
    formulaTooltip.style.top = y + "px";

    formulaTooltip.style.display = "block";

    // ✨ fade-in
    requestAnimationFrame(() =>
    {
        formulaTooltip.style.opacity = "1";
    });
}

function hideFormulaTooltip()
{
    if (!formulaTooltip) return;

    formulaTooltip.style.opacity = "0";

    setTimeout(() =>
    {
        if (formulaTooltip)
            formulaTooltip.style.display = "none";
    }, 100);
}

function resolveExpression(expr)
{
    return expr.replace(/\b[A-Za-z][A-Za-z0-9_.-]*\b/g, id =>
    {
        if (FORMULA_FUNCTIONS[id]) return id;

        const v = data[id];

        if (v === undefined || v === null || v === "")
            return 0;

        return v;
    });
}


