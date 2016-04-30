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

function processBindingData(msg) {
	var reply = rfidReader.createReply(msg);	
	var messageData = rfidReader.decodeCardMessage(msg);
	console.log("Reader IP string", messageData.readerIpAddress);
	console.log("Device Number", messageData.deviceNumber);
	console.log("Packet No:", messageData.packetNumber);
	console.log("Card Number", messageData.cardNumber);

	console.log("Sending reply", reply);
	//client.setBroadcast(false);
	client.send(reply, 0, reply.length, deviceBroadcastPort, messageData.readerIpAddress, function(err, bytes) {
		//client.setBroadcast(true);
	});
}

function registerDevice(msg) {
	var messageData = rfidReader.decodeRegisterDeviceMessage(msg);
	console.log("Device discovered");
	console.log("Reader IP address:", messageData.readerIpAddress);
	console.log("Reader IP mask:", messageData.readerIpAddressMask);
	console.log("Reader IP gateway:", messageData.readerIpAddressGateway);
	console.log("Device Number", messageData.deviceNumber);
	console.log("Device Serial:", messageData.deviceSerial);
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
	var setSound = rfidReader.setSoundCommand(0, rfidReader.soundType.shortBeepOnce);
	client.send(setSound, 0, setSound.length, deviceBroadcastPort, broadcastAddress, failOnError);
	var message = rfidReader.createDiscoveryCommand();
	client.send(message, 0, message.length, deviceBroadcastPort, broadcastAddress, failOnError);	
	client.on("message", function (msg, rinfo) {
		var magicByte = msg[0];
		console.log("Server got: " + JSON.stringify(msg.toJSON()) + " from " + rinfo.address + ":" + rinfo.port);
		if (magicByte === rfidReader.commands.dataReceived1 || magicByte == rfidReader.commands.dataReceived2)
		{
			processBindingData(msg);
		} else if (magicByte == rfidReader.commands.deviceDiscovery) {
			registerDevice(msg);
		} else {
			console.log("Server got: " + JSON.stringify(msg.toJSON()) + " from " + rinfo.address + ":" + rinfo.port);
		}		
	});
});

client.bind({
	port: deviceBroadcastPort,
	address: process.argv.length > 2 ? process.argv[2] : "169.254.167.154"
});
