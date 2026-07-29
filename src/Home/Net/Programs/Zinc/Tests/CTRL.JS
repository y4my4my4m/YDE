var out = "";

if (1 < 2) { out += "a"; } else { out += "b"; }
if (2 < 1) { out += "c"; } else { out += "d"; }
console.log(out);

var i = 0, acc = "";
while (i < 4) { acc += i; i++; }
console.log(acc);

acc = "";
for (i = 0; i < 4; i++) { acc += i; }
console.log(acc);

acc = "";
i = 0;
do { acc += i; i++; } while (i < 3);
console.log(acc);

// break leaves the loop, the counter keeps its value
acc = "";
for (i = 0; i < 10; i++) {
	if (i === 3) { break; }
	acc += i;
}
console.log(acc);
console.log(i);

// nested loops: break only leaves the inner one
acc = "";
for (i = 0; i < 3; i++) {
	for (var j = 0; j < 3; j++) {
		if (j === 1) { break; }
		acc += "" + i + j;
	}
}
console.log(acc);

// switch, including fallthrough and default
function sw(n) {
	switch (n) {
		case 1: return "one";
		case 2:
		case 3: return "two-or-three";
		default: return "other";
	}
}
console.log(sw(1));
console.log(sw(2));
console.log(sw(3));
console.log(sw(9));

// short circuit must not evaluate the right side
var calls = 0;
function bump() { calls++; return true; }
false && bump();
true || bump();
console.log(calls);
true && bump();
console.log(calls);

// conditional expression
console.log(1 < 2 ? "yes" : "no");

// for-in over object keys
var o = { a: 1, b: 2 };
var keys = "";
for (var k in o) { keys += k; }
console.log(keys);

// try/catch/finally ordering
function tcf(shouldThrow) {
	var log = "";
	try {
		log += "t";
		if (shouldThrow) { throw new Error("boom"); }
		log += "n";
	} catch (e) {
		log += "c";
	} finally {
		log += "f";
	}
	return log;
}
console.log(tcf(false));
console.log(tcf(true));
