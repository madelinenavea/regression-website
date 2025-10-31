let csv-dropdown = document.getElementById("drop-down");

Plotly.d3.csv("../../data/Salary_dataset.csv", function(err, rows) {
  if (err) {
    console.error("Error loading CSV:", err);
    return;
  }

  const columns = Object.keys(rows[0]);
  console.log("Columns:", columns);

  columns.forEach(col => {
    const option = document.createElement("option");
    option.text = col;
    option.value = col;
    dropdown.add(yOpt);
  });
});

    
              
