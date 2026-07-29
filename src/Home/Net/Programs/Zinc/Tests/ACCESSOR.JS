// get/set in object literals and classes. Framework internals lean on these
// heavily, and Babel/TS output emits them constantly.
var o = {
	_v: 1,
	get v() { return this._v * 10; },
	set v(x) { this._v = x + 1; }
};
console.log(o.v);
o.v = 5;
console.log(o._v);
console.log(o.v);

// accessor on a class, reached through the prototype chain
class Temp {
	constructor(c) { this._c = c; }
	get f() { return this._c * 9 / 5 + 32; }
	set f(x) { this._c = (x - 32) * 5 / 9; }
}
var t = new Temp(100);
console.log(t.f);
t.f = 32;
console.log(t._c);

// a getter defined on a plain prototype object
function P() {}
P.prototype = { get tag() { return "from-proto"; } };
console.log(new P().tag);

// a plain data property must still behave normally
var d = { a: 1 };
d.a = 2;
console.log(d.a);
