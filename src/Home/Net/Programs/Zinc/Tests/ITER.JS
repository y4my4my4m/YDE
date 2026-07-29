// the iterator protocol: a custom iterable drives for-of and spread

var range = {
	from: 1,
	to: 4,
	[Symbol.iterator]: function () {
		var cur = this.from, last = this.to;
		return {
			next: function () {
				if (cur <= last) { return { done: false, value: cur++ }; }
				return { done: true };
			}
		};
	}
};

// for-of walks it via @@iterator
var acc = "";
for (var v of range) { acc += v; }
console.log(acc);

// spread uses the same protocol, and re-opens a fresh iterator
console.log([...range].join(","));

// the built-in string and array fast paths are unaffected
var s = "";
for (var c of "abc") { s += c; }
for (var n of [5, 6]) { s += n; }
console.log(s);

// Map.forEach still works
var m = new Map();
m.set("a", 1);
m.set("b", 2);
var mo = "";
m.forEach(function (val, key) { mo += key + val; });
console.log(mo);

// break leaves a protocol-driven loop; array spread into call args still works
function sum3(a, b, c) { return a + b + c; }
var first = "";
for (var q of range) { if (q === 3) { break; } first += q; }
console.log(first + ":" + sum3(...[1, 2, 3]));
