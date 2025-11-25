document.addEventListener("DOMContentLoaded", () => {
    let csvData = [];      // Store rows in file
    let columnNames = [];  // Store names of all columns
    let currentPage = 1;
    let rowsPerPage = 50;
    // ----------------------------
    // 1. Load CSV file
    // ----------------------------
    document.getElementById("csv-file").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                csvData = results.data.map(row => {
                const newRow = {};
                for (let [key, value] of Object.entries(row)) {
                    newRow[key] = value ? value.trim() : "";
                }
                return newRow;
            });
            columnNames = results.meta.fields;

            // --- COLUMN HEADER VALIDATION ---
            let headerErrors = [];
            let emptyHeaders = columnNames.filter(h => !h || h.trim() === "");
            let numericHeaders = columnNames.filter(h => /^\d+$/.test(h));
            let duplicates = columnNames.filter((h, i) => columnNames.indexOf(h) !== i);

            if (emptyHeaders.length) headerErrors.push("❌ Empty column names: " + emptyHeaders.join(", "));
            if (numericHeaders.length) headerErrors.push("❌ Numeric-only column names: " + numericHeaders.join(", "));
            if (duplicates.length) headerErrors.push("❌ Duplicate column names: " + duplicates.join(", "));

            const msgBox = document.getElementById("upload-message");
            if (headerErrors.length > 0) {
                msgBox.style.color = "red";
                msgBox.innerHTML = headerErrors.join("<br>");
                return;
            } else {
                msgBox.style.color = "green";
                msgBox.innerHTML = "Column headers valid ✔";
            }
            populatePlotDropdowns(columnNames);
            showColumnSelectors(columnNames);
            displayTable(csvData);
            showBooleanConversionPanel();

            }
        });
    });

    // ----------------------------
    // 2. Show variable type selectors
    // ----------------------------
    function showColumnSelectors(columns) {
        const container = document.getElementById("columns-container");
        container.innerHTML = "";
        columns.forEach(column => {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("field-row");

            const label = document.createElement("label");
            label.textContent = column;

            const select = document.createElement("select");
            select.dataset.column = column;
            ["string", "int", "float", "bool"].forEach(type => {
                const option = document.createElement("option");
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
    // 3. Display CSV table
    // ----------------------------
    function displayTable(data) {
        const container = document.getElementById("table-container");
        container.innerHTML = "";

        if (data.length === 0) return;

        const table = document.createElement("table");

        // Header
        const headerRow = document.createElement("tr");
        Object.keys(data[0]).forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Pagination calculations
        let start = (currentPage - 1) * rowsPerPage;
        let end = Math.min(start + rowsPerPage, data.length);

        // Render *only* the visible rows
        for (let i = start; i < end; i++) {
            const row = data[i];
            const tr = document.createElement("tr");
            Object.values(row).forEach(val => {
                const td = document.createElement("td");
                td.textContent = val;
                tr.appendChild(td);
            });
            table.appendChild(tr);
        }

        container.appendChild(table);

        // Pagination buttons
        const paginationDiv = document.createElement("div");
        paginationDiv.classList.add("pagination-controls");

        const totalPages = Math.ceil(data.length / rowsPerPage);

        paginationDiv.innerHTML = `
            <button id="prev-page" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
            <span> Page ${currentPage} of ${totalPages} </span>
            <button id="next-page" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
        `;

        container.appendChild(paginationDiv);

        // Click handling
        document.getElementById("prev-page").onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                displayTable(csvData);
            }
        };
        document.getElementById("next-page").onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayTable(csvData);
            }
        };
    }


    // ----------------------------
    // 4. Verify column types
    // ----------------------------
    document.getElementById("verify-btn").addEventListener("click", () => {
        const selects = document.querySelectorAll("#columns-container select");
        const resultDiv = document.getElementById("verification-result");
        const messages = [];

        selects.forEach(select => {
            const col = select.dataset.column;
            const type = select.value;
            const values = csvData.map(row => row[col]);
            let isValid = values.every(val => checkValueType(val, type));
            messages.push(`${col}: ${isValid ? "✅" : "❌"}`);
        });

        resultDiv.innerHTML = messages.join("<br>");
        showBooleanConversionPanel();
    });

    function checkValueType(value, type) {
        if (value === "" || value === null || value === undefined) return true;
        switch(type) {
            case "int":
                return /^-?\d+$/.test(value);
            case "float":
                return /^-?\d+(\.\d+)?$/.test(value);
            case "bool":
                return /^(true|false|0|1|yes|no)$/i.test(value);
            case "string":
                return !/^-?\d+(\.\d+)?$/.test(value) && !/^(true|false|0|1|yes|no)$/i.test(value);
            default:
                return false;
        }
    }

    // ----------------------------
    // 5. Boolean conversion
    // ----------------------------
    function showBooleanConversionPanel() {
        const container = document.getElementById("boolean-columns-container");
        container.innerHTML = "";
        let hasBoolean = false;

        document.querySelectorAll("#columns-container select").forEach(select => {
            const col = select.dataset.column;
            const type = select.value;
            const values = csvData.map(row => row[col]);
            const isYesNo = values.every(val => val === "" || ["yes","no"].includes(val.toLowerCase()));

            if (type === "bool" && isYesNo) {
                hasBoolean = true;
                const rowDiv = document.createElement("div");
                rowDiv.classList.add("field-row");

                const label = document.createElement("label");
                label.textContent = `${col} contains Yes/No values:`;

                const convertSelect = document.createElement("select");
                convertSelect.dataset.column = col;
                [["no", "Do not convert"], ["yes", "Convert to 1/0"]].forEach(([v, t]) => {
                    const option = document.createElement("option");
                    option.value = v;
                    option.textContent = t;
                    convertSelect.appendChild(option);
                });

                rowDiv.appendChild(label);
                rowDiv.appendChild(convertSelect);
                container.appendChild(rowDiv);
            }
        });

        document.getElementById("boolean-panel").style.display = hasBoolean ? "block" : "none";
    }

    document.getElementById("apply-boolean-btn").addEventListener("click", () => {
        document.querySelectorAll("#boolean-columns-container select").forEach(select => {
            const col = select.dataset.column;
            if (select.value === "yes") {
                csvData.forEach(row => {
                    if (row[col].toLowerCase() === "yes") row[col] = 1;
                    else if (row[col].toLowerCase() === "no") row[col] = 0;
                });
            }
        });
        displayTable(csvData);
        document.getElementById("boolean-panel").style.display = "none";
    });

    // ----------------------------
    // 6. Outlier detection
    // ----------------------------
    function isNumericColumn(col) {
        return csvData.every(row => row[col] === "" || !isNaN(parseFloat(row[col])));
    }

    function detectZScoreOutliers(column, threshold=2.5) {
        const values = csvData.map(r => parseFloat(r[column])).filter(v => !isNaN(v));
        if (values.length === 0) return [];
        const mean = values.reduce((a,b) => a+b,0)/values.length;
        const stdDev = Math.sqrt(values.reduce((sum,v) => sum+Math.pow(v-mean,2),0)/values.length);
        return csvData.map((row,i) => {
            const val = parseFloat(row[column]);
            if (!isNaN(val) && stdDev!==0) {
                const z = Math.abs((val-mean)/stdDev);
                if (z>threshold) return {row: i+2, value: val, zScore: z.toFixed(2)};
            }
            return null;
        }).filter(x=>x);
    }

    function detectIQROutliers(column) {
        const values = csvData.map(r => parseFloat(r[column])).filter(v => !isNaN(v)).sort((a,b)=>a-b);
        if (values.length===0) return [];
        const q1 = values[Math.floor(values.length*0.25)];
        const q3 = values[Math.floor(values.length*0.75)];
        const iqr = q3-q1;
        const lower = q1-1.5*iqr;
        const upper = q3+1.5*iqr;
        return csvData.map((row,i)=>{
            const val = parseFloat(row[column]);
            if(!isNaN(val) && (val<lower||val>upper)) return {row:i+2,value:val,bounds:{lower,upper}};
            return null;
        }).filter(x=>x);
    }


    let outlierSection = document.getElementById("outlier-section");
    outlierSection.style.display = "block";

    document.getElementById("detect-outliers-btn").addEventListener("click", () => {
        let resultsDiv = document.getElementById("outlier-results");
        resultsDiv.innerHTML = "";

        let tableRows = document.querySelectorAll("#table-container table tr");
        tableRows.forEach(tr => tr.classList.remove("outlier-row"));

        let hasOutliers = false;
        let outlierRows = new Set();

        columnNames.forEach(col => {
            if (isNumericColumn(col)) {
                let zOutliers = detectZScoreOutliers(col);
                let iqrOutliers = detectIQROutliers(col);

                if (zOutliers.length > 0 || iqrOutliers.length > 0) {
                    hasOutliers = true;
                }

                zOutliers.forEach(o => outlierRows.add(o.row));
                iqrOutliers.forEach(o => outlierRows.add(o.row));

                resultsDiv.innerHTML += `<strong>${col}</strong>: Z-score outliers = ${zOutliers.length}, IQR outliers = ${iqrOutliers.length}<br>`;
            }
        });

        if (!hasOutliers) {
            resultsDiv.innerHTML = "No outliers detected in numeric columns.";
        }
        tableRows.forEach((tr, i) => {
            if (i === 0) return;
            const rowNumber = i + 1;
            if (outlierRows.has(rowNumber)) {
                tr.classList.add("outlier-row");
            }
        });
    });

    // checking missing and duplicates
    document.getElementById("check-quality-btn").addEventListener("click", () => {
    let missingCount = {};
    let duplicateCount = 0;
    let seenRows = new Set();

    columnNames.forEach(c => missingCount[c] = 0);

    csvData.forEach(row => {
        let rowKey = JSON.stringify(row);
        if (seenRows.has(rowKey)) duplicateCount++;
        else seenRows.add(rowKey);

        columnNames.forEach(col => {
            if (!row[col] || row[col].trim() === "") {
                missingCount[col]++;
            }
        });
    });

    let div = document.getElementById("quality-results");
    div.innerHTML = "<h4>Data Quality Report</h4>";

    // showing missing values
    div.innerHTML += "<strong>Missing Values:</strong><br>";
    Object.entries(missingCount).forEach(([col, count]) => {
        div.innerHTML += `${col}: ${count}<br>`;
    });

    div.innerHTML += `<br><strong>Duplicate Rows:</strong> ${duplicateCount}`;
    });

    // treating the outliers
    document.getElementById("apply-treatment-btn").addEventListener("click", () => {
        const method = document.getElementById("outlier-treatment-method").value;

        function percentile(sorted, p) {
            if (sorted.length === 0) return NaN;
            const idx = (sorted.length - 1) * p;
            const lo = Math.floor(idx);
            const hi = Math.ceil(idx);
            if (lo === hi) return sorted[lo];
            const weight = idx - lo;
            return sorted[lo] * (1 - weight) + sorted[hi] * weight;
        }
        const numericCols = columnNames.filter(isNumericColumn);
        if (numericCols.length === 0) {
            document.getElementById("treatment-result").innerText = "No numeric columns found for treatment.";
            return;
        }

        let removedIndices = new Set();
        let modifiedCount = 0;

        if (method === "winsor") {
            const newData = csvData.map(r => ({ ...r }));

            numericCols.forEach(col => {
            const valuesWithIndex = csvData
                .map((row, i) => ({ i, v: parseFloat(row[col]) }))
                .filter(o => !isNaN(o.v));

            if (valuesWithIndex.length === 0) return;

            const values = valuesWithIndex.map(o => o.v).sort((a, b) => a - b);
            const lo = percentile(values, 0.05);
            const hi = percentile(values, 0.95);

            valuesWithIndex.forEach(({ i, v }) => {
                if (v < lo) {
                newData[i][col] = lo;
                modifiedCount++;
                } else if (v > hi) {
                newData[i][col] = hi;
                modifiedCount++;
                }
            });
            });

            csvData = newData;
        } else {
            numericCols.forEach(col => {
            const valuesWithIndex = csvData
                .map((row, i) => ({ i, v: parseFloat(row[col]) }))
                .filter(o => !isNaN(o.v));

            if (valuesWithIndex.length < 2) return;

            const values = valuesWithIndex.map(o => o.v).sort((a, b) => a - b);

            const q1 = percentile(values, 0.25);
            const q3 = percentile(values, 0.75);
            const iqr = q3 - q1;
            const lower = q1 - 1.5 * iqr;
            const upper = q3 + 1.5 * iqr;

            const mean = values.reduce((s, x) => s + x, 0) / values.length;
            const sd = Math.sqrt(values.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / values.length);

            valuesWithIndex.forEach(({ i, v }) => {
                if (method === "remove-iqr") {
                if (v < lower || v > upper) removedIndices.add(i);
                } else if (method === "remove-z") {
                if (sd > 0) {
                    const z = Math.abs((v - mean) / sd);
                    if (z > 2.5) removedIndices.add(i);
                }
                }
            });
            });

            if (removedIndices.size > 0) {
            const originalLength = csvData.length;
            csvData = csvData.filter((_, i) => !removedIndices.has(i));
            modifiedCount = 0;
            document.getElementById("treatment-result").innerText =
                `Removed: ${removedIndices.size}, Modified: ${modifiedCount}`;
            displayTable(csvData);
            populatePlotDropdowns(columnNames);
            showColumnSelectors(columnNames);
            return;
            } else {
            document.getElementById("treatment-result").innerText = "No outliers removed.";
            return;
            }
        }

        displayTable(csvData);
        populatePlotDropdowns(columnNames);
        showColumnSelectors(columnNames);
        document.getElementById("treatment-result").innerText =
            `Winsorization applied. Modified values: ${modifiedCount}`;
        });



    // ----------------------------
    // 7. Plotting functions
    // ----------------------------
    function populatePlotDropdowns(columns) {
        const barSelect = document.getElementById("plot-bar-column");
        const xSelect = document.getElementById("plot-x");
        const ySelect = document.getElementById("plot-y");
        [barSelect,xSelect,ySelect].forEach(s=>s.innerHTML="");
        columns.forEach(col=>{
            const opt1 = document.createElement("option");
            opt1.value = col; opt1.textContent = col;
            barSelect.appendChild(opt1);
            xSelect.appendChild(opt1.cloneNode(true));
            ySelect.appendChild(opt1.cloneNode(true));
        });
    }

    function plotBarColumn(column) {
        const values = csvData.map(r=>r[column]);
        const counts = {};
        values.forEach(v => counts[v]= (counts[v]||0)+1);
        Plotly.newPlot("plot-output", [{x:Object.keys(counts),y:Object.values(counts),type:"bar"}], {title:`Bar Chart of ${column}`});
    }

    function plotScatter(xCol, yCol) {
        const x = csvData.map(r=>parseFloat(r[xCol])).filter(v=>!isNaN(v));
        const y = csvData.map(r=>parseFloat(r[yCol])).filter(v=>!isNaN(v));
        Plotly.newPlot("plot-output", [{x,y,mode:"markers",type:"scatter"}], {title:`${xCol} vs ${yCol}`, xaxis:{title:xCol}, yaxis:{title:yCol}});
    }

    document.getElementById("plot-bar-btn").addEventListener("click", () => {
        const col = document.getElementById("plot-bar-column").value;
        plotBarColumn(col);
    });
    document.getElementById("plot-scatter-btn").addEventListener("click", () => {
        const x = document.getElementById("plot-x").value;
        const y = document.getElementById("plot-y").value;
        plotScatter(x, y);
    });
});
