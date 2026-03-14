let zip;
let manifest;
let schema;
let data = {};
let originalFileName = "form.eform";

document.getElementById("fileInput").addEventListener("change", openForm);
document.getElementById("saveBtn").addEventListener("click", saveForm);

async function openForm(event)
{
    const file = event.target.files[0];

    if (!file) return;

    originalFileName = file.name;

    zip = await JSZip.loadAsync(file);

    manifest = JSON.parse(await zip.file("manifest.json").async("string"));

    schema = JSON.parse(await zip.file(manifest.schema).async("string"));

    if (manifest.data && zip.file(manifest.data))
    {
        data = JSON.parse(await zip.file(manifest.data).async("string"));
    }
    else
    {
        data = {};
    }

    const container = document.getElementById("container");
    container.innerHTML = "";

    for (const svgPath of manifest.layout)
    {
        const svgText = await zip.file(svgPath).async("string");

        const wrapper = document.createElement("div");
        wrapper.innerHTML = svgText;

        const svg = wrapper.querySelector("svg");

        renderFields(svg);

        container.appendChild(wrapper);
    }
}

function renderFields(svg)
{
    const anchors = svg.querySelectorAll("[data-eform-field]");

    anchors.forEach(anchor =>
    {
        const fieldId = anchor.getAttribute("data-eform-field");

        const rect = anchor.getBBox();

        const value = data[fieldId] || "";

        const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        text.classList.add("eform-value");

        text.setAttribute("x", rect.x + 2);
        text.setAttribute("y", rect.y + rect.height - 2);

        text.textContent = value;

        text.style.fontFamily = "sans-serif";
        text.style.fontSize = "4mm";
        text.style.pointerEvents = "none";

        svg.appendChild(text);

        anchor.addEventListener("click", () =>
        {
            const label = schema.fields[fieldId]?.label || fieldId;

            const input = prompt(`Enter ${label}:`, data[fieldId] || "");

            if (input !== null)
            {
                data[fieldId] = input;
                text.textContent = input;
            }
        });
    });
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
