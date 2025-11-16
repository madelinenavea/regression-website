let express = require("express");
let multer = require("multer");
let path = require("path");
let fs = require("fs");
let csv = require("fast-csv");

let app = express();
let port = 3000;
let hostname = "localhost";

app.use(express.static(path.join(__dirname, "public")));
let upload = multer({ dest: "uploads/" });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    console.log("Sent Index File");
});

app.get('/plot_script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'plot_script.js'));
    console.log("Sent Plot Script");
});

app.get('/bar_script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'bar_script.js'));
    console.log("Sent Bar Script");
});

app.get('/tab_script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tab_script.js'));
    console.log("Sent tab Script");
});
// Route handler for serving the upload.js client-side script
app.get('/upload.js', (req, res) => {
    // Send the upload.js file to the client when requested
    res.sendFile(path.join(__dirname, 'public', 'upload.js'));
    console.log("Sent Upload Script");
});

app.get('/csv-plot-test.js', (req, res) => {
    // Send the upload.js file to the client when requested
    res.sendFile(path.join(__dirname, 'public', 'csv-plot-test.js'));
    console.log("Sent Upload Script");
});

app.get('/Walmart_Sales.csv', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'data', 'Walmart_Sales.csv'));
    console.log("Sent Walmart File");
});

app.post("/upload", upload.single("uploadedFile"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    // NG: Log the original filename of the uploaded file for debugging and tracking
    console.log("Uploaded file:", req.file.originalname);

    // NG: Initialize arrays to store CSV data during processing
    let rows = [];
    let headers = [];
    let columnIssues = [];

    // NG: Create a stream to read the uploaded file efficiently (handles large files without loading entire file into memory)
    fs.createReadStream(req.file.path)
        // NG: Pipe the file stream through the CSV parser, treating first row as column headers
        // NS: Modified Nicko's original process in order to validate the headers and columns
        .pipe(csv.parse({ headers: false, ignoreEmpty: true }))

        // NG - Error handling: if CSV parsing fails, send error response to client
        .on("error", (error) => {
            console.error(error);
            res.status(500).json({ error: "Error reading CSV" });
        })

        // NS - I modified Nicko's original process to validate the headers and columns
        .on("data", (row) => {
            if (headers.length === 0) {
                headers = row.map((h) => (h ? h.trim() : ""));
                let duplicates = headers.filter(
                    (h, i) => h && headers.indexOf(h) !== i
                );
                headers.forEach((h, i) => {
                    if (!h) {
                        columnIssues.push(`Column ${i + 1} is empty.`);
                    }
                    else if (/^\d+$/.test(h)) {
                        columnIssues.push(`Column ${i + 1} is an invalid header.`)
                    }
                });
                if (duplicates.length > 0) {
                    columnIssues.push(`Duplicate column names found: ${[...new Set(duplicates)].join(", ")}`);
                }
            }
            else {
                rows.push(row);
            }
        })

        // NG - Event: Capture column headers when they are parsed from the first row
        .on("headers", (parsedHeaders) => {
            headers = parsedHeaders;
        })

        // NG - Event: When CSV parsing is complete, process the data and send analysis results
        .on("end", () => {
            // NG - Clean up: Delete the uploaded temporary file to free disk space
            fs.unlinkSync(req.file.path);

            // NS: follows Nicko's json format to break early if errors are found
            if (columnIssues.length > 0) {
                return res.json({
                    fileName: req.file.originalname,
                    columnValidation: {
                        isValid: false,
                        issues: columnIssues
                    },
                    summary: {
                        hasErrors: true,
                        errorCount: columnIssues.length
                    }
                });
            }

            // NG - Validation: Check if CSV contains any data rows (not just headers)
            if (rows.length === 0) {
                return res.status(400).json({ error: "Empty file or invalid CSV format" });
            }

            // NS: I needed to remap the rows to objects since I broke the pipeline for header validation
            let parsedRows = rows.map((rowArr) => {
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header] = rowArr[index];
                });
                return obj;
            })

            // NG: Initialize data structures for analysis
            let missingLocations = [];
            let seenRows = new Map();
            let duplicateRows = new Set();

            // NG - PHASE 1: MISSING DATA DETECTION
            // NG: Iterate through each row and each column to find empty cells
            parsedRows.forEach((row, i) => {
                headers.forEach((col) => {
                    // NG: Check if cell value is empty, null, or undefined
                    if (row[col] === "" || row[col] === null || row[col] === undefined) {
                        missingLocations.push({
                            row: i + 2,  // NG: Convert 0-based index to 1-based, +2 accounts for header row and 0-to-1 conversion
                            column: col,  // NG: Column name where missing data was found
                            value: row[col]  // NG: The actual missing value (empty string, null, etc.)
                        });
                    }
                });
            });

            // NG - PHASE 2: DUPLICATE ROW DETECTION
            // NG: Identify completely identical rows in the dataset
            parsedRows.forEach((row, i) => {
                // NG: Convert each row object to JSON string for easy comparison
                let rowString = JSON.stringify(row);
                if (seenRows.has(rowString)) {
                    // NG: If this row string was seen before, mark both occurrences as duplicates
                    duplicateRows.add(i + 2);
                    duplicateRows.add(seenRows.get(rowString));
                } else {
                    // NG: If this is a new unique row, store it for future comparison
                    seenRows.set(rowString, i + 2);
                }
            });

            // NG: Send comprehensive analysis results back to client as JSON
            res.json({
                fileName: req.file.originalname,
                totalRows: parsedRows.length,
                totalColumns: headers.length,
                headers: headers,

                // NS: Column validation results
                columnValidation: {
                    isValid: true,
                    issues: []
                },

                // NG: Missing data analysis results
                missingData: {
                    total: missingLocations.length,
                    locations: missingLocations
                },

                // NG: Duplicate data analysis results
                duplicateData: {
                    total: duplicateRows.size,
                    rows: Array.from(duplicateRows).sort((a, b) => a - b)
                },

                // NG: Overall data quality summary
                summary: {
                    hasErrors: missingLocations.length > 0 || duplicateRows.size > 0,
                    errorCount: missingLocations.length + duplicateRows.size + columnIssues.length
                }
            });
        });
});


