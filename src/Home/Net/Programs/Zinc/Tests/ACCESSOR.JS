// object-literal accessors, get and set on the same name
var o = {
	first: "Ada",
	last: "Lovelace",
	get full() { return this.first + " " + this.last; },
	set full(v) {
		var parts = v.split(" ");
		this.first = parts[0];
		this.last = parts[1];
	}
};
console.log(o.full);
o.full = "Grace Hopper";
console.log(o.first);
console.log(o.last);
console.log(o.full);

// getter only
var g = { get answer() { return 42; } };
console.log(g.answer);

// setter only: reading yields undefined
var s = { _v: 0, set val(x) { this._v = x * 2; } };
s.val = 4;
console.log(s._v);
console.log(s.val);

// a getter runs on every read
var counter = { n: 0, get next() { this.n = this.n + 1; return this.n; } };
console.log(counter.next);
console.log(counter.next);
console.log(counter.n);

// accessors defined on a class prototype fire on instances
class Rect {
	constructor(w, h) {
		this.w = w;
		this.h = h;
	}
	get area() { return this.w * this.h; }
	set area(a) { this.h = a / this.w; }
	describe() { return this.w + "x" + this.h; }
}
var r = new Rect(3, 4);
console.log(r.area);
r.area = 30;
console.log(r.h);
console.log(r.describe());
var r2 = new Rect(2, 5);
console.log(r2.area);
console.log(r.area);

// a getter can read plain methods off the same prototype
class Temp {
	constructor(c) { this.c = c; }
	get f() { return this.c * 9 / 5 + 32; }
	set f(v) { this.c = (v - 32) * 5 / 9; }
}
var tp = new Temp(100);
console.log(tp.f);
tp.f = 32;
console.log(tp.c);

// "get" and "set" are still ordinary property names
var m = { get: 1, set: 2, getThing: function () { return "t"; } };
console.log(m.get + m.set);
console.log(m.getThing());

// literal accessors are own enumerable properties
console.log(Object.keys(g).join(","));
// class accessors live on the prototype, not the instance
console.log(Object.keys(r).join(","));
