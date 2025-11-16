let express = require("express");
let multer = require("multer");
let path = require("path");
let fs = require("fs");
let csv = require("fast-csv");

let app = express();
let port = 3000;
let hostname = "localhost";

app.use(express.static("public"));
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


// NG: Outlier detection strategies
const outlierStrategies = {
  // Z-score method for normally distributed data
  zScore: (data, column, threshold = 2.5) => {
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
    if (values.length === 0) return { outliers: [], cleanedData: data };
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    if (stdDev === 0) return { outliers: [], cleanedData: data };
    
    const outliers = [];
    const cleanedData = data.map((row, index) => {
      const value = parseFloat(row[column]);
      if (!isNaN(value)) {
        const zScore = Math.abs((value - mean) / stdDev);
        if (zScore > threshold) {
          outliers.push({ 
            row: index + 2, 
            value, 
            zScore: zScore.toFixed(2), 
            column,
            method: `Z-Score (threshold: ${threshold})`
          });
          return { ...row, [column]: null }; // Replace outlier with null
        }
      }
      return row;
    });
    
    return { outliers, cleanedData };
  },

  // IQR method for skewed data
  iqr: (data, column) => {
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val)).sort((a, b) => a - b);
    if (values.length === 0) return { outliers: [], cleanedData: data };
    
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = [];
    const cleanedData = data.map((row, index) => {
      const value = parseFloat(row[column]);
      if (!isNaN(value)) {
        if (value < lowerBound || value > upperBound) {
          outliers.push({ 
            row: index + 2, 
            value, 
            bounds: { lower: lowerBound, upper: upperBound }, 
            column,
            method: 'IQR (Interquartile Range)'
          });
          return { ...row, [column]: null };
        }
      }
      return row;
    });
    
    return { outliers, cleanedData };
  },

  // Winsorization - cap outliers instead of removing
  winsorize: (data, column, percentile = 5) => {
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val)).sort((a, b) => a - b);
    if (values.length === 0) return { outliers: [], cleanedData: data };
    
    const lowerBound = values[Math.floor(values.length * (percentile / 100))];
    const upperBound = values[Math.floor(values.length * ((100 - percentile) / 100))];
    
    const outliers = [];
    const cleanedData = data.map((row, index) => {
      const value = parseFloat(row[column]);
      if (!isNaN(value)) {
        if (value < lowerBound || value > upperBound) {
          outliers.push({ 
            row: index + 2, 
            originalValue: value, 
            correctedValue: value < lowerBound ? lowerBound : upperBound,
            bounds: { lower: lowerBound, upper: upperBound }, 
            column,
            method: `Winsorization (${percentile}%)`
          });
          return { ...row, [column]: value < lowerBound ? lowerBound : upperBound };
        }
      }
      return row;
    });
    
    return { outliers, cleanedData };
  }
};

// NG: Route to detect outliers in all numeric columns
app.post("/detect-outliers", upload.single("uploadedFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
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

      // Convert to object format
      let parsedRows = rows.map((rowArr) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = rowArr[index];
        });
        return obj;
      });

      // Identify numeric columns
      const numericColumns = headers.filter(header => {
        const sampleValues = parsedRows.slice(0, 10).map(row => row[header]);
        const numericCount = sampleValues.filter(val => {
          const num = parseFloat(val);
          return !isNaN(num) && val !== null && val !== undefined && val !== '';
        }).length;
        return numericCount >= 3; // Consider column numeric if at least 3 of first 10 values are numeric
      });

      // Detect outliers in each numeric column using IQR method (most robust)
      const outlierResults = {};
      numericColumns.forEach(column => {
        const values = parsedRows.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        if (values.length < 3) return; // Skip columns with too few numeric values

        // Use IQR method for initial detection
        const iqrResult = outlierStrategies.iqr(parsedRows, column);
        
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

      res.json({
        fileName: req.file.originalname,
        numericColumns,
        outlierResults,
        totalOutliers: Object.values(outlierResults).reduce((sum, col) => sum + col.outliers.length, 0)
      });
    });
});

// NG: Route to detect outliers in a specific column
app.post("/detect-outliers-column", upload.single("uploadedFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

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

      let parsedRows = rows.map((rowArr) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = rowArr[index];
        });
        return obj;
      });

      // Check if column exists
      if (!headers.includes(column)) {
        return res.status(400).json({ error: `Column "${column}" not found in CSV` });
      }

      // Check if column is numeric
      const values = parsedRows.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
      if (values.length < 3) {
        return res.status(400).json({ error: `Column "${column}" doesn't have enough numeric values for outlier detection` });
      }

      // Detect outliers using all methods
      const zScoreResult = outlierStrategies.zScore(parsedRows, column);
      const iqrResult = outlierStrategies.iqr(parsedRows, column);
      const winsorizeResult = outlierStrategies.winsorize(parsedRows, column);

      res.json({
        fileName: req.file.originalname,
        column,
        results: {
          zScore: zScoreResult,
          iqr: iqrResult,
          winsorize: winsorizeResult
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

// NG: Route to apply outlier treatment
app.post("/apply-outlier-treatment", upload.single("uploadedFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

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

      let parsedRows = rows.map((rowArr) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = rowArr[index];
        });
        return obj;
      });

      // Apply the selected strategy
      let result;
      if (strategy === 'winsorize') {
        result = outlierStrategies.winsorize(parsedRows, column, parameters.percentile || 5);
      } else if (strategy === 'zScore') {
        result = outlierStrategies.zScore(parsedRows, column, parameters.threshold || 2.5);
      } else if (strategy === 'iqr') {
        result = outlierStrategies.iqr(parsedRows, column);
      } else {
        return res.status(400).json({ error: "Invalid strategy" });
      }

      res.json({
        fileName: req.file.originalname,
        column,
        strategy: result.outliers[0]?.method || strategy,
        outliersDetected: result.outliers.length,
        outliers: result.outliers,
        cleanedData: result.cleanedData,
        originalHeaders: headers
      });
    });
});


app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
});