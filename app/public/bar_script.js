let categories = ['giraffes', 'monkeys', 'tigers'];
let pop1 = [9, 20, 5];
let pop2 = [5, 15, 3];

var record1 = [
	{
		x: categories,
		y: pop1,
		type: 'bar',
		name: '2015'
	}
];

var record2 = [
        {
                x: categories,
                y: pop2,
                type: 'bar',
		name: '2025'
        }
];

let comp = [record1, record2];

let layout = {barmode: 'group'};


Plotly.newPlot('bar-tester', record1);
Plotly.plot('bar-tester', record2);

