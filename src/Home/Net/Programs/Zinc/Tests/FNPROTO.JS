// Members every function value carries. A gap in this dispatch is invisible
// until a page calls one, and then it reports as a member miss on a receiver
// that resolved perfectly well.
//
// The exact source text of toString() is engine-specific and is NOT asserted:
// a real engine returns the function's source, this one rebuilds the signature
// from the AST because the body text is not kept past the parse. What is
// asserted is the part every engine agrees on - it is a string, it starts with
// "function", it agrees with String(fn), and only a genuine native carries the
// "[native code]" marker.

function named(a, b) { return a + b; }

console.log(typeof named.toString);
console.log(typeof named.toString());
console.log(named.toString().indexOf("function") === 0);
console.log(named.toString().indexOf("[native code]") < 0);
console.log(("" + named) === named.toString());
console.log(String(named) === named.toString());
console.log(named.toLocaleString() === named.toString());
console.log(named.valueOf() === named);
console.log(named.name);
console.log(typeof named.call);
console.log(typeof named.apply);
console.log(typeof named.bind);
console.log(typeof named.length);

// Function.length counts the parameters before the first default or rest
console.log((function (a, b, c) { return a; }).length);
console.log((function (a, b) { return a; }).length);
console.log((function () { return 0; }).length);
console.log((function (a, b) { return a + b; }).length === 2);
console.log((function (a, ...rest) { return rest; }).length);
console.log((function (...rest) { return rest; }).length);
console.log((function (a, b, c) { return a; }).length);

// a genuine native says so; a user function must not, or a page probing for a
// polyfilled builtin reads the shim as native
console.log(Array.isArray.toString().indexOf("[native code]") > 0);
console.log(typeof Array.isArray.toString());
console.log(typeof Object.keys.length);
console.log(typeof Object.keys.call);

// a bound function is a function value like any other
var bound = named.bind(null);
console.log(typeof bound.toString);
console.log(typeof bound.call);
console.log(typeof bound.apply);

// an assigned toString shadows the builtin, as an own property must
function shadowed() { return 1; }
shadowed.toString = function () { return "custom"; };
console.log(shadowed.toString());

// methods and constructors are function values too
function Ctor(x) { this.x = x; }
Ctor.prototype.get = function (k) { return this.x; };
console.log(typeof Ctor.toString);
console.log(Ctor.prototype.get.length);
console.log(Ctor.name);
console.log("fnproto done");
