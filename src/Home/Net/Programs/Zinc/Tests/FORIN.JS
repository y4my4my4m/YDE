// The for-in head is `for ( lhs in Expression )`, and Expression is the comma
// sequence - so the right-hand side may be a list and the loop enumerates the
// LAST operand. Closure Compiler's object-copy helper emits exactly this:
//     for (d in a.U || (a.U = {}), e = a.U, c) ...
// Parsing only one assignment-expression there stops at the comma and takes
// the whole statement down with it.
//
// for-of is deliberately NOT the same: its grammar is
// `for ( lhs of AssignmentExpression )`, so `for (x of a, b)` is a SyntaxError
// in a conforming engine. That case cannot appear in a test that has to run,
// so what is asserted here is the parenthesised sequence - the only legal way
// to hand for-of a comma expression - still parsing as a single operand.

var o1 = { a: 1 };
var o2 = { b: 2, c: 3 };

var seen = [];
for (var k in o1, o2) { seen.push(k); }
console.log(seen.join(","));

// the earlier operands are evaluated for their side effects
var host = {};
var target;
var log = [];
for (var d in host.U || (host.U = {}), target = host.U, o2) { log.push(d); }
console.log(typeof host.U);
console.log(target === host.U);
console.log(log.join(","));

// non-object operands ahead of the one that gets enumerated
var r = [];
for (var m in 1, 2, { x: 0, y: 0 }) { r.push(m); }
console.log(r.join(","));

// a parenthesised sequence is one operand, not a list
var r2 = [];
for (var n in (1, 2, { p: 0 })) { r2.push(n); }
console.log(r2.join(","));

// no var in the head, and a body that is a single statement
var r3 = [];
var q;
for (q in 0, { s: 1, t: 2 }) r3.push(q);
console.log(r3.join(","));

// nested: a comma head inside another for-in
var out = [];
for (var i in { q: 0 }) {
	for (var j in 0, { z: 0 }) { out.push(i + j); }
}
console.log(out.join(","));

// for-of: the parenthesised sequence yields its last operand
var got = [];
for (var v of ([1, 2], [7, 8])) { got.push(v); }
console.log(got.join(","));

// the plain forms are untouched
var vals = [];
for (var t of [10, 20, 30]) { vals.push(t); }
console.log(vals.join(","));
var keys = [];
for (var u in { m: 1, n: 2 }) { keys.push(u); }
console.log(keys.join(","));
var acc = 0;
for (var p = 0, z = 3; p < z; p++) { acc += p; }
console.log(acc);
console.log("forin done");