// NG: Outlier detection strategies - Statistical methods for identifying unusual data points
const outlierStrategies = {
  // Z-score method: Best for normally distributed data
  // Measures how many standard deviations a value is from the mean
  zScore: (data, column, threshold = 2.5) => {
    // Extract and parse numeric values from the specified column, filtering out non-numeric values
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
    
    // Return early if no valid numeric values found
    if (values.length === 0) return { outliers: [], cleanedData: data };
    
    // Calculate mean (average) of all values
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation - measures spread/dispersion of data
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    // If all values are identical (stdDev = 0), no outliers can be detected
    if (stdDev === 0) return { outliers: [], cleanedData: data };
    
    const outliers = [];
    // Process each row to identify and handle outliers
    const cleanedData = data.map((row, index) => {
      const value = parseFloat(row[column]);
      
      // Only process valid numeric values
      if (!isNaN(value)) {
        // Calculate Z-score: (value - mean) / standard deviation
        const zScore = Math.abs((value - mean) / stdDev);
        
        // If Z-score exceeds threshold, mark as outlier
        if (zScore > threshold) {
          outliers.push({ 
            row: index + 2, // +2 accounts for header row and 0-to-1 based conversion
            value, 
            zScore: zScore.toFixed(2), // Round to 2 decimal places for readability
            column,
            method: `Z-Score (threshold: ${threshold})`
          });
          // Replace outlier value with null in cleaned data
          return { ...row, [column]: null };
        }
      }
      // Return unchanged row if no outlier detected
      return row;
    });
    
    return { outliers, cleanedData };
  },

  // IQR (Interquartile Range) method: Robust method for skewed data distributions
  // Uses quartiles to identify values outside typical range
  iqr: (data, column) => {
    // Extract, parse, and sort numeric values in ascending order
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val)).sort((a, b) => a - b);
    
    if (values.length === 0) return { outliers: [], cleanedData: data };
    
    // Calculate first quartile (25th percentile) - median of lower half
    const q1 = values[Math.floor(values.length * 0.25)];
    // Calculate third quartile (75th percentile) - median of upper half
    const q3 = values[Math.floor(values.length * 0.75)];
    // Interquartile Range - range containing middle 50% of data
    const iqr = q3 - q1;
    
    // Calculate outlier boundaries: 1.5×IQR from quartiles (Tukey's fences)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = [];
    const cleanedData = data.map((row, index) => {
      const value = parseFloat(row[column]);
      
      if (!isNaN(value)) {
        // Check if value falls outside the acceptable range
        if (value < lowerBound || value > upperBound) {
          outliers.push({ 
            row: index + 2,
            value, 
            bounds: { lower: lowerBound, upper: upperBound }, // Store bounds for reference
            column,
            method: 'IQR (Interquartile Range)'
          });
          // Remove outlier by setting to null
          return { ...row, [column]: null };
        }
      }
      return row;
    });
    
    return { outliers, cleanedData };
  },

  // Winsorization: Conservative method that caps outliers instead of removing them
  // Preserves data points while reducing extreme value influence
  winsorize: (data, column, percentile = 5) => {
    // Extract, parse, and sort numeric values
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val)).sort((a, b) => a - b);
    
    if (values.length === 0) return { outliers: [], cleanedData: data };
    
    // Calculate lower bound (i.e., 5th percentile)
    const lowerBound = values[Math.floor(values.length * (percentile / 100))];
    // Calculate upper bound (i.e., 95th percentile)
    const upperBound = values[Math.floor(values.length * ((100 - percentile) / 100))];
    
    const outliers = [];
    const cleanedData = data.map((row, index) => {
      const value = parseFloat(row[column]);
      
      if (!isNaN(value)) {
        // Check if value is outside the acceptable percentile range
        if (value < lowerBound || value > upperBound) {
          // Cap the value to the nearest bound instead of removing it
          const correctedValue = value < lowerBound ? lowerBound : upperBound;
          
          outliers.push({ 
            row: index + 2,
            originalValue: value, // Store original for comparison
            correctedValue, // Store the capped value
            bounds: { lower: lowerBound, upper: upperBound },
            column,
            method: `Winsorization (${percentile}%)`
          });
          // Replace extreme value with capped value
          return { ...row, [column]: correctedValue };
        }
      }
      return row;
    });
    
    return { outliers, cleanedData };
  }
};

