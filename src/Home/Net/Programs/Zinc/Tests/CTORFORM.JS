// Every shape a `new` target can arrive in. A gap in any of them reports
// "new '<name>': ..." and yields a soft empty object, which then cascades into
// "call ...: member UNDEF" wherever the result is used.

// class declaration: constructor, prototype accessor, static method
class A {
	constructor(x) { this.x = x; }
	get double() { return this.x * 2; }
	static make(x) { return new A(x); }
	static get kind() { return "A"; }
}
console.log(new A(2).x);
console.log(new A(3).double);
console.log(A.make(4).x);
console.log(A.kind);

// statics reach through `extends`
class Sub extends A {}
console.log(Sub.make(5).x);
console.log(Sub.kind);
console.log(new Sub(6).double);

// class expressions, anonymous and named
var B = class { constructor() { this.tag = "anon"; } };
console.log(new B().tag);
var C = class Named { constructor() { this.tag = "named"; } };
console.log(new C().tag);
var D = class { static tag() { return "static-expr"; } };
console.log(D.tag());

// named function expression: the name is in scope inside its own body
var fact = function F(n) { if (n < 2) return 1; return n * F(n - 1); };
console.log(fact(5));

// assignment forms
var E = function (n) { this.n = n; };
console.log(new E(7).n);
var G = (0, function (n) { this.n = n; });
console.log(new G(8).n);
var host = {};
var H = host.H = function (n) { this.n = n; };
console.log(new H(9).n);
console.log(new host.H(10).n);

// properties written onto a function object: statics, namespaces, prototypes
function Ns() {}
Ns.count = 3;
Ns.Inner = function (v) { this.v = v; };
Ns.Inner.prototype.get = function () { return this.v; };
console.log(Ns.count);
console.log(new Ns.Inner(11).get());

// ES5 prototype-chain construction
function Base(n) { this.n = n; }
Base.prototype.who = function () { return "base " + this.n; };
function Derived(n) { Base.call(this, n); }
Derived.prototype = Object.create(Base.prototype);
Derived.prototype.constructor = Derived;
Derived.prototype.who = function () { return "derived " + this.n; };
console.log(new Derived(12).who());
console.log(new Derived(13).n);
console.log(new Derived(14) instanceof Base);
console.log(Base.prototype.who.call(new Derived(15)));

// a bound function is constructible; the bound this is discarded
function Pt(x, y) { this.x = x; this.y = y; }
Pt.prototype.str = function () { return this.x + ":" + this.y; };
var BoundPt = Pt.bind(null);
console.log(new BoundPt(1, 2).str());
console.log(new BoundPt(3, 4) instanceof Pt);

// the constructor reached through a getter and through a call
var box = { get Ctor() { return Pt; } };
console.log(new box.Ctor(5, 6).str());
function pick() { return Ns.Inner; }
console.log(new (pick())(16).get());

// more than eight constructor arguments
function Many(a, b, c, d, e, f, g, h, i, j) {
	this.sum = a + b + c + d + e + f + g + h + i + j;
}
console.log(new Many(1, 2, 3, 4, 5, 6, 7, 8, 9, 10).sum);
console.log("ctorform done");
