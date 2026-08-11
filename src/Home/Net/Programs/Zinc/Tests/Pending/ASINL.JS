// ASI cases that need newline tracking. The lexer records a source offset per
// token but no line breaks, so the parser cannot see a restricted production:
// `return` followed by a newline yields undefined, `x` followed by a newline
// and `++` is two statements. Both parse here as if the newline were absent.

function r() {
	return
	1;
}
console.log(String(r()));

function t() {
	var v = { a: 1 };
	return
	v.a;
}
console.log(String(t()));

var x = 1, y = 1;
x
++y
console.log(x + "," + y);

var a = 1, b = 2;
var c = a
+ b
console.log(c);
