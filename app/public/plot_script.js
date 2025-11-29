// Plotly.d3.csv(data_file, function(err, rows) {
// 	if (err) {
// 		console.error("Error loading CSV:", err);
// 		return;
// 	}

//   	const columns = Object.keys(rows[0]);

//   	columns.forEach(col => {
// 		x_dropdowns.forEach(drop => {
// 			let opt = document.createElement("option");
// 			opt.text = col;
// 			opt.value = col;
// 			drop.add(opt);
// 		});

// 		y_dropdowns.forEach(drop => {
// 			let opt = document.createElement("option");
// 			opt.text = col;
// 			opt.value = col;
// 			drop.add(opt);
// 		});
// 	});
// 	sharedSelection.x = columns[0];
//     sharedSelection.y = columns[0];
// });

let selectFile = document.getElementById('files');

function updateDropdowns() {
	let fileName = 	selectFile.value;

	if (!fileName) return;

	axios.get('file_columns', {
		params: {fileName}
	})
	.then(res => {
		let columns = res.data.columns;

		columns.forEach(col => {
			x_dropdowns.forEach(drop => {
				let opt = document.createElement("option");
				opt.text = col;
				opt.value = col;
				drop.add(opt);
			});

			y_dropdowns.forEach(drop => {
				let opt = document.createElement("option");
				opt.text = col;
				opt.value = col;
				drop.add(opt);
			});
		});

		sharedSelection.x = columns[0];
		sharedSelection.y = columns[0];
		console.log(sharedSelection.x, sharedSelection.y, 'no')
	})
	.catch(err => console.error("Error fetching columns:", err));
}

selectFile.addEventListener("select", () => {
	console.log("Selected");
	updateDropdowns();
});



function plotCSV(containerId) {
    let x_name = sharedSelection.x;
    let y_name = sharedSelection.y;

	console.log(x_name, y_name)
;
    Plotly.d3.csv(data_file, function(err, rows) {
        if (err) return console.error(err);

        const x = rows.map(r => parseFloat(r[x_name])).filter(v => !isNaN(v));
        const y = rows.map(r => parseFloat(r[y_name])).filter(v => !isNaN(v));

        const trace = { x, y, type: "scatter", mode: "markers" };
        const layout = { title: containerId, xaxis: {title: x_name}, yaxis: {title: y_name} };

        Plotly.newPlot(containerId, [trace], layout);

		if (containerId === "reg-plot") {
			plotBestFitLine(x, y, containerId, "best fit line");
		} else if (conteinerId === "bell-plot") {
			//TO-DO
			return;
		}
    });
}

// Use for reg-plot
document.getElementById("reg-plot-button").addEventListener("click", () => plotCSV("reg-plot"));

// Use for bell-plot
document.getElementById("bell-plot-button").addEventListener("click", () => plotCSV("bell-plot"));


    
              
