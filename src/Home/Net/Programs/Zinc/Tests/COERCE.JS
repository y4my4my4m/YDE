// Two rules the suite caught one instance of each. Pinned here as rules, so a
// regression cannot hide behind the one case that happened to be tested.
//
// 1. join renders an undefined or null element as the empty string, and the
//    array-to-string coercion IS join(","), so String(arr), arr.toString() and
//    `"" + arr` all follow it. Rendering "undefined" instead turns a sparse
//    array into text that parses back as data.
// 2. `??=` assigns only for null and undefined - not 0, not "", not false -
//    and does not evaluate its right-hand side otherwise.
//
// Array-literal elisions ([1, , 3]) are deliberately not used: whether the
// parser supports them is a separate question from what join does with a hole.

var holes = new Array(3);
console.log(holes.length);
console.log("[" + holes.join(",") + "]");
console.log("[" + holes.join("-") + "]");
console.log("[" + String(holes) + "]");
console.log("[" + holes.toString() + "]");
console.log("[" + ("" + holes) + "]");

console.log("[" + [1, null, 2].join("-") + "]");
console.log("[" + [1, undefined, 2].join("-") + "]");
console.log("[" + [null, undefined].join(",") + "]");
console.log("[" + String([1, undefined, 2]) + "]");
console.log("[" + [undefined].join(",") + "]");

// values that are falsy but NOT null or undefined keep their text
console.log("[" + [0, "", false].join(",") + "]");
console.log("[" + [NaN].join(",") + "]");
console.log("[" + [0, null, false].join(",") + "]");

// nested arrays stringify through the same rule
console.log("[" + [[1, 2], [3]].join(";") + "]");
console.log("[" + [[null], [1]].join(";") + "]");

// ---- nullish assignment ----
var a1 = null;
a1 ??= 1;
console.log(a1);
var a2;
a2 ??= 2;
console.log(a2);
var a3 = 0;
a3 ??= 3;
console.log(a3);
var a4 = "";
a4 ??= 4;
console.log(a4 === "");
var a5 = false;
a5 ??= 5;
console.log(a5);

// the right-hand side is not evaluated when the target is already set
var calls = 0;
function rhs() { calls = calls + 1; return 9; }
var a6 = 1;
a6 ??= rhs();
console.log(calls);
console.log(a6);
var a7 = null;
a7 ??= rhs();
console.log(calls);
console.log(a7);

// member and index targets
var o = { set: 1 };
o.miss ??= 5;
o.set ??= 6;
console.log(o.miss);
console.log(o.set);
var arr = [null, 2];
arr[0] ??= 7;
arr[1] ??= 8;
console.log(arr.join(","));

// the plain ?? operator, and its siblings, still behave
console.log(null ?? "d");
console.log(0 ?? "d");
console.log(undefined ?? "d");
var b1 = 0;
b1 ||= 5;
console.log(b1);
var b2 = 1;
b2 &&= 6;
console.log(b2);

// ---- safe integer boundary ----
console.log(Number.isSafeInteger(9007199254740991));
console.log(Number.isSafeInteger(9007199254740992));
console.log(Number.isSafeInteger(-9007199254740991));
console.log(Number.isSafeInteger(-9007199254740992));
console.log(Number.isSafeInteger(0));
console.log(Number.isSafeInteger(1.5));
console.log(Number.isInteger(9007199254740992));
console.log("coerce done");
