// Histogram Example - Distribution of Data

// Generate sample data with normal distribution
function generateNormalData(mean, stdDev, size) {
  const data = [];
  for (let i = 0; i < size; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    data.push(mean + z * stdDev);
  }
  return data;
}

const data = generateNormalData(50, 10, 500);

const trace = {
  x: data,
  type: 'histogram',
  marker: {
    color: 'rgb(31, 119, 180)',
    line: {
      color: 'white',
      width: 1
    }
  },
  nbinsx: 30
};

const layout = {
  title: 'Histogram - Data Distribution',
  xaxis: { title: 'Value' },
  yaxis: { title: 'Frequency' },
  bargap: 0.05
};

Plotly.newPlot('chart', [trace], layout);