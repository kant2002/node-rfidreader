/* global Buffer */
var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var rfidReader = require("./index.js");
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
	var setSound = rfidReader.setSoundCommand(0, rfidReader.soundType.shortBeepOnce);
	client.send(setSound, 0, setSound.length, deviceBroadcastPort, broadcastAddress, failOnError);
	var message = rfidReader.createDiscoveryCommand();
	client.send(message, 0, message.length, deviceBroadcastPort, broadcastAddress, failOnError);	
	client.on("message", function (msg, rinfo) {
		var magicByte = msg[0];
		if (magicByte === rfidReader.commands.dataReceived1 || magicByte == rfidReader.commands.dataReceived2)
		{
			rfidReader.processBindingData(msg);
		} else if (magicByte == rfidReader.commands.deviceDiscovery) {
			rfidReader.registerDevice(msg);
		} else {
			console.log("Server got: " + JSON.stringify(msg.toJSON()) + " from " + rinfo.address + ":" + rinfo.port);
		}		
	});
});

client.bind({
	port: deviceBroadcastPort,
	address: "169.254.167.154"
});
