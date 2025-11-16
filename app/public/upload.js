let form = document.getElementById('upload-form');
let message = document.getElementById('upload-message');

// Handles the actual uploading of the .csv file
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

//Handles the validating of the .csv files that have been uploaded
// NG: Function to display CSV analysis results in a user-friendly HTML format
function displayAnalysisResults(result) {
    // NG: Start building the HTML structure for the analysis report
    let html = `
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h3>CSV Analysis Results for: ${result.fileName}</h3>
            <p><strong>File Summary:</strong> ${result.totalRows} rows, ${result.totalColumns} columns</p>
    `;

    // NS: Follows Nicko's formatting but without emojis because I am not in middle school
    if (result.columnValidation && !result.columnValidation.isValid) {
        html += `
            <div style="color: red; margin: 10px 0;">
                <h4> Column Validation Failed</h4>
                <ul>
                    ${result.columnValidation.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    else if (result.columnValidation && result.columnValidation.isValid) {
        html += `<p style="color: green;">Column headers are valid</p>`;
    }

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

    // NG: After displaying the basic analysis, show outlier detection options
    showOutlierDetectionOptions(result);
}



// NG: Function to show outlier detection options after basic analysis
function showOutlierDetectionOptions(result) {
    const outlierSection = document.createElement('div');
    outlierSection.innerHTML = `
        <div style="border: 1px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 5px; background: #f8f9fa;">
            <h3>🔍 Outlier Detection</h3>
            <p>Detect unusual values in your data that may need attention.</p>
            
            <div style="margin: 15px 0;">
                <button onclick="detectAllOutliers()" 
                        style="background: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer; margin-right: 10px;">
                    Detect Outliers in All Columns
                </button>
                
                <div style="margin-top: 10px;">
                    <p><strong>Or detect outliers in a specific column:</strong></p>
                    <select id="column-select" style="padding: 5px; margin-right: 10px;">
                        <option value="">Select a column...</option>
                        ${result.headers.map(header => `<option value="${header}">${header}</option>`).join('')}
                    </select>
                    <button onclick="detectColumnOutliers()" 
                            style="background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                        Detect in Selected Column
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('upload-message').appendChild(outlierSection);
}

// NG: Function to detect outliers in all columns
async function detectAllOutliers() {
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput.files[0]) {
        alert('Please select a file first');
        return;
    }
    
    const data = new FormData();
    data.append('uploadedFile', fileInput.files[0]);
    
    document.getElementById('upload-message').innerHTML = '<p>Detecting outliers in all columns...</p>';
    
    try {
        const response = await fetch('/detect-outliers', {
            method: 'POST',
            body: data
        });
        
        if (response.ok) {
            const result = await response.json();
            displayAllOutlierResults(result);
        } else {
            const error = await response.text();
            document.getElementById('upload-message').innerHTML = 
                `<p style="color: red;">Outlier Detection Failed: ${error}</p>`;
        }
    } catch (error) {
        console.error(error);
        document.getElementById('upload-message').innerHTML = 
            '<p style="color: red;">Error detecting outliers</p>';
    }
}

// NG:Function to detect outliers in a specific column
async function detectColumnOutliers() {
    const columnSelect = document.getElementById('column-select');
    const selectedColumn = columnSelect.value;
    
    if (!selectedColumn) {
        alert('Please select a column first');
        return;
    }
    
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput.files[0]) {
        alert('Please select a file first');
        return;
    }
    
    const data = new FormData();
    data.append('uploadedFile', fileInput.files[0]);
    data.append('column', selectedColumn);
    
    document.getElementById('upload-message').innerHTML = `<p>Detecting outliers in column "${selectedColumn}"...</p>`;
    
    try {
        const response = await fetch('/detect-outliers-column', {
            method: 'POST',
            body: data
        });
        
        if (response.ok) {
            const result = await response.json();
            displayColumnOutlierResults(result);
        } else {
            const error = await response.text();
            document.getElementById('upload-message').innerHTML = 
                `<p style="color: red;">Outlier Detection Failed: ${error}</p>`;
        }
    } catch (error) {
        console.error(error);
        document.getElementById('upload-message').innerHTML = 
            '<p style="color: red;">Error detecting outliers</p>';
    }
}

