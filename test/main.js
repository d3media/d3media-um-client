'use strict';
var assert = require('assert'),
    secret = 'abc',
    api = require('..')(secret),
    base64url = require('base64-url'),
    crypto = require('crypto'),
    url = require('url');

function sign(input) {
    var hash = crypto.createHmac('sha256', secret).update(input).digest('base64');
    return base64url.escape(hash);
}

function hashAndEncode(input) {
    var algo = 'SHA256',
        format = 'base64',
        hash = crypto.createHash(algo);
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
    describe('#email(input)', function () {
        var email = ' a@BC.de ',
            now = unixTS(),
            apiURL = api.email(email),
            parsed = url.parse(apiURL, true),
            trimmedLoweredAndHashedEmail = hashAndEncode(email.trim().toLowerCase());
        describe('returned URL', function () {
            it('should include a valid timestamp', function () {
                assert(parsed.query.ts <= now);
                assert(parsed.query.ts + 10 > now);
            });
            describe('email ("e") parameter', function () {
                it('should include a properly formatted and hashed email', function () {
                    assert.deepEqual(parsed.query.e, trimmedLoweredAndHashedEmail);
                });
            });
            it('URL action and params should be signed', function () {
                var urlWithNoSignature = stripSignatureFromPath(apiURL);
                assert.deepEqual(sign(urlWithNoSignature), parsed.query.sig);

            });
            describe('pathname', function () {
                it('should be /t', function () {
                    assert.deepEqual(parsed.pathname, '/t');
                });
            });
        });
    });
});
