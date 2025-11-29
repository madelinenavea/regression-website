function countCategories(arr) {
    const counts = {};
    arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
    return counts;
}

let column_selector = document.getElementById("column-name");
let auto_bar_plot_button = document.getElementById("auto-bar-plot-button");

//Inbuilt plotly function that parses csv's
Plotly.d3.csv(data_file, function(err, rows) {
	if (err) {
		console.error("Error loading CSV:", err); 
		return;
	}

	let columns = Object.keys(rows[0]);
	console.log("Columns:", columns);

	columns.forEach(col => {
		const xOpt = document.createElement("option");
		xOpt.text = col;
		xOpt.value = col;
		column_selector.add(xOpt);
	});
});


auto_bar_plot_button.addEventListener('click', () => {
	let col_name = column_selector.value;

	Plotly.d3.csv(data_file, function(err, rows) {
		if (err) {
			console.error("Error loading csv: ", err);
			return;
		}

		let all_choices = rows.map(r => +r[col_name]);

		let counts = countCategories(all_choices);
		let categories = Object.keys(counts);
		let values = Object.values(counts);

		var record = [{
			x: categories,
			y: values,
			type: 'bar',
		}];

		let layout = {barmode: 'group'};

		Plotly.newPlot('auto-bar', record)
	})
})

fetch("/data/user_files.json")
  .then(response => response.json())  // automatically parses JSON
  .then(data => {
    console.log(data);
  });