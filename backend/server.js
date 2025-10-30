let axios = require("axios");
let express = require("express");
let app = express();
let port = 3000;
let hostname = "localhost";
let path = require("path");
app.use(express.static("public"));

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
        res.sendFile(path.join(__dirname, 'public', 'bar_script.js'));
        console.log("Sent tab Script");
});




app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});

