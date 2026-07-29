// Thrown values and Error shape. Internal engine errors are meant to become
// catchable Error objects too; when that lands, add cases here.

try {
	throw new Error("plain");
} catch (e) {
	console.log(e.message);
	console.log(e.name);
}

try {
	throw new TypeError("bad type");
} catch (e) {
	console.log(e.name);
	console.log(e.message);
}

// non-Error values pass through unchanged
try {
	throw "just a string";
} catch (e) {
	console.log(e);
	console.log(typeof e);
}

try {
	throw 42;
} catch (e) {
	console.log(e + 1);
}

// rethrow crosses a frame
function inner() { throw new Error("from inner"); }
function middle() { inner(); }
try {
	middle();
} catch (e) {
	console.log(e.message);
}

// catch does not swallow the following statements
var reached = false;
try { throw new Error("x"); } catch (e) { }
reached = true;
console.log(reached);

// finally runs on the throwing path and the value still propagates
function f() {
	try {
		throw new Error("deep");
	} finally {
		console.log("finally ran");
	}
}
try { f(); } catch (e) { console.log(e.message); }

// return from inside try still runs finally
function g() {
	try { return "ret"; } finally { console.log("g finally"); }
}
console.log(g());

// nested try: the inner handler wins
try {
	try { throw new Error("in"); } catch (e) { console.log("inner:" + e.message); }
} catch (e) {
	console.log("outer should not see this");
}

// error thrown inside a callback
try {
	[1].forEach(function () { throw new Error("cb"); });
} catch (e) {
	console.log(e.message);
}
