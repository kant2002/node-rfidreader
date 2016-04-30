var lib = require('..');
var assert = require('assert');
    
var decodeCardMessage = lib.decodeCardMessage;

describe('Decoding messages', function() {
  describe('decodeCardMessage()', function () {
    it('Should decode message', function () {
        var encodedMessage = new Buffer([193,10,240,66,20,0,0,71,6,0,96,47,203,36]);
        var decodedMessage = decodeCardMessage(encodedMessage);
        assert.equal("10.240.66.20", decodedMessage.readerIpAddress);
        assert.equal(0, decodedMessage.deviceNumber);
        assert.equal(1607, decodedMessage.packetNumber);
        assert.equal("0617295712", decodedMessage.cardNumber);
    });
  });
});
