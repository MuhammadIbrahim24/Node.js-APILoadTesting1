var rp = require('request-promise');

const URL1 = //URL of API;

const BODY1 = //Body of request containing contract to deploy;

const BODY2 = //Body of request to get data from deployed contract;


const NUMBER_OF_REQUEST = //No of requests to send each minute;
const TOTAL_REQUESTS_TIME = //Total No. of requests / No of requests to send each minute;
var index = 0;    //to count total number of requests
var arr = [];    //to store received contract addressses

var options1 = {    //for deploy request
    method: 'POST',

	uri: URL1,

	body: BODY1,

	json: true // Automatically stringifies the body to JSON

};

const initial = Date.now();    //script start time

function deploy(count) {
	if(count > TOTAL_REQUESTS_TIME) {    //if 10000 requests have been issued, end script
		const fin = Date.now();    //script end time
		console.log(initial);    //print script start time
		console.log(fin);    //print script end time
		console.log('Total Time elapsed:'+ (fin - initial));    //Print script elapsed time
		return;
	}
	const start = Date.now();    //function start time
	arr = [];    //Empty the array 
	var promises = [];    //to store request promises
	var j = 0;    //count of current iterations
	
	for (var i = 0; i < NUMBER_OF_REQUEST; i++) {

		const before = Date.now();     //start time of current request

		promises.push(rp(options1).then(function (parsedBody) {    //make request and push promise in array

			const after = Date.now();    //request completion time
			const difference = after - before;    //request execution time
			
			console.log(j++);
			console.log(index++);
			console.log("Execution Time",difference/1000,"s");

			console.log(parsedBody);
			
			arr.push(parsedBody.receipt.contractAddress);    //push received contract address in array


			var fs = require('fs');  //write values to csv file
			var csvWriter = require('csv-write-stream');
			var writer = csvWriter({sendHeaders: false});
			writer.pipe(fs.createWriteStream('out_deploy.csv', {flags: 'a'}));    //append the file
			writer.write({Index: index, Iteration_Index: j, Before_Time: before, After_Time: after, Execution_Time: (after-before)/1000});
			writer.end();

		}).catch(function (err) {

			console.log(err);
		}));

	};
	
	Promise.all(promises).then(function() {    //if all promises resolved then
		
		if((40000-(Date.now()-start) > 2))    //if current minute is not finished then wait
			setTimeout(function() {readVariable(++count);},40000-(Date.now()-start));
		else    //call read variable function for second request
			readVariable(++count);
	}).catch(function (err) {

			console.log(err);
	});
}

function readVariable(count) {
	promises = [];    //empty array
	var j = 0;    //for iteration count
	const NO_OF_REQUEST = arr.length;    //set no of requests equal to the successful requests of previous function
	console.log(NO_OF_REQUEST);
	const start = Date.now();    //function start time
	
	var options2 = {
		method: 'POST',

		uri: 'http://104.211.189.150:8080/contract/'+arr.pop()+'/get/owner',

		body: BODY2,

		json: true // Automatically stringifies the body to JSON

	};
	
	for (var i = 0; i < NO_OF_REQUEST; i++) {
		
		const before = Date.now();    //request initiate time

		promises.push(rp(options2).then(function (parsedBody) {  //make request and push promise

			const after = Date.now();    //request complete time
			const difference = after - before;    //execution time

			console.log(j++);
			console.log(index++);
			console.log("Execution Time",difference/1000,"s");

			console.log(parsedBody);


			var fs = require('fs');    //write values to csv file
			var csvWriter = require('csv-write-stream');
			var writer = csvWriter({sendHeaders: false});
			writer.pipe(fs.createWriteStream('out_read.csv', {flags: 'a'}));    //append flag
			writer.write({Index: index, Iteration_Index: j, Before_Time: before, After_Time: after, Execution_Time: (after-before)/1000});
			writer.end();

		}).catch(function (err) {

			console.log(err);
		}));

	};
	
	Promise.all(promises).then(function() {    //if all promises resolved then
	
		if((40000-(Date.now()-start) > 2))    //if current minute is not finished then wait
			setTimeout(function() {deploy(++count);},40000-(Date.now()-start));
		else
			deploy(++count);
	}).catch(function (err) {
			console.log(err);
		});
	
}

deploy(1);    //initiate the recursive functions

