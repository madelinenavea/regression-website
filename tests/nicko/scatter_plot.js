// Scatter Plot Example

// Sample data
const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y = [2.3, 4.1, 5.8, 7.2, 9.5, 11.1, 13.4, 15.2, 17.1, 19.3];

const trace = {
  x: x,
  y: y,
  mode: 'markers',
  type: 'scatter',
  name: 'Data Points',
  marker: {
    size: 10,
    color: 'rgb(31, 119, 180)'
  }
};

const layout = {
  title: 'Scatter Plot Example',
  xaxis: { title: 'X Variable' },
  yaxis: { title: 'Y Variable' },
  hovermode: 'closest'
};

Plotly.newPlot('chart', [trace], layout);