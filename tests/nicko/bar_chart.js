// Bar Chart Example - Comparing Groups

// Sample data - comparing values across different groups
const groups = ['Group A', 'Group B', 'Group C', 'Group D'];
const values = [23.5, 31.2, 18.7, 27.9];

const trace = {
  x: groups,
  y: values,
  type: 'bar',
  marker: {
    color: ['rgb(31, 119, 180)', 'rgb(255, 127, 14)', 'rgb(44, 160, 44)', 'rgb(214, 39, 40)']
  }
};

const layout = {
  title: 'Bar Chart - Group Comparison',
  xaxis: { title: 'Groups' },
  yaxis: { title: 'Mean Value' },
  showlegend: false
};

Plotly.newPlot('chart', [trace], layout);