'use strict';
var definitions = require('d3media-um-definitions').definitions,
    base64url = require('base64-url'),
    hashFunctions = require('./hash-functions'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    base64Escape = base64url.escape;

function sign(algo, format, secret, input) {
    var result;
    if (format === 'base64url') {
        result = crypto.createHmac(algo, secret).update(input).digest('base64');
        return base64Escape(result);
    }
    throw new Error('format ' + format + ' not supported');
}

exports = module.exports = function (secret) {
    var v1 = definitions.v1;
    var algo = v1.algorithm.replace(/\-/g, '');
    return Object.keys(v1.hashes).reduce(function (lib, hash) {
        var fn = hashFunctions.v1[hash];
        lib[hash] = function () {
            var hashedValue = base64Escape(fn.apply(null, arguments));
            var query = {},
                url;
            query[v1.hashes[hash].querystring] = hashedValue;
            query.ts = Math.floor(Date.now() / 1000);
            url = '/t?' + querystring.stringify(query);
            return url + '&sig=' + sign(algo, v1.format, secret, url);
        };
        return lib;
    }, {});
};
