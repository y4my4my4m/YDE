// Symbol.iterator protocol. for-of currently special-cases arrays and strings
// only, so a custom iterable does nothing.
var range = {
	from: 1, to: 4,
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
var acc = "";
for (var v of range) { acc += v; }
console.log(acc);

// spread over a custom iterable
console.log([...range].join(","));

// built-ins still work
console.log([10, 20].join("-"));
var s = "";
for (var c of "abc") { s += c + "."; }
console.log(s);

// Map/Set iteration
var m = new Map();
m.set("k1", 1);
m.set("k2", 2);
var mk = "";
m.forEach(function (val, key) { mk += key + "=" + val + ";"; });
console.log(mk);