// NG: Function to display outlier results for all columns
function displayAllOutlierResults(result) {
    let html = `
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h3>Outlier Detection Results for: ${result.fileName}</h3>
            <p><strong>Total Outliers Found:</strong> ${result.totalOutliers}</p>
            <p><strong>Columns Analyzed:</strong> ${result.numericColumns.join(', ') || 'None'}</p>
    `;
    
    if (Object.keys(result.outlierResults).length === 0) {
        html += `<p>No outliers detected in any numeric columns.</p>`;
    } else {
        Object.entries(result.outlierResults).forEach(([column, analysis]) => {
            if (analysis.outliers.length > 0) {
                html += `
                    <div style="margin: 15px 0; padding: 10px; border: 1px solid #ffc107; border-radius: 3px; background: #fffbf0;">
                        <h4>⚠️ Column: "${column}" - ${analysis.outliers.length} outliers found</h4>
                        <p><strong>Statistics:</strong> 
                            Mean: ${analysis.stats.mean.toFixed(2)}, 
                            Std Dev: ${analysis.stats.stdDev.toFixed(2)}, 
                            Range: [${analysis.stats.min.toFixed(2)}, ${analysis.stats.max.toFixed(2)}]
                        </p>
                        <div style="margin-top: 10px;">
                            <button onclick="showColumnOutlierOptions('${column}', ${analysis.outliers.length})" 
                                    style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                                Manage Outliers in "${column}"
                            </button>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div style="margin: 10px 0; padding: 5px; color: green;">
                        ✓ Column "${column}": No outliers found
                    </div>
                `;
            }
        });
    }
    
    html += `
        <div style="margin-top: 15px;">
            <button onclick="location.reload()" 
                    style="background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                Analyze Another File
            </button>
        </div>
        </div>
    `;
    
    document.getElementById('upload-message').innerHTML = html;
}

// NG: Function to display outlier results for a specific column
function displayColumnOutlierResults(result) {
    let html = `
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h3>Outlier Analysis for Column: "${result.column}"</h3>
            <p><strong>File:</strong> ${result.fileName}</p>
            
            <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 3px;">
                <h4>📊 Column Statistics</h4>
                <p><strong>Total Values:</strong> ${result.stats.count}</p>
                <p><strong>Mean:</strong> ${result.stats.mean.toFixed(2)}</p>
                <p><strong>Standard Deviation:</strong> ${result.stats.stdDev.toFixed(2)}</p>
                <p><strong>Range:</strong> ${result.stats.min.toFixed(2)} to ${result.stats.max.toFixed(2)}</p>
            </div>
    `;
    
    // Show results from different methods
    const methods = {
        iqr: result.results.iqr,
        zScore: result.results.zScore,
        winsorize: result.results.winsorize
    };
    
    Object.entries(methods).forEach(([method, methodResult]) => {
        html += `
            <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 3px;">
                <h4>${methodResult.outliers[0]?.method || method.toUpperCase()} Method</h4>
                <p><strong>Outliers Detected:</strong> ${methodResult.outliers.length}</p>
        `;
        
        if (methodResult.outliers.length > 0) {
            html += `
                <button onclick="showOutlierTreatmentOptions('${result.column}', '${method}', ${methodResult.outliers.length})" 
                        style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">
                    Apply ${method === 'winsorize' ? 'Winsorization' : method.toUpperCase()} Treatment
                </button>
            `;
        }
        
        html += `</div>`;
    });
    
    html += `
        <div style="margin-top: 15px;">
            <button onclick="location.reload()" 
                    style="background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                Analyze Another File
            </button>
        </div>
        </div>
    `;
    
    document.getElementById('upload-message').innerHTML = html;
}

