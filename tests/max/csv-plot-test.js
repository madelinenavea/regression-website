let x_dropdown = document.getElementById("x-axis");
let y_dropdown = document.getElementById("y-axis");

Plotly.d3.csv("../../data/Salary_dataset.csv", function(err, rows) {
  if (err) {
    console.error("Error loading CSV:", err);
    return;
  }

  const columns = Object.keys(rows[0]);
  console.log("Columns:", columns);

  columns.forEach(col => {
    const xOpt = document.createElement("xOpt");
    xOpt.text = col;
    xOpt.value = col;
    x_dropdown.add(option);

    const yOpt = document.createElement("yOpt");
    yOpt.text = col;
    yOpt.value = col;
    y_dropdown.add(yOpt);
  });
});

    
              
