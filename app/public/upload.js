let form = document.getElementById('upload-form');
let message = document.getElementById('upload-message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let data = new FormData(form);
    message.textContent = "";
    message.innerHTML = "<p>Processing file...</p>";

    try {
        let response = await fetch('/upload', {
            method: 'POST',
            body: data
        });
        
        if (response.ok) {
            let result = await response.json();
            displayAnalysisResults(result);
        }
        else {
            let error = await response.text();
            message.innerHTML = `<p style="color: red;">Upload Failed: ${error}</p>`;
        }
    }
    catch (error) {
        console.error(error);
        message.textContent = "Error Uploading File";
    }
});
// NG: Function to display CSV analysis results in a user-friendly HTML format
function displayAnalysisResults(result) {
    // NG: Start building the HTML structure for the analysis report
    let html = `
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h3>CSV Analysis Results for: ${result.fileName}</h3>
            <p><strong>File Summary:</strong> ${result.totalRows} rows, ${result.totalColumns} columns</p>
    `;

    // NG - SECTION 1: MISSING DATA ANALYSIS
    // NG: Check if any missing data was found in the CSV
    if (result.missingData.total > 0) {
        // NG: If missing data exists, create an orange warning section
        html += `
            <div style="color: orange; margin: 10px 0;">
                <h4>⚠️ Missing Data (${result.missingData.total} cells)</h4>
                <ul>
        `;
        // NG: Iterate through each missing data location and create list items
        result.missingData.locations.forEach(location => {
            // NG: Display each missing cell with row number and column name
            html += `<li>Row ${location.row}, Column "${location.column}"</li>`;
        });
        html += `</ul></div>`;
    } else {
        // NG: If no missing data, show a green success message with checkmark
        html += `<p style="color: green;">✓ No missing data found</p>`;
    }

    // NG - SECTION 2: DUPLICATE DATA ANALYSIS
    // NG: Check if any duplicate rows were found in the CSV
    if (result.duplicateData.total > 0) {
        // NG: If duplicates exist, create a red warning section
        html += `
            <div style="color: red; margin: 10px 0;">
                <h4>🔁 Duplicate Rows (${result.duplicateData.total} rows affected)</h4>
                <p>Duplicate rows found at: ${result.duplicateData.rows.join(', ')}</p>
            </div>
        `;
    } else {
        // NG: If no duplicates, show a green success message with checkmark
        html += `<p style="color: green;">✓ No duplicate rows found</p>`;
    }

    // NG - SECTION 3: SUMMARY SECTION
    // NG: Create a summary section with overall data quality assessment
    html += `
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc;">
            <h4>Summary</h4>
            <p><strong>Total Issues Found:</strong> ${result.summary.errorCount}</p>
            <p><strong>File Status:</strong> ${result.summary.hasErrors ? '❌ Needs Review' : '✅ Clean'}</p>
        </div>
    </div>
    `;

    message.innerHTML = html;
}