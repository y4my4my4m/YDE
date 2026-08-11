// A `function f(){}` statement binds f for the whole enclosing function or
// script, not from that statement onwards. Minified bundles are one giant
// IIFE whose entry point sits above the helpers it calls, so a missing hoist
// leaves dozens of distinct names undefined at their first use.

console.log(typeof topLevel);
console.log(topLevel());
function topLevel() { return "top"; }

// a hoisted constructor
console.log(new Early(1).v);
function Early(v) { this.v = v; }

// the later declaration wins, and a var of the same name still overwrites it
console.log(typeof mixed);
function mixed() { return "first"; }
function mixed() { return "second"; }
console.log(mixed());
var mixed = 5;
console.log(typeof mixed);

// inside an IIFE: entry point above its helpers, both plain and constructor
(function () {
	console.log(start());
	function start() { return new Helper(3).v; }
	function Helper(v) { this.v = v; }
})();

// mutual recursion through forward references
(function () {
	console.log(even(10));
	console.log(even(7));
	function even(n) { if (n === 0) return "even"; return odd(n - 1); }
	function odd(n) { if (n === 0) return "odd"; return even(n - 1); }
})();

// a declaration after `return` is still reachable from before it
function outer() {
	return maker();
	function maker() { return "made"; }
}
console.log(outer());

// nested one level down: the inner function hoists in its own call frame
function level1() {
	function level2() {
		return deep();
		function deep() { return "deep"; }
	}
	return level2();
}
console.log(level1());

// block, try and switch bodies all contribute to the function scope
(function () {
	{ function inBlock() { return "block"; } }
	console.log(inBlock());
}());

(function () {
	try { console.log(afterTry()); } catch (e) { console.log("threw"); }
	function afterTry() { return "try"; }
}());

(function () {
	switch (1) {
	case 1:
		function inSwitch() { return "switch"; }
		break;
	}
	console.log(inSwitch());
}());

(function () {
	for (var i = 0; i < 1; i++) { function inLoop() { return "loop"; } }
	console.log(inLoop());
}());

// a hoisted function closes over the scope it was declared in, not the one it
// is called from
function counterFactory() {
	var n = 0;
	return bump;
	function bump() { n = n + 1; return n; }
}
var bump = counterFactory();
console.log(bump());
console.log(bump());

// classes are NOT hoisted: the declaration must have run
var Klass = (function () {
	class K { constructor() { this.tag = "k"; } }
	return K;
})();
console.log(new Klass().tag);
console.log("hoist done");
