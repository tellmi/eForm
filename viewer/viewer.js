let zip;
let manifest;
let schema;
let data = {};

document.getElementById("fileInput").addEventListener("change", openForm);

async function openForm(event)
{
    const file = event.target.files[0];

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

    const svgPath = manifest.layout[0];

    const svgText = await zip.file(svgPath).async("string");

    const container = document.getElementById("container");

    container.innerHTML = svgText;

    const svg = container.querySelector("svg");

    renderFields(svg);
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

        anchor.style.cursor = "text";

        anchor.addEventListener("click", () =>
        {
            const input = prompt("Enter value:", data[fieldId] || "");

            if (input !== null)
            {
                data[fieldId] = input;
                text.textContent = input;
            }
        });
    });
}
