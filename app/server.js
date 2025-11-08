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

    // NG: Create a stream to read the uploaded file efficiently (handles large files without loading entire file into memory)
    fs.createReadStream(req.file.path)
        // NG: Pipe the file stream through the CSV parser, treating first row as column headers
        .pipe(csv.parse({ headers: true }))
        
        // NG - Error handling: if CSV parsing fails, send error response to client
        .on("error", (error) => {
            console.error(error);
            res.status(500).json({ error: "Error reading CSV" });
        })
        
        // NG - Event: Capture column headers when they are parsed from the first row
        .on("headers", (parsedHeaders) => {
            headers = parsedHeaders;
        })
        
        // NG - Event: For each data row parsed, add it to the rows array
        .on("data", (row) => rows.push(row))
        
        // NG - Event: When CSV parsing is complete, process the data and send analysis results
        .on("end", () => {
            // NG - Clean up: Delete the uploaded temporary file to free disk space
            fs.unlinkSync(req.file.path);

            // NG - Validation: Check if CSV contains any data rows (not just headers)
            if (rows.length === 0) {
                return res.status(400).json({ error: "Empty file or invalid CSV format" });
            }

            // NG: Initialize data structures for analysis
            let missingLocations = [];  
            let seenRows = new Map();   
            let duplicateRows = new Set(); 

            // NG - PHASE 1: MISSING DATA DETECTION
            // NG: Iterate through each row and each column to find empty cells
            rows.forEach((row, i) => {
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
            rows.forEach((row, i) => {
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
                totalRows: rows.length,           
                totalColumns: headers.length,     
                headers: headers,                 
                
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
                    errorCount: missingLocations.length + duplicateRows.size          
                }
            });
        });
});


app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
});