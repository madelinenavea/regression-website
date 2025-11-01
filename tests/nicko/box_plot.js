// Box Plot Example - Distribution Comparison

// Generate sample data for multiple groups
function generateData(mean, stdDev, size) {
  const data = [];
  for (let i = 0; i < size; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    data.push(mean + z * stdDev);
  }
  return data;
}

const groupA = generateData(50, 8, 100);
const groupB = generateData(55, 12, 100);
const groupC = generateData(48, 6, 100);

const traces = [
  {
    y: groupA,
    type: 'box',
    name: 'Group A',
    marker: { color: 'rgb(31, 119, 180)' }
  },
  {
    y: groupB,
    type: 'box',
    name: 'Group B',
    marker: { color: 'rgb(255, 127, 14)' }
  },
  {
    y: groupC,
    type: 'box',
    name: 'Group C',
    marker: { color: 'rgb(44, 160, 44)' }
  }
];

const layout = {
  title: 'Box Plot - Distribution Comparison',
  yaxis: { title: 'Value' },
  showlegend: true
};

Plotly.newPlot('chart', traces, layout);