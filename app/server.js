let express = require("express");
let multer = require("multer");
let app = express();
let port = 3000;
let hostname = "localhost";
let path = require("path");
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

app.post("/upload", upload.single("uploadedFile"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    console.log("Uploaded file:", req.file.originalname);
    res.status(200).send("File uploaded successfully");
})

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
