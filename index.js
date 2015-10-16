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
	unknown1: 0xF1
}

var soundType = {
	shortBeepOnce: 0,
	shortBeepTwice: 1,
	shortBeepTriple: 2,
	longBeepOnce: 3,
	longBeepTwice: 4,
	longBeepTriple: 4,
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

client.on("listening", function () {
	var address = client.address();
  	console.log("server listening " + address.address + ":" + address.port);
	console.log("Start listening.")
    client.setBroadcast(true);
	var setSound = setSoundCommand(0, soundType.shortBeepOnce);
	console.log(setSound);
	client.send(setSound, 0, setSound.length, deviceBroadcastPort, "255.255.255.255", function(err, bytes) {
		if (err) {
			throw err;
		}

		console.log("From set sound", bytes.toString());
	});
	// client.on("")
    // client.send(message, 0, message.length, deviceBroadcastPort, broadcastAddress, function(err, bytes) {
    //     client.close();
    // });
	var message = createDiscoveryCommand();
	client.send(message, 0, message.length, deviceBroadcastPort, "255.255.255.255", function(err, bytes) {
        // client.close();
    });
	
	client.on("message", function (msg, rinfo) {
		var magicByte = msg[0];
		if (magicByte === commands.dataReceived1 || magicByte == commands.dataReceived2)
		{
			var reply = new Buffer(9);
			reply[0] = commands.reply;
			for (var i = 1; i < 9; i++)
			{
				reply[i] = msg[i];
			}
			
			var readerIpAddressString = msg[1].toString() + "." + msg[2].toString() + "." + msg[3].toString() + "." + msg[4].toString();
			console.log("Reader IP string", readerIpAddressString);

			console.log("Send reply", reply);
			client.setBroadcast(false);
			client.send(reply, 0, reply.length, deviceBroadcastPort, readerIpAddressString, function(err, bytes) {
				// client.close();
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
		
		console.log("server got: " + JSON.stringify(msg.toJSON()) + " from " + rinfo.address + ":" + rinfo.port);
	});
});

client.bind({
	port: deviceBroadcastPort,
	address: "169.254.167.154"
});
// client.setBroadcast(true);
// var message = new Buffer([]);
// client.send(message, 0, message.length, 41234, "192.168.1.255");

