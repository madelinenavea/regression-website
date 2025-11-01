// Linear Regression Plot Example

// Sample data points
const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y = [2.3, 4.1, 5.8, 7.2, 9.5, 11.1, 13.4, 15.2, 17.1, 19.3];

// Calculate simple linear regression
function linearRegression(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

const { slope, intercept } = linearRegression(x, y);
const regressionLine = x.map(xi => slope * xi + intercept);

// Scatter trace
const scatterTrace = {
  x: x,
  y: y,
  mode: 'markers',
  type: 'scatter',
  name: 'Data Points',
  marker: { size: 10, color: 'rgb(31, 119, 180)' }
};

// Regression line trace
const lineTrace = {
  x: x,
  y: regressionLine,
  mode: 'lines',
  type: 'scatter',
  name: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
  line: { color: 'rgb(255, 127, 14)', width: 2 }
};

const layout = {
  title: 'Linear Regression Plot',
  xaxis: { title: 'X Variable' },
  yaxis: { title: 'Y Variable' },
  hovermode: 'closest'
};

Plotly.newPlot('chart', [scatterTrace, lineTrace], layout);