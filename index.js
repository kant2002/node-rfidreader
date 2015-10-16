/* global Buffer */
var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var broadcastAddress = "255.255.255.255";
var deviceBroadcastPort = 39169;
client.on("error", function (err) {
  console.log("server error:\n" + err.stack);
  client.close();
});

var commands = {
	deviceDescovery: 0xA5,
	setSound: 0x96,
	dataReceived1: 0xC1,
	dataReceived2: 0xD1,
	reply: 0x69,
	deviceDiscovery: 0xF1
}

var soundType = {
	shortBeepOnce: 0,
	shortBeepTwice: 1,
	shortBeepTriple: 2,
	longBeepOnce: 3,
	longBeepTwice: 4,
	longBeepTriple: 5,
};

function createDiscoveryCommand() {
	return new Buffer([commands.deviceDescovery]);
}

function setSoundCommand(param1, param2) {
	if (param1 < 0 && param1 > 65535) {
		throw new Error("param2 should be within 0 to 65535 range");
	}
	
	if (param2 < 0 && param2 > 255) {
		throw new Error("param2 should be within 0 to 255 range");
	}
	
	var command = new Buffer(4);
	command[0] = commands.setSound;
	command.writeUInt16LE(param1, 1);
	command[3] = param2;
	return command;
}

function failOnError(err) {
	if (err) {
		throw err;
	}	
}

client.on("listening", function () {
	var address = client.address();
  	console.log("server listening " + address.address + ":" + address.port);
	console.log("Start listening.")
    client.setBroadcast(true);
	var setSound = setSoundCommand(0, soundType.shortBeepOnce);
	client.send(setSound, 0, setSound.length, deviceBroadcastPort, broadcastAddress, failOnError);
	var message = createDiscoveryCommand();
	client.send(message, 0, message.length, deviceBroadcastPort, broadcastAddress, failOnError);	
	client.on("message", function (msg, rinfo) {
		var magicByte = msg[0];
		if (magicByte === commands.dataReceived1 || magicByte == commands.dataReceived2)
		{
			processBindingData(msg);
		} else if (magicByte == commands.deviceDiscovery) {
			registerDevice(msg);
		} else {
			console.log("Server got: " + JSON.stringify(msg.toJSON()) + " from " + rinfo.address + ":" + rinfo.port);
		}		
	});
});

function readIpAddress(msg, offset, separator) {
	separator = separator || ".";
	return msg[offset].toString() + separator
		 + msg[offset + 1].toString() + separator
		 + msg[offset + 2].toString() + separator
		 + msg[offset + 3].toString();
}

function readDeviceNumber(msg, offset, separator) {
	separator = separator || "-";
	return msg[offset].toString() + separator
		 + msg[offset + 1].toString() + separator
		 + msg[offset + 2].toString() + separator
		 + msg[offset + 3].toString();
}

function processBindingData(msg) {
	var reply = new Buffer(9);
	reply[0] = commands.reply;
	for (var i = 1; i < 9; i++)
	{
		reply[i] = msg[i];
	}
	
	var readerIpAddressString = readIpAddress(msg, 1);
	console.log("Reader IP string", readerIpAddressString);

	console.log("Send reply", reply);
	//client.setBroadcast(false);
	client.send(reply, 0, reply.length, deviceBroadcastPort, readerIpAddressString, function(err, bytes) {
		client.setBroadcast(true);
		var jihaostr = msg.readUInt16LE(5);
		var packetNumber = msg.readUInt16LE(7);
		console.log("jihao", jihaostr);
		console.log("Packet No:", packetNumber);
		
		var cardNumber = msg.readUInt32LE(9);
		var cardNumberString = "000000000" + cardNumber;
		cardNumberString = cardNumberString.substr(cardNumberString.length - 10, 10);
		console.log("Card Number", cardNumberString);
	});
}

function registerDevice(msg) {
	var readerIpAddressString = readIpAddress(msg, 1);
	var readerIpAddressMaskString = readIpAddress(msg, 5);
	var readerIpAddressGatewayString = readIpAddress(msg, 9);
	console.log("Reader IP address:", readerIpAddressString);
	console.log("Reader IP mask:", readerIpAddressMaskString);
	console.log("Reader IP gateway:", readerIpAddressGatewayString);
	var jihaostr = msg.readUInt16LE(13);
	var deviceNumber = readDeviceNumber(msg, 15, "-");
	console.log("jihao", jihaostr);
	console.log("Device No:", deviceNumber);
}

client.bind({
	port: deviceBroadcastPort,
	address: "169.254.167.154"
});
