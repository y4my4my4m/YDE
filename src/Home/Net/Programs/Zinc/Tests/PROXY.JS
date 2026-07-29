// get trap: intercepts every read, falls back to the target
var target = { a: 1, b: 2 };
var p = new Proxy(target, {
	get: function (t, k) {
		if (k === "magic")
			return 42;
		return t[k];
	}
});
console.log(p.a);
console.log(p.magic);
console.log(p.b);

// set trap: sees the key and the value, writes through to the target
var log = [];
var p2 = new Proxy({}, {
	get: function (t, k) { return t[k]; },
	set: function (t, k, v) {
		log.push(k + "=" + v);
		t[k] = v * 2;
		return true;
	}
});
p2.x = 5;
console.log(p2.x);
console.log(log.join(","));

// empty handler: both reads and writes pass through
var p3 = new Proxy({ n: 7 }, {});
console.log(p3.n);
p3.m = 8;
console.log(p3.m);

// only a get trap: the write still lands on the target
var t4 = { v: 1 };
var p4 = new Proxy(t4, { get: function (t, k) { return t[k] + 100; } });
p4.v = 5;
console.log(t4.v);
console.log(p4.v);

// the trap receives the target, never the proxy, so nesting cannot loop
console.log(typeof p);

// the reactivity pattern every SPA framework is built on
function reactive(obj, onset) {
	return new Proxy(obj, {
		get: function (t, k) { return t[k]; },
		set: function (t, k, v) {
			t[k] = v;
			onset(k, v);
			return true;
		}
	});
}
var hits = 0;
var lastKey = "";
var state = reactive({ count: 0 }, function (k, v) {
	hits = hits + 1;
	lastKey = k;
});
state.count = 1;
state.count = state.count + 1;
console.log(state.count);
console.log(hits);
console.log(lastKey);

// a method read through the trap is still callable
var api = new Proxy({ greet: function (who) { return "hi " + who; } }, {
	get: function (t, k) { return t[k]; }
});
console.log(api.greet("zinc"));
