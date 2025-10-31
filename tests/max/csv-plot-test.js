let x_dropdown = document.getElementById("x-axis");
let y_dropdown = document.getElementById("y-axis");
let csv_plot_button = document.getElementById("csv-plot-button");

//Inbuilt plotly function that parses csv's
Plotly.d3.csv("../../data/Salary_dataset.csv", function(err, rows) {
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
  Plotly.d3.csv("../../data/Salary_dataset.csv", function(err, rows) {
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

    Plotly.newPlot("csv-plot-tester", [trace], layout);

    plotBestFitLine(x, y, 'csv-plot-tester', 'best fit line');
    
  });
});

    
              
