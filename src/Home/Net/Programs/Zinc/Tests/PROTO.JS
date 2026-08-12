// X.prototype has to be a reachable object carrying the type's methods.
// `Object.prototype.hasOwnProperty.call(o, k)` and
// `Array.prototype.slice.call(arguments)` are in essentially every transpiled
// bundle; without the reified prototype the whole chain reads undefined at the
// first hop and every method call downstream reports a missing member on an
// undefined receiver.
//
// Also here: obj.constructor, which needs the constructor linked onto the
// prototype object, and Object.is.

// ---- Object.prototype ----
var o = { a: 1 };
console.log(typeof Object.prototype);
console.log(typeof Object.prototype.hasOwnProperty);
console.log(typeof Object.prototype.toString);
console.log(typeof Object.prototype.valueOf);
console.log(Object.prototype.hasOwnProperty.call(o, "a"));
console.log(Object.prototype.hasOwnProperty.call(o, "b"));
console.log(Object.prototype.constructor === Object);

// the generic methods are reachable on a function too, not only on an object
function withProps() { return 1; }
withProps.tag = "t";
console.log(typeof withProps.hasOwnProperty);
console.log(withProps.hasOwnProperty("tag"));
console.log(withProps.hasOwnProperty("nope"));

// ---- Array.prototype ----
console.log(typeof Array.prototype);
console.log(typeof Array.prototype.slice);
console.log(typeof Array.prototype.map);
console.log(typeof Array.prototype.indexOf);
console.log(Array.prototype.length);
console.log(Array.prototype.slice.call([1, 2, 3], 1).join(","));
console.log(Array.prototype.join.call([1, 2], "-"));
console.log(Array.prototype.indexOf.call([5, 6], 6));
console.log(Array.prototype.constructor === Array);

// ---- String.prototype ----
console.log(typeof String.prototype);
console.log(typeof String.prototype.charAt);
console.log(typeof String.prototype.indexOf);
console.log(String.prototype.length);
console.log(String.prototype.charAt.call("abc", 1));
console.log(String.prototype.toUpperCase.call("ab"));
console.log(String.prototype.indexOf.call("hello", "l"));

// ---- Function / Number prototypes ----
console.log(typeof Function.prototype.call);
console.log(typeof Function.prototype.apply);
console.log(typeof Function.prototype.bind);
console.log(typeof Number.prototype.toFixed);
console.log(typeof Number.prototype.toString);

// ---- constructor on instances ----
function C(x) { this.x = x; }
var c = new C(2);
console.log(typeof c.constructor);
console.log(c.constructor === C);
console.log(C.prototype.constructor === C);
class K { constructor() { this.k = 1; } }
console.log(new K().constructor === K);
// NOT asserted: ({}).constructor. An object literal is not linked to
// Object.prototype here, so it inherits no constructor. Only objects made by
// a constructor reach one, through that constructor's prototype.

// ---- Object.is ----
console.log(Object.is(1, 1));
console.log(Object.is("a", "a"));
console.log(Object.is(NaN, NaN));
console.log(Object.is(0, -0));
console.log(Object.is(-0, -0));
console.log(Object.is(0, 0));
console.log(Object.is(1, 2));
console.log(Object.is({}, {}));
console.log(Object.is(null, null));
console.log(Object.is(undefined, undefined));
console.log("proto done");