// NG: Route to detect outliers in all numeric columns of uploaded CSV
// This provides a comprehensive analysis of the entire dataset
app.post("/detect-outliers", upload.single("uploadedFile"), (req, res) => {
  // Validate that a file was uploaded
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  let rows = [];
  let headers = [];

  // Stream the uploaded file for efficient memory usage with large files
  fs.createReadStream(req.file.path)
    .pipe(csv.parse({ headers: false, ignoreEmpty: true })) // Parse CSV without treating first row as headers yet
    .on("error", (error) => {
      console.error(error);
      res.status(500).json({ error: "Error reading CSV" });
    })
    .on("data", (row) => {
      // First row contains column headers
      if (headers.length === 0) {
        headers = row.map((h) => (h ? h.trim() : ""));
      } else {
        // Subsequent rows contain data
        rows.push(row);
      }
    })
    .on("end", () => {
      // Clean up: delete the temporary uploaded file
      fs.unlinkSync(req.file.path);

      // Validate that CSV contains data rows
      if (rows.length === 0) {
        return res.status(400).json({ error: "Empty file or invalid CSV format" });
      }

      // Convert array based rows to object format for easier column access
      let parsedRows = rows.map((rowArr) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = rowArr[index]; // Create key-value pairs: {columnName: value}
        });
        return obj;
      });

      // Identify numeric columns by sampling first 10 rows
      const numericColumns = headers.filter(header => {
        const sampleValues = parsedRows.slice(0, 10).map(row => row[header]);
        // Count how many values in the sample are valid numbers
        const numericCount = sampleValues.filter(val => {
          const num = parseFloat(val);
          return !isNaN(num) && val !== null && val !== undefined && val !== '';
        }).length;
        // Consider column numeric if at least 3 of first 10 values are numeric
        return numericCount >= 3;
      });

      // Detect outliers in each numeric column using IQR method 
      const outlierResults = {};
      numericColumns.forEach(column => {
        // Extract all numeric values from this column
        const values = parsedRows.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        
        // Skip columns with insufficient numeric data
        if (values.length < 3) return;

        // Use IQR method for initial detection 
        const iqrResult = outlierStrategies.iqr(parsedRows, column);
        
        // Store results with comprehensive statistics
        outlierResults[column] = {
          outliers: iqrResult.outliers,
          stats: {
            count: values.length,
            mean: values.reduce((sum, val) => sum + val, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            stdDev: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - values.reduce((s, v) => s + v, 0) / values.length, 2), 0) / values.length)
          }
        };
      });

      // Return comprehensive analysis results to client
      res.json({
        fileName: req.file.originalname,
        numericColumns, // List of columns analyzed
        outlierResults, // Outlier findings per column
        totalOutliers: Object.values(outlierResults).reduce((sum, col) => sum + col.outliers.length, 0) // Sum all outliers
      });
    });
});

