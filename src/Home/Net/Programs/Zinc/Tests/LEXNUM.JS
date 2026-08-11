// Numeric literal forms. A form the lexer does not know splits into a number
// plus an identifier (0o777 -> 0, o777) and desyncs the expression around it.

console.log(0xff);
console.log(0XFF);
console.log(0x1_F);
console.log(0b1011);
console.log(0B1011);
console.log(0o17);
console.log(0O17);

console.log(1_000_000);
console.log(1_0.5_5);

console.log(1e3);
console.log(1.5e-2);
console.log(2E2);
console.log(.5);
console.log(0.25);

// BigInt literals: the suffix is consumed, the value is a double here
console.log(String(10n));
console.log(Number(7n) + 1);

// a literal in an argument list, an array and an object must not eat the
// separator after it
console.log([0o10, 0b10, 1_0].join(","));
console.log(Math.max(0o10, 0b111));
var o = { a: 0o7, b: 1_2 };
console.log(o.a + "," + o.b);
console.log("after the literals");
