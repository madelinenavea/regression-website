const mean = (arr) => arr.reduce((a,b) => a+b, 0) / arr.length;
const variance = (arr, mean) => arr.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / arr.length;

function covariance(x, y, meanX, meanY) {
	let accumulator = 0;
	for (let i = 0; i < x.length; i++) {
		accumulator += (x[i] - meanX) * (y[i] - meanY);
	}
	return accumulator / x.length;
}

function plotBestFitLine(x, y, divName, name) {
	let meanOfX = mean(x);
	let meanOfY = mean(y);
	let slope = covariance(x, y, meanOfX, meanOfY) / variance(x, meanOfX);
	let yInt = meanOfY - slope * meanOfX;

	let maxX = Math.max(...x);
	let minX = Math.min(...x);
	console.log(maxX, minX, x, y, meanOfX, meanOfY, slope, yInt);

	const bestFitLine = [{
		x: [minX, maxX],
		y: [slope*minX + yInt, slope*maxX + yInt],
		type: 'scatter',
		name: name
	}];
	Plotly.plot(divName, bestFitLine);
}


let x_dropdown = document.getElementById("x-axis-plot");
let y_dropdown = document.getElementById("y-axis-plot");
let csv_plot_button = document.getElementById("plot-button");

let data_file = "/data/Walmart_Sales.csv";


//Inbuilt plotly function that parses csv's
Plotly.d3.csv(data_file, function(err, rows) {
  if (err) {
    console.error("Error loading CSV:", err); 
    return;
  }

  const columns = Object.keys(rows[0]);
  console.log("Columns:", columns);

  columns.forEach(col => {
    const xOpt = document.createElement("option");
    xOpt.text = col;
    xOpt.value = col;
    x_dropdown.add(xOpt);

    const yOpt = document.createElement("option");
    yOpt.text = col;
    yOpt.value = col;
    y_dropdown.add(yOpt);
  });
});

csv_plot_button.addEventListener('click', () => {
  let x_name = x_dropdown.value;
  let y_name = y_dropdown.value;

  //Inbuilt plotly function that parses csv's
  Plotly.d3.csv(data_file, function(err, rows) {
    if (err) {
      console.error("Error loading CSV:", err);
      return;
    }
    const x = rows.map(r => +r[x_name]);
    const y = rows.map(r => +r[y_name]);

    console.log("x:", x);
    console.log("y:", y);

    const trace = {
      x: x,
      y: y,
      type: "scatter",
      mode: "markers",
      marker: { color: "blue" }
    };
    const layout = {
      title: "My CSV Data Plot",
      xaxis: { title: x_name },
      yaxis: { title: y_name }
    };

    Plotly.newPlot("plot-panel", [trace], layout);

    plotBestFitLine(x, y, 'plot-panel', 'best fit line');
    
  });
});

    
              
