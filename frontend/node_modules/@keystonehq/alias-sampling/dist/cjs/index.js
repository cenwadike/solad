"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var precomputeAlias = function (p, n) {
    var sum = p.reduce(function (acc, val) {
        if (val < 0) {
            throw new Error('Probability must be a positive: p[' + p.indexOf(val) + ']=' + val);
        }
        return acc + val;
    }, 0);
    if (sum === 0) {
        throw new Error('Probability sum must be greater than zero.');
    }
    var scaledProbabilities = p.map(function (prob) { return (prob * n) / sum; });
    var aliasData = { prob: new Array(n), alias: new Array(n) };
    var small = [];
    var large = [];
    for (var i = n - 1; i >= 0; i--) {
        if (scaledProbabilities[i] < 1) {
            small.push(i);
        }
        else {
            large.push(i);
        }
    }
    while (small.length > 0 && large.length > 0) {
        var less = small.pop();
        var more = large.pop();
        aliasData.prob[less] = scaledProbabilities[less];
        aliasData.alias[less] = more;
        scaledProbabilities[more] = (scaledProbabilities[more] + scaledProbabilities[less]) - 1;
        if (scaledProbabilities[more] < 1) {
            small.push(more);
        }
        else {
            large.push(more);
        }
    }
    while (large.length > 0) {
        aliasData.prob[large.pop()] = 1;
    }
    while (small.length > 0) {
        aliasData.prob[small.pop()] = 1;
    }
    return aliasData;
};
var draw = function (aliasData, outcomes, rng) {
    var c = Math.floor(rng() * aliasData.prob.length);
    return outcomes[(rng() < aliasData.prob[c]) ? c : aliasData.alias[c]];
};
var next = function (aliasData, outcomes, rng, numOfSamples) {
    if (numOfSamples === void 0) { numOfSamples = 1; }
    if (numOfSamples === 1) {
        return draw(aliasData, outcomes, rng);
    }
    var samples = [];
    for (var i = 0; i < numOfSamples; i++) {
        samples.push(draw(aliasData, outcomes, rng));
    }
    return samples;
};
var sample = function (probabilities, outcomes, rng) {
    if (rng === void 0) { rng = Math.random; }
    if (!Array.isArray(probabilities)) {
        throw new Error('Probabilities must be an array.');
    }
    if (probabilities.length === 0) {
        throw new Error('Probabilities array must not be empty.');
    }
    var n = probabilities.length;
    var indexedOutcomes = outcomes !== null && outcomes !== void 0 ? outcomes : Array.from({ length: n }, function (_, i) { return i; });
    var aliasData = precomputeAlias(probabilities, n);
    return {
        next: function (numOfSamples) {
            if (numOfSamples === void 0) { numOfSamples = 1; }
            return next(aliasData, indexedOutcomes, rng, numOfSamples);
        }
    };
};
exports.default = sample;
