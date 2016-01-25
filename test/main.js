'use strict';
var assert = require('assert');
var secret = 'abc';
var api = require('..')(secret);
var base64url = require('base64-url');
var crypto = require('crypto');
var url = require('url');

function sign(input) {
    var hash = crypto.createHmac('sha256', secret).update(input).digest('base64');
    return base64url.escape(hash);
}

function hashAndEncode(input) {
    var algo = 'SHA256';
    var format = 'base64';
    var hash = crypto.createHash(algo);
    hash.update(input);
    return base64url.escape(hash.digest(format));
}

function unixTS() {
    return Math.floor(Date.now() / 1000);
}

function stripSignatureFromPath(path) {
    var ix = path.indexOf('&sig=');
    return path.slice(0, ix);
}
describe('d3media-um-lib', function () {
    describe('#email(input) returned URL', function () {
        var email = ' a@BC.de ';
        var now = unixTS();
        var apiURL = api.email(email);
        var parsed = url.parse(apiURL, true);
        var expected = hashAndEncode(email.trim().toLowerCase());
        it('should include a valid timestamp', function () {
            assert(parsed.query.ts <= now);
            assert(parsed.query.ts + 10 > now);
        });
        it('should include a properly formatted and hashed email', function () {
            assert.deepEqual(parsed.query.e, expected);
        });
        it('URL action and params should be signed', function () {
            var urlWithNoSignature = stripSignatureFromPath(apiURL);
            assert.deepEqual(sign(urlWithNoSignature), parsed.query.sig);

        });
    });
});
