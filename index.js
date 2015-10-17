/* global Buffer */
var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var broadcastAddress = "255.255.255.255";
var deviceBroadcastPort = 39169;

var commands = {
	deviceDescovery: 0xA5,
	setSound: 0x96,
	dataReceived1: 0xC1,
	dataReceived2: 0xD1,
	reply: 0x69,
	writeCardSuspected: 0x5A,
	updateReader: 0xF0,
	deviceDiscovery: 0xF1,
	deviceBooted: 0xF2,
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

function updateReaderCommand(serviceIpAddress, serviceSubnetMask, serviceRemoteId, deviceNumber, devicSerial, beepOnCard) {
	var command = new Buffer(20);
	command[0] = commands.updateReader;
	writeIpAddress(serviceIpAddress, command, 1);
	writeIpAddress(serviceSubnetMask, command, 5);
	writeIpAddress(serviceRemoteId, command, 9);
	command.writeUInt16LE(deviceNumber, 13);
	writeDeviceSerial(devicSerial, command, 15);
	command[19] = beepOnCard ? 1 : 0;
	return command;
}

function writeIpAddress(ipAddress, msg, offset, separator) {
	separator = separator || ".";
	var data = ipAddress.split(separator);
	msg[offset] = parseInt(data[0]);
	msg[offset + 1] = parseInt(data[1]);
	msg[offset + 2] = parseInt(data[2]);
	msg[offset + 3] = parseInt(data[3]);
}

function writeDeviceSerial(ipAddress, msg, offset, separator) {
	separator = separator || "-";
	var data = ipAddress.split(separator);
	msg[offset] = parseInt(data[0]);
	msg[offset + 1] = parseInt(data[1]);
	msg[offset + 2] = parseInt(data[2]);
	msg[offset + 3] = parseInt(data[3]);
}

function readIpAddress(msg, offset, separator) {
	separator = separator || ".";
	return msg[offset].toString() + separator
		 + msg[offset + 1].toString() + separator
		 + msg[offset + 2].toString() + separator
		 + msg[offset + 3].toString();
}

function readDeviceSerial(msg, offset, separator) {
	separator = separator || "-";
	return msg[offset].toString() + separator
		 + msg[offset + 1].toString() + separator
		 + msg[offset + 2].toString() + separator
		 + msg[offset + 3].toString();
}

function decodeCardMessage(msg) {
	var readerIpAddressString = readIpAddress(msg, 1);
	var deviceNumber = msg.readUInt16LE(5);
	var packetNumber = msg.readUInt16LE(7);
	
	var cardNumber = msg.readUInt32LE(9);
	var cardNumberString = "000000000" + cardNumber;
	cardNumberString = cardNumberString.substr(cardNumberString.length - 10, 10);

	return {
		readerIpAddress: readerIpAddressString,
		deviceNumber: deviceNumber,
		packetNumber: packetNumber,
		cardNumber: cardNumberString
	};
}

function createReply(msg) {
	var reply = new Buffer(9);
	reply[0] = commands.reply;
	for (var i = 1; i < 9; i++)
	{
		reply[i] = msg[i];
	}
	
	return reply;
}

function decodeRegisterDeviceMessage(msg) {
	
	var readerIpAddressString = readIpAddress(msg, 1);
	var readerIpAddressMaskString = readIpAddress(msg, 5);
	var readerIpAddressGatewayString = readIpAddress(msg, 9);
	var deviceNumber = msg.readUInt16LE(13);
	var deviceSerial = readDeviceSerial(msg, 15, "-");

	return {
		readerIpAddress: readerIpAddressString,
		readerIpAddressMask: readerIpAddressMaskString,
		readerIpAddressGateway: readerIpAddressGatewayString,
		deviceNumber: deviceNumber,
		deviceSerial: deviceSerial,
	}
}

module.exports = {
	commands: commands,
	createReply: createReply,
	createDiscoveryCommand: createDiscoveryCommand,
	soundType: soundType,
	setSoundCommand: setSoundCommand,
	updateReaderCommand: updateReaderCommand,
};
