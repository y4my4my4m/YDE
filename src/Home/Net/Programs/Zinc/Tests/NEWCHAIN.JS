// `new MemberExpression Arguments`: the whole member chain is the constructor.
// Parsing only the first primary constructs the namespace object instead, so
// every `new ns.Thing()` reports a non-constructor and the result is empty.

function Box(v) { this.v = v; }
Box.prototype.get = function () { return this.v; };

var ns = { inner: { Box: Box } };
var tbl = [Box];

console.log(new Box(1).v);
console.log(new ns.inner.Box(2).v);
console.log(new tbl[0](3).v);
console.log(new ns["inner"].Box(4).v);
console.log(new ns.inner.Box(5).get());

// no argument list: the chain is still the constructor
console.log(typeof new Box);
console.log(new ns.inner.Box instanceof Box);

// parenthesised constructor expressions
function pick() { return Box; }
console.log(new (pick())(6).v);
console.log(new (ns.inner.Box)(7).v);

// the result of new is itself a member/call target
console.log(new Box(8).get());
console.log((new Box(9)).v);
console.log(new Box(10) instanceof Box);

// class constructors reached through a namespace
class Pt {
	constructor(x, y) { this.x = x; this.y = y; }
	str() { return this.x + ":" + this.y; }
}
var geom = { shapes: { Pt: Pt } };
console.log(new geom.shapes.Pt(1, 2).str());
console.log(new geom.shapes.Pt(3, 4) instanceof Pt);

// nested new inside an argument list
console.log(new Box(new Box(11).v).v);
console.log("after the new chains");
