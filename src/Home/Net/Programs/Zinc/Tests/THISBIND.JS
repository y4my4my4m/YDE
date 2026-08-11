// A classic script's top-level `this` is the global object. When it is
// undefined instead, `this.ns = this.ns || {}` writes into nothing, so the
// script that populates a namespace and the script that reads it end up with
// different objects - every member reads undefined while the namespace name
// itself is still bound. That is the exact shape of Closure-compiled output:
//
//     this.gbar_ = this.gbar_ || {};
//     (function(_){ _.Ac = function(){...}; })(this.gbar_);
//
// Nothing below asserts `this === globalThis` at top level: under node this
// file is a CommonJS module whose `this` is module.exports, not the global.
// Every assertion here holds for both, and all of them fail when `this` is
// undefined, which is what makes them worth running.

console.log(typeof this);
console.log(this === undefined);
console.log(this === null);
console.log(!!this);

// the namespace round-trip, in the shape the compiler emits
this.ns_a = this.ns_a || {};
console.log(typeof this.ns_a);

(function (_) {
	_.Thing = function (v) { this.v = v; };
	_.helper = function () { return "h"; };
	_.count = 3;
	_.Sub = {};
	_.Sub.Deep = function () { this.d = 2; };
})(this.ns_a);

console.log(typeof this.ns_a.Thing);
console.log(new this.ns_a.Thing(7).v);
console.log(this.ns_a.helper());
console.log(this.ns_a.count);
console.log(typeof this.ns_a.Sub);
console.log(typeof this.ns_a.Sub.Deep);
console.log(new this.ns_a.Sub.Deep().d);

// a later block reaches the SAME object rather than minting a new one
this.ns_a = this.ns_a || {};
console.log(typeof this.ns_a.Thing);
console.log(this.ns_a.count);

// a second namespace, populated through a local alias
this.ns_b = this.ns_b || {};
var alias = this.ns_b;
alias.Made = function () { this.m = 1; };
console.log(typeof this.ns_b.Made);
console.log(new this.ns_b.Made().m);

// `this` in a plain call is the global object in sloppy mode, not undefined
function plainType() { return typeof this; }
console.log(plainType());
function plainUndef() { return this === undefined; }
console.log(plainUndef());

// a method call still binds the receiver, and a constructor the new object
var obj = { tag: "o", m: function () { return this.tag; } };
console.log(obj.m());
function C(x) { this.x = x; }
console.log(new C(3).x);
console.log(new C(4) instanceof C);

// call/apply still override the receiver
function whoTag() { return this.tag; }
console.log(whoTag.call({ tag: "called" }));
console.log(whoTag.apply({ tag: "applied" }));
console.log("thisbind done");
