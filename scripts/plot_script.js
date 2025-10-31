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

	let maxX = Math.max(x);
	let minX = Math.min(x);
	console.log(maxX, minX, x, y, meanOfX, meanOfY, slope, yInt);

	const bestFitLine = [{
		x: [0, Math.max(x)],
		y: [slope*0 + yInt, slope*(Math.max(x)) + yInt],
		type: 'scatter',
		name: name
	}];
	Plotly.plot(divName, bestFitLine);
}

let xdata = [1, 2, 3, 3, 4, 6, 5, 7, 8, 8, 9, 10, 10, 12, 11, 14, 13, 16, 14, 15,
	17, 16, 18, 20, 19, 19, 21, 22, 24, 23, 24, 25, 27, 28, 29, 30, 33, 33, 32, 31,
	34, 36, 37, 36, 38, 37, 39, 44, 41, 42, 42, 43, 44, 46, 45, 47, 48, 47, 49, 50,
	52, 51, 53, 44, 54, 55, 56, 57, 58, 59, 61, 60, 61, 62, 63, 64, 65, 66, 68, 69,
	70, 75, 71, 71, 73, 74, 76, 75, 77, 79];

let ydata = [2, 1, 3, 4, 5, 5, 8, 6, 9, 10,10, 12, 11, 14, 13, 15, 14, 17, 16, 18,
	20, 21, 19, 20, 22, 23, 25, 24, 26, 28, 28, 29, 31, 30, 34, 33, 31, 32, 36, 35,
	40, 39, 40, 42, 41, 44, 43, 45, 46, 47, 48, 49, 50, 51, 50, 52, 54, 55, 53, 57,
	58, 60, 59, 61, 62, 63, 64, 65, 30, 66, 68, 70, 72, 71, 73, 74, 76, 78, 79, 80,
	81, 83, 90, 76, 87, 88, 83, 84, 81, 91];

console.log(xdata.length, ydata.length);

// let meanX = mean(xdata);
// let meanY = mean(ydata);
// let m = covariance(xdata, ydata, meanX, meanY) / variance(xdata, meanX);
// let b = meanY - m * meanX;

const data = [{
	x: xdata,
	y: ydata,
	type: 'scatter',
	visible: true,
	mode: "markers",
	name: 'male'
}];

// console.log(meanX);
// console.log(meanY);
// console.log("Covariance: " + covariance(xdata, ydata, meanX, meanY));
// console.log("Slope " + m);
// console.log(b);

// const bestFitLine = [{
// 	x: [0, 90],
// 	y: [m*0 + b, m*90 + b],
// 	type: 'scatter',
// 	name: "Best Fit Line"
// }];

Plotly.newPlot('plot-tester', data);
plotBestFitLine(xdata, ydata, 'plot-tester', 'best fit line');

