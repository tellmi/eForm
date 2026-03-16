let zip;
let manifest;
let schema;
let formulas = [];
let data = {};
let originalFileName = "form.eform";

let activeEditor = null;

document.getElementById("fileInput").addEventListener("change", openForm);
document.getElementById("saveBtn").addEventListener("click", saveForm);

async function openForm(event)
{
    const file = event.target.files[0];

    if (!file) return;

    originalFileName = file.name;

    zip = await JSZip.loadAsync(file);

    if (!zip.file("manifest.json"))
    {
        alert("Not a valid eForm container.");
        return;
    }

    manifest = JSON.parse(await zip.file("manifest.json").async("string"));

    schema = JSON.parse(await zip.file(manifest.schema).async("string"));

    data = {};

    if (manifest.data && zip.file(manifest.data))
    {
        data = JSON.parse(await zip.file(manifest.data).async("string"));
    }

    const container = document.getElementById("container");
    container.innerHTML = "";

    for (const svgPath of manifest.layout)
    {
        const svgText = await zip.file(svgPath).async("string");

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");

        const svg = doc.documentElement;

        /* normalize SVG for browser rendering */

        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        let viewBox = svg.getAttribute("viewBox");

        if (!viewBox)
        {
            let w = svg.getAttribute("width");
            let h = svg.getAttribute("height");

            function toPx(v)
            {
                if (!v) return null;

                if (v.endsWith("mm"))
                    return parseFloat(v) * 96 / 25.4;

                if (v.endsWith("cm"))
                    return parseFloat(v) * 96 / 2.54;

                if (v.endsWith("in"))
                    return parseFloat(v) * 96;

                return parseFloat(v);
            }

            const widthPx = toPx(w) || 794;
            const heightPx = toPx(h) || 1123;

            svg.setAttribute("viewBox", `0 0 ${widthPx} ${heightPx}`);
        }

        /* allow CSS to control display size */

        svg.removeAttribute("width");
        svg.removeAttribute("height");

        const wrapper = document.createElement("div");
        wrapper.className = "page";

        wrapper.appendChild(svg);
        container.appendChild(wrapper);

        renderFields(svg);
    }

    if (zip.file("formulas/formulas.json"))
    {
        const f = JSON.parse(await zip.file("formulas/formulas.json").async("string"));
        formulas = f.formulas || [];
    }

    computeFormulas();
}

function renderFields(svg)
{
    const anchors = svg.querySelectorAll("[data-eform-field]");

    anchors.forEach(anchor =>
    {
        const fieldId = anchor.getAttribute("data-eform-field");

        const value = data[fieldId] ?? "";

        const textNode = anchor.querySelector("text");

        if (!textNode) return;

        textNode.textContent = value;

        anchor.addEventListener("click", (event) =>
        {
            event.stopPropagation();

            openEditor(anchor, fieldId, textNode);
        });
    });
}

function openEditor(anchor, fieldId, textNode)
{
    closeEditor();

    const rect = anchor.querySelector("rect");
    if (!rect) return;

    const svg = anchor.ownerSVGElement;

    const bbox = rect.getBBox();

    const pt = svg.createSVGPoint();
    pt.x = bbox.x;
    pt.y = bbox.y;

    const screen = pt.matrixTransform(svg.getScreenCTM());

    const input = document.createElement("input");

    input.type = "text";
    input.value = data[fieldId] ?? "";

    input.style.position = "absolute";
    input.style.left = screen.x + "px";
    input.style.top = screen.y + "px";
    input.style.width = bbox.width + "px";
    input.style.fontSize = "14px";
    input.style.padding = "2px";

    document.body.appendChild(input);

    input.focus();

    activeEditor = { input, fieldId, textNode };

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

    const { input, fieldId, textNode } = activeEditor;

    const value = input.value;

    data[fieldId] = Number(value) || value;

    textNode.textContent = value;

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

function computeFormulas()
{
    formulas.forEach(rule =>
    {
        const [target, expr] = rule.split("=").map(s => s.trim());

        try
        {
            const result = evaluateExpression(expr);

            data[target] = result;

            updateField(target, result);
        }
        catch (e)
        {
            console.warn("Formula error:", rule);
        }
    });
}

function updateField(fieldId, value)
{
    const anchors = document.querySelectorAll(`[data-eform-field="${fieldId}"]`);

    anchors.forEach(anchor =>
    {
        const text = anchor.querySelector("text");

        if (text)
        {
            text.textContent = value;
        }
    });
}

function evaluateExpression(expr)
{
    expr = expandRanges(expr);

    expr = expr.replace(/f\d+/g, id =>
    {
        return Number(data[id] ?? 0);
    });

    expr = expr.replace(/sum\((.*?)\)/g, (_, args) =>
    {
        return args.split(",").map(Number).reduce((a,b)=>a+b,0);
    });

    expr = expr.replace(/min\((.*?)\)/g, (_, args) =>
    {
        return Math.min(...args.split(",").map(Number));
    });

    expr = expr.replace(/max\((.*?)\)/g, (_, args) =>
    {
        return Math.max(...args.split(",").map(Number));
    });

    expr = expr.replace(/abs\((.*?)\)/g, (_, arg) =>
    {
        return Math.abs(Number(arg));
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
        const s = Number(start);
        const e = Number(end);

        const ids = [];

        for (let i = s; i <= e; i++)
        {
            ids.push(`f${i}`);
        }

        return ids.join(",");
    });
}
