// Proxy get/set traps. This is the single biggest SPA blocker: Vue 3, MobX and
// Solid all build reactivity on them. Currently Proxy returns the target and no
// trap ever fires.
var log = "";
var p = new Proxy({ a: 1 }, {
	get: function (t, k) { log += "g:" + k + ";"; return t[k]; },
	set: function (t, k, v) { log += "s:" + k + ";"; t[k] = v; return true; }
});
console.log(p.a);
p.b = 2;
console.log(p.b);
console.log(log);

// a trap that transforms rather than forwards
var doubler = new Proxy({}, {
	get: function (t, k) { return k.length; }
});
console.log(doubler.abc);
console.log(doubler.zz);

// no trap for a key -> forward to the target
var partial = new Proxy({ x: 7 }, {
	set: function (t, k, v) { t[k] = v * 2; return true; }
});
console.log(partial.x);
partial.y = 5;
console.log(partial.y);