// NG: Route to detect outliers in a specific column
// Provides detailed analysis using all three detection methods for comparison
app.post("/detect-outliers-column", upload.single("uploadedFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Get target column from request body
  const { column } = req.body;
  if (!column) {
    return res.status(400).send("No column specified.");
  }

  let rows = [];
  let headers = [];

  fs.createReadStream(req.file.path)
    .pipe(csv.parse({ headers: false, ignoreEmpty: true }))
    .on("error", (error) => {
      console.error(error);
      res.status(500).json({ error: "Error reading CSV" });
    })
    .on("data", (row) => {
      if (headers.length === 0) {
        headers = row.map((h) => (h ? h.trim() : ""));
      } else {
        rows.push(row);
      }
    })
    .on("end", () => {
      fs.unlinkSync(req.file.path);

      if (rows.length === 0) {
        return res.status(400).json({ error: "Empty file or invalid CSV format" });
      }

      // Convert to object format for easier column access
      let parsedRows = rows.map((rowArr) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = rowArr[index];
        });
        return obj;
      });

      // Validate that the requested column exists in the CSV
      if (!headers.includes(column)) {
        return res.status(400).json({ error: `Column "${column}" not found in CSV` });
      }

      // Check if column contains sufficient numeric data for analysis
      const values = parsedRows.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
      if (values.length < 3) {
        return res.status(400).json({ error: `Column "${column}" doesn't have enough numeric values for outlier detection` });
      }

      // Apply all three detection methods for comprehensive comparison
      const zScoreResult = outlierStrategies.zScore(parsedRows, column);
      const iqrResult = outlierStrategies.iqr(parsedRows, column);
      const winsorizeResult = outlierStrategies.winsorize(parsedRows, column);

      // Return detailed analysis with all method results and statistics
      res.json({
        fileName: req.file.originalname,
        column,
        results: {
          zScore: zScoreResult,  // Z-score method results
          iqr: iqrResult,        // IQR method results
          winsorize: winsorizeResult // Winsorization method results
        },
        stats: {
          count: values.length,
          mean: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          stdDev: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - values.reduce((s, v) => s + v, 0) / values.length, 2), 0) / values.length)
        }
      });
    });
});

// NG: Route to apply outlier treatment to a specific column
// Processes the file and returns cleaned data based on selected strategy
app.post("/apply-outlier-treatment", upload.single("uploadedFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Get treatment parameters from request
  const { strategy, column, parameters = {} } = req.body;

  let rows = [];
  let headers = [];

  fs.createReadStream(req.file.path)
    .pipe(csv.parse({ headers: false, ignoreEmpty: true }))
    .on("error", (error) => {
      console.error(error);
      res.status(500).json({ error: "Error reading CSV" });
    })
    .on("data", (row) => {
      if (headers.length === 0) {
        headers = row.map((h) => (h ? h.trim() : ""));
      } else {
        rows.push(row);
      }
    })
    .on("end", () => {
      fs.unlinkSync(req.file.path);

      if (rows.length === 0) {
        return res.status(400).json({ error: "Empty file or invalid CSV format" });
      }

      // Convert to object format for processing
      let parsedRows = rows.map((rowArr) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = rowArr[index];
        });
        return obj;
      });

      // Apply the selected outlier treatment strategy
      let result;
      if (strategy === 'winsorize') {
        // Cap outliers at specified percentiles (default: 5th and 95th)
        result = outlierStrategies.winsorize(parsedRows, column, parameters.percentile || 5);
      } else if (strategy === 'zScore') {
        // Remove values with Z-score above threshold (default: 2.5)
        result = outlierStrategies.zScore(parsedRows, column, parameters.threshold || 2.5);
      } else if (strategy === 'iqr') {
        // Remove values outside 1.5×IQR range
        result = outlierStrategies.iqr(parsedRows, column);
      } else {
        return res.status(400).json({ error: "Invalid strategy" });
      }

      // Return treatment results including cleaned data for download
      res.json({
        fileName: req.file.originalname,
        column,
        strategy: result.outliers[0]?.method || strategy, // Method used with parameters
        outliersDetected: result.outliers.length, // Number of values treated
        outliers: result.outliers, // Detailed information about each outlier
        cleanedData: result.cleanedData, // The processed dataset
        originalHeaders: headers // Preserve original column order for download
      });
    });
});


app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
});