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

//var deviceIpMask = "255.255.255.0";
var deviceIpMask = "255.255.240.0";
//var deviceMask = "255.255.254.0";
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
},
// 01
{
	ip: "10.240.66.10",
	gateway: "10.240.66.1",
	serial: "193-1-110-217"
},
// 02
{
	ip: "10.240.66.11",
	gateway: "10.240.66.1",
	serial: "141-1-33-145"
},
// 03
{
	ip: "10.240.66.12",
	gateway: "10.240.66.1",
	serial: "193-1-110-141"
},
// 04
{
	ip: "10.240.66.13",
	gateway: "10.240.66.1",
	serial: "144-1-31-91"
},
// 05
{
	ip: "10.240.66.14",
	gateway: "10.240.66.1",
	serial: "144-1-31-84"
},
// 06
{
	ip: "10.240.66.15",
	gateway: "10.240.66.1",
	serial: "144-1-31-119"
},
// 07
{
	ip: "10.240.66.16",
	gateway: "10.240.66.1",
	serial: "152-1-34-192"
},
// 08
{
	ip: "10.240.66.17",
	gateway: "10.240.66.1",
	serial: "193-1-110-184"
},
// 09
{
	ip: "10.240.66.18",
	gateway: "10.240.66.1",
	serial: "172-1-115-52"
},
// 10
{
	ip: "10.240.66.19",
	gateway: "10.240.66.1",
	serial: "146-1-34-58"
},
// 11
{
	ip: "10.240.66.20",
	gateway: "10.240.66.1",
	serial: "172-1-115-88"
},
// 12
{
	ip: "10.240.66.21",
	gateway: "10.240.66.1",
	serial: "141-1-33-202"
},
// 13
{
	ip: "10.240.66.22",
	gateway: "10.240.66.1",
	serial: "199-1-112-40"
},
// 14
{
	ip: "10.240.66.23",
	gateway: "10.240.66.1",
	serial: "144-1-31-95"
}
];

client.on("listening", function () {
	var address = client.address();
  	console.log("Server listening " + address.address + ":" + address.port);
	console.log("Start listening.")
    client.setBroadcast(true);
	var setSound = rfidReader.setSoundCommand(0, rfidReader.soundType.shortBeepOnce);
	client.send(setSound, 0, setSound.length, deviceBroadcastPort, broadcastAddress, failOnError);
	var deviceData = data[10];
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
	address: "169.254.167.154"
});
