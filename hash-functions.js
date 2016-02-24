'use strict';
var definitions = require('d3media-um-definitions'),
    v1fn = definitions.v1,
    crypto = require('crypto');

function createHasher(version) {
    var algo = version.algorithm.replace(/\-/g, ''),
        format = version.format;
    return function (input) {
        var hash;
        if (!input) {
            throw new Error('Input can not be null');
        }
        hash = crypto.createHash(algo);
        hash.update(input);
        if (format === 'base64url') {
            return hash.digest('base64');
        }
        throw new Error('format ' + format + ' not supported');

    };
}

function makeHashFunction(type) {
    return function (input) {
        if (!input) {
            throw new Error(type.name + ' is mandatory');
        }
        return type.map.reduce(function (acc, fn) {
            return v1fn[fn](acc);
        }, input);
    };
}

function makeComplexHashFunction(hashType, separator) {
    var fn = [];
    hashType.complex.forEach(function (x) {
        fn.push(makeHashFunction(hashType.complex[x]));
    });

    return function () {
        return fn.reduce(function (acc, currFn, index) {
            acc.push(currFn(arguments[index]));
            return acc;
        }, []).join(separator);
    };
}

function makeVersion(prefix, definitions) {
    exports[prefix] = {};
    Object.keys(definitions.hashes).forEach(function (hashType) {
        var def = definitions.hashes[hashType];
        if (!def.complex) {
            exports[prefix][hashType] = (function () {
                var format = makeHashFunction(def);
                var hasher = createHasher(definitions);
                return function (input) {
                    return hasher(format(input));
                };
            })();
            return;
        }
        exports[prefix][hashType] = makeComplexHashFunction(def, definitions);
    });
}
makeVersion('v1', definitions.definitions.v1);
