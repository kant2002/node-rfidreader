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

var deviceIpMask = "255.255.255.0";
var data = [
{
	ip: "192.168.1.218",
	gateway: "192.168.1.108",
	serial: "144-1-31-95"
},
{
	ip: "192.168.1.217",
	gateway: "192.168.1.108",
	serial: "199-1-112-40"
}
];

client.on("listening", function () {
	var address = client.address();
  	console.log("Server listening " + address.address + ":" + address.port);
	console.log("Start listening.")
    client.setBroadcast(true);
	var setSound = rfidReader.setSoundCommand(0, rfidReader.soundType.shortBeepOnce);
	client.send(setSound, 0, setSound.length, deviceBroadcastPort, broadcastAddress, failOnError);
	var deviceData = data[1];
	var updateReaderCommand = rfidReader.updateReaderCommand(deviceData.ip, deviceIpMask, deviceData.gateway, 0, deviceData.serial, 1);
	client.send(updateReaderCommand, 0, updateReaderCommand.length, deviceBroadcastPort, broadcastAddress, function (err) {
		console.log(arguments);
		if (err) {
			throw err;
		}
		
		var setSound = rfidReader.setSoundCommand(0, rfidReader.soundType.shortBeepOnce);
		client.send(setSound, 0, setSound.length, deviceBroadcastPort, broadcastAddress, failOnError);
	});
});

client.bind({
	port: deviceBroadcastPort,
	//address: "169.254.167.154"
});