// NG: Function to show treatment options for a column
function showOutlierTreatmentOptions(column, strategy, outlierCount) {
    const strategyNames = {
        iqr: 'IQR Method',
        zScore: 'Z-Score Method', 
        winsorize: 'Winsorization'
    };
    
    const strategyDescriptions = {
        iqr: 'Removes values outside 1.5×IQR range',
        zScore: 'Removes values with Z-score > 2.5',
        winsorize: 'Caps extreme values at 5th/95th percentiles'
    };
    
    let html = `
        <div style="border: 1px solid #dc3545; padding: 15px; margin: 10px 0; border-radius: 5px; background: #f8d7da;">
            <h3>🛠️ Outlier Treatment for "${column}"</h3>
            <p><strong>Method:</strong> ${strategyNames[strategy]}</p>
            <p><strong>Description:</strong> ${strategyDescriptions[strategy]}</p>
            <p><strong>Outliers to treat:</strong> ${outlierCount} values</p>
            
            <div style="margin: 15px 0;">
                <p><strong>This will:</strong></p>
                <ul>
                    ${strategy === 'winsorize' 
                        ? '<li>Cap extreme values instead of removing them</li><li>Preserve all data points</li><li>Reduce impact of outliers</li>'
                        : '<li>Remove outlier values (set to empty)</li><li>Keep the row structure intact</li><li>Eliminate extreme values</li>'
                    }
                </ul>
            </div>
            
            <div style="margin-top: 20px;">
                <button onclick="applyOutlierTreatment('${strategy}', '${column}')" 
                        style="background: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer; margin-right: 10px;">
                    ✅ Apply Treatment
                </button>
                <button onclick="history.back()" 
                        style="background: #6c757d; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer;">
                    ❌ Cancel
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('upload-message').innerHTML = html;
}

// NG: Function to apply outlier treatment
async function applyOutlierTreatment(strategy, column) {
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput.files[0]) {
        alert('Please select a file first');
        return;
    }
    
    const data = new FormData();
    data.append('uploadedFile', fileInput.files[0]);
    data.append('strategy', strategy);
    data.append('column', column);
    
    document.getElementById('upload-message').innerHTML = '<p>Applying outlier treatment...</p>';
    
    try {
        const response = await fetch('/apply-outlier-treatment', {
            method: 'POST',
            body: data
        });
        
        if (response.ok) {
            const result = await response.json();
            displayTreatmentResults(result);
        } else {
            const error = await response.text();
            document.getElementById('upload-message').innerHTML = 
                `<p style="color: red;">Treatment Failed: ${error}</p>`;
        }
    } catch (error) {
        console.error(error);
        document.getElementById('upload-message').innerHTML = 
            '<p style="color: red;">Error applying treatment</p>';
    }
}

// NG: Function to display treatment results
function displayTreatmentResults(result) {
    let html = `
        <div style="border: 1px solid #28a745; padding: 15px; margin: 10px 0; border-radius: 5px; background: #d4edda;">
            <h3>✅ Outlier Treatment Complete</h3>
            <p><strong>File:</strong> ${result.fileName}</p>
            <p><strong>Column:</strong> ${result.column}</p>
            <p><strong>Method:</strong> ${result.strategy}</p>
            <p><strong>Outliers Treated:</strong> ${result.outliersDetected}</p>
    `;
    
    if (result.outliers.length > 0) {
        html += `
            <div style="margin: 15px 0;">
                <h4>📋 Treated Values:</h4>
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: white;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Row</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Original Value</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.outliers.map(outlier => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${outlier.row}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${outlier.originalValue || outlier.value}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd;">
                                        ${outlier.correctedValue ? `Capped to ${outlier.correctedValue}` : 'Removed'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    html += `
        <div style="margin-top: 20px;">
            <button onclick="downloadTreatedData(${JSON.stringify(result.cleanedData)}, ${JSON.stringify(result.originalHeaders)})" 
                    style="background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer; margin-right: 10px;">
                💾 Download Treated Data
            </button>
            <button onclick="location.reload()" 
                    style="background: #6c757d; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer;">
                📊 Analyze Another File
            </button>
        </div>
        </div>
    `;
    
    document.getElementById('upload-message').innerHTML = html;
}

// NG: Function to download treated data as CSV
function downloadTreatedData(cleanedData, headers) {
    if (!cleanedData || cleanedData.length === 0) {
        alert('No data to download');
        return;
    }
    
    const csvContent = [
        headers.join(','),
        ...cleanedData.map(row => 
            headers.map(header => {
                const value = row[header];
                // Handle null/undefined values and escape commas in strings
                if (value === null || value === undefined) return '""';
                if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
                return value;
            }).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
