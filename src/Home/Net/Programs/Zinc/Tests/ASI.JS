// Automatic semicolon insertion, in the shapes a minifier leaves behind: the
// last statement of a block, statements separated only by a newline, and
// closers that terminate a statement without one.

function noTail() { var a = 1; return a }
console.log(noTail())

var x = 1
var y = 2
console.log(x + y)

function blockTail() {
	var v = 3
	v = v + 1
	return v
}
console.log(blockTail())

if (x) { console.log("if-no-semi") }
for (var i = 0; i < 1; i++) { console.log("for-no-semi") }
while (x > 5) { x = x - 1 }
do { x = x + 1 } while (x < 3)
console.log(x)

var o = { a: 1, b: 2 }
var arr = [1, 2, 3]
console.log(o.a + arr[2])

var f = function () { return "fn" }
console.log(f())

var g = () => "arrow"
console.log(g())

switch (x) {
	case 3:
		console.log("case-no-semi")
		break
	default:
		console.log("default")
}

class K {
	m() { return "k" }
}
console.log(new K().m())

try { throw "boom" } catch (e) { console.log(e) }

console.log("end")
