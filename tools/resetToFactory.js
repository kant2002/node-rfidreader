/* global Buffer */
var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var rfidReader = require("../index.js");
var broadcastAddress = "255.255.255.255";
var deviceBroadcastPort = 39169;

function failOnError(err) {
	if (err) {
		throw err;
	}	
}

client.on("error", function (err) {
  console.log("Server error:\n" + err.stack);
  client.close();
});

client.on("listening", function () {
	var address = client.address();
  	console.log("Server listening " + address.address + ":" + address.port);
	console.log("Start listening.")
    client.setBroadcast(true);
	var resetToFactory = rfidReader.createResetToFactory();
	client.send(resetToFactory, 0, resetToFactory.length, deviceBroadcastPort, broadcastAddress, failOnError);
    console.log("Reset to factory, command send. Press Ctrl+C to terminate program.")
});

client.bind({
	port: deviceBroadcastPort,
	address: "169.254.167.154"
});
