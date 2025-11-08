let csvData = [];      // Store rows in file
let columnNames = [];  // Store names of all columns

// ----------------------------
// 1. Load CSV file
// ----------------------------
document.getElementById("csv-file").addEventListener("change", (event) => {
    let file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // Trim whitespace from all values
            csvData = results.data.map(row => {
                let newRow = {};
                for (let [key, value] of Object.entries(row)) {
                    if (value) {
                        newRow[key] = value.trim();
                    } else {
                        newRow[key] = "";
                    }
                }
                return newRow;
            });
            columnNames = results.meta.fields;
            showColumnSelectors(columnNames); // Show columns in left panel
            displayTable(csvData);
            showBooleanConversionPanel();
        }
    });
});

// ----------------------------
// 2. Show variable types for each variable column
// ----------------------------
function showColumnSelectors(columns) {
    let container = document.getElementById("columns-container");
    container.innerHTML = "";

    columns.forEach(column => {
        let rowDiv = document.createElement("div");
        rowDiv.classList.add("field-row");
        
        let label = document.createElement("label"); // Column label
        label.textContent = column;

        let select = document.createElement("select"); // Type dropdown
        select.dataset.column = column;

        ["string", "int", "float", "bool"].forEach(type => {
            let option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        });

        rowDiv.appendChild(label);
        rowDiv.appendChild(select);
        container.appendChild(rowDiv);
    });
}

// ----------------------------
// 3. Display file that user uploaded
// ----------------------------
function displayTable(data) {
    let container = document.getElementById("table-container");
    container.innerHTML = "";

    if (data.length === 0) return;

    let table = document.createElement("table");
    
    let headerRow = document.createElement("tr"); // Header
    Object.keys(data[0]).forEach(col => {
        let th = document.createElement("th");
        th.textContent = col;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // For all rows
    data.forEach(row => {
        let tr = document.createElement("tr");
        Object.values(row).forEach(val => {
            let td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    container.appendChild(table);

    let firstRow = table.querySelector("tr:nth-child(2)"); // first data row
    if (firstRow) {
        let rowHeight = firstRow.offsetHeight;
        let headerHeight = table.querySelector("tr").offsetHeight;
        container.style.height = (headerHeight + rowHeight * 10) + "px"; // Only have 10 rows show
        container.style.overflowY = "auto";
    }
}

// ----------------------------
// 4. Verify each column's data types
// ----------------------------
document.getElementById("verify-btn").addEventListener("click", () => {
    let selects = document.querySelectorAll("#columns-container select");
    let resultDiv = document.getElementById("verification-result");
    let messages = [];

    selects.forEach(select => {
        let col = select.dataset.column;
        let type = select.value;
        let values = csvData.map(row => row[col]);

        let isValid = true;
        for (let i = 0; i < values.length; i++) {
            if (!checkValueType(values[i], type)) {
                isValid = false;
                break;
            }
        }
        let message = col + ": ";
        if (isValid) {
            message += "✅";
        } else {
            message += "❌";
        }
        messages.push(message);
    });

    resultDiv.innerHTML = messages.join("<br>");
    showBooleanConversionPanel();
});

// ----------------------------
// 5. Check type of value
// ----------------------------
function checkValueType(value, type) {
    if (value === "" || value === null || value === undefined) return true;
    switch(type) {
        case "int":
            if (/^-?\d+$/.test(value)) {
                return true;
            } else {
                return false;
            }
        case "float":
            if (/^-?\d+(\.\d+)?$/.test(value)) {
                return true;
            } else {
                return false;
            }
        case "bool":
            if (/^(true|false|0|1|yes|no)$/i.test(value)) {
                return true;
            } else {
                return false;
            }
        case "string":
            if (/^-?\d+(\.\d+)?$/.test(value)) {
                return false;
            } else if (/^(true|false|0|1|yes|no)$/i.test(value)) {
                return false;
            } else {
                return true;
            }
        default:
            return false;
    }
}


// ----------------------------
// 6. Have option to convert bools
// ----------------------------
function showBooleanConversionPanel() {
    let container = document.getElementById("boolean-columns-container");
    container.innerHTML = "";
    let hasBoolean = false;

    document.querySelectorAll("#columns-container select").forEach(select => {
        let col = select.dataset.column;
        let type = select.value;
        let values = csvData.map(row => row[col]);

        let isYesNo = true;
        for (let i = 0; i < values.length; i++) {
            let val = values[i];
            if (!(val.toLowerCase() === "yes" || val.toLowerCase() === "no" || val === "")) {
                isYesNo = false;
                break;
            }
        }

        if (type === "bool" && isYesNo) {
            hasBoolean = true;

            let rowDiv = document.createElement("div");
            rowDiv.classList.add("field-row");

            let label = document.createElement("label");
            label.textContent = col + " contains Yes/No values:";

            let convertSelect = document.createElement("select");
            convertSelect.dataset.column = col;

            for (let j = 0; j < 2; j++) {
                let option = document.createElement("option");
                if (j === 0) {
                    option.value = "no";
                    option.textContent = "Do not convert";
                } else {
                    option.value = "yes";
                    option.textContent = "Convert to 1/0";
                }
                convertSelect.appendChild(option);
            }

            rowDiv.appendChild(label);
            rowDiv.appendChild(convertSelect);
            container.appendChild(rowDiv);
        }
    });

    if (hasBoolean) {
        document.getElementById("boolean-panel").style.display = "block";
    } else {
        document.getElementById("boolean-panel").style.display = "none";
    }
}

// Apply the bool stuff
document.getElementById("apply-boolean-btn").addEventListener("click", () => {
    document.querySelectorAll("#boolean-columns-container select").forEach(select => {
        let col = select.dataset.column;
        if (select.value === "yes") {
            for (let i = 0; i < csvData.length; i++) {
                if (csvData[i][col].toLowerCase() === "yes") {
                    csvData[i][col] = 1;
                } else if (csvData[i][col].toLowerCase() === "no") {
                    csvData[i][col] = 0;
                }
            }
        }
    });

    displayTable(csvData);
    document.getElementById("boolean-panel").style.display = "none";
});