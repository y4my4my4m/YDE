// '/' is a regex literal or a division depending only on the token before it.
// One wrong call swallows the rest of the line as a regex and desyncs
// everything after, so every ambiguous position is covered here.

var n = 12, d = 4, s = "a1b2", i = 6;

// division: after an identifier, a number, ')', ']' and a postfix ++
console.log(n / d);
console.log(12 / 4);
console.log((n + d) / 2);
var arr = [8, 16];
console.log(arr[1] / 2);
console.log(i++ / 3);
console.log(n / d / 3);
console.log(i);

// regex: at the start of a statement and after '=', '(', ',', ':', '!',
// '&&', '||', '=>', 'return' and 'typeof'
var re = /b\d/;
console.log(re.test(s));
console.log(/a\d/.test(s));
console.log(!/z9/.test(s));
console.log([/a/.test(s), /b/.test(s)].join(","));
var o = { k: /a1/.test(s) };
console.log(o.k);
console.log(true && /b2/.test(s));
console.log(false || /b2/.test(s));
var g = () => /a1/.test(s);
console.log(g());
function f() { return /1b/.test(s); }
console.log(f());
console.log(typeof /x/);

// after the ')' of an if/while/for HEAD a '/' starts a regex; after any
// other group it is division
if (n > d) /a/.test(s) && console.log("if-head regex");
for (var q = 0; q < 1; q++) /b/.test(s) && console.log("for-head regex");
var w = 0;
while (w < 2) /1/.test(s) && w++;
console.log(w);

// a '/' inside a character class does not close the literal
console.log(/[/]/.test("a/b"));
console.log("a/b/c".split(/[/]/).join("-"));
console.log(/a\/b/.test("xa/bx"));

// a pattern past the lexer's inline buffer must still be consumed whole:
// falling back to division lexes the remainder of the pattern as code
var big = /^(alpha|bravo|charlie|delta|echo|foxtrot|golf|hotel|india|juliett|kilo|lima|mike|november|oscar|papa|quebec|romeo|sierra|tango|uniform|victor|whiskey|xray|yankee|zulu|alpha2|bravo2|charlie2|delta2|echo2|foxtrot2|golf2|hotel2|india2|juliett2|kilo2|lima2|mike2|november2|oscar2|papa2|quebec2|romeo2|sierra2|tango2|uniform2|victor2|whiskey2|xray2|yankee2|zulu2|alpha3|bravo3|charlie3|delta3|echo3|foxtrot3|golf3|hotel3|india3|juliett3)$/;
console.log(big.test("tango"));
console.log(big.test("nothing"));
console.log("code after the long pattern still runs");

// division and a regex on the same line, in that order
console.log(n / d + "," + /b/.test(s));
