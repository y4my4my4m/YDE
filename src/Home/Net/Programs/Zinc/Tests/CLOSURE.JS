// Scope and capture. This is the file to watch when the environment lookup
// changes: every case here depends on resolving a name to the right binding.

function counter() {
	var n = 0;
	return function () { n = n + 1; return n; };
}
var c1 = counter();
var c2 = counter();
console.log(c1());
console.log(c1());
console.log(c2());

// shadowing: the inner binding wins, the outer survives
var x = "outer";
function shadow() {
	var x = "inner";
	return x;
}
console.log(shadow());
console.log(x);

// a closure over a loop variable declared with var sees the final value
var fns = [];
for (var i = 0; i < 3; i++) {
	fns.push(function () { return i; });
}
console.log(fns[0]() + "," + fns[1]() + "," + fns[2]());

// let is per-iteration
var lets = [];
for (let j = 0; j < 3; j++) {
	lets.push(function () { return j; });
}
console.log(lets[0]() + "," + lets[1]() + "," + lets[2]());

// nested capture, three levels deep
function outer(a) {
	return function (b) {
		return function (c) { return a + b + c; };
	};
}
console.log(outer(1)(2)(3));

// arrows capture the defining scope
function makeAdder(n) { return (m) => n + m; }
console.log(makeAdder(10)(5));

// a name resolved through several enclosing scopes
var g = "global";
function lvl1() {
	function lvl2() {
		function lvl3() { return g; }
		return lvl3();
	}
	return lvl2();
}
console.log(lvl1());

// assignment to an outer binding from an inner function
var total = 0;
function bump() { total += 5; }
bump();
bump();
console.log(total);

// parameters shadow outer names
var p = "outer-p";
function param(p) { return p; }
console.log(param("arg-p"));
console.log(p);

// recursion resolves the function's own name
function fact(n) {
	if (n <= 1) { return 1; }
	return n * fact(n - 1);
}
console.log(fact(6));
