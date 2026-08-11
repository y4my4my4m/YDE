// Namespace statics and the string/array methods that were missing: the
// Object/Array/String constructors, URI escaping, base64 and iteration helpers.

console.log(String.fromCharCode(72, 105, 33));
console.log(String.fromCharCode(65) + String.fromCharCode(90));

console.log("abc".at(0));
console.log("abc".at(-1));
console.log("abc".at(5));
console.log("[" + "  pad  ".trimStart() + "]");
console.log("[" + "  pad  ".trimEnd() + "]");
console.log("[" + "\t x \t".trimEnd() + "]");
console.log("ab".concat("c", "d", 1));
console.log("b".localeCompare("a"));
console.log("a".localeCompare("b"));
console.log("a".localeCompare("a"));
console.log("MiXeD".toLocaleLowerCase());
console.log("MiXeD".toLocaleUpperCase());
console.log("abc".codePointAt(1));

var arr = ["x", "y", "z"];
console.log(arr.toString());
console.log([...arr.keys()].join("-"));
console.log([...arr.values()].join("-"));
var pairs = "";
for (var [ai, av] of arr.entries()) { pairs += ai + av; }
console.log(pairs);
console.log([1, [2, 3]].toString());

console.log(Array.from("abc").join("-"));
console.log(Array.from([1, 2, 3]).join("-"));
console.log(Array.from({ length: 3 }, function (_, i) { return i * 2; }).join("-"));
console.log(Array.from([1, 2], function (v) { return v + 10; }).join("-"));
console.log(Array.of(1, 2, 3).join("-"));
console.log(Array.of().length);
console.log(new Array(3).length);
console.log(new Array(3).join(","));
console.log(Array(1, 2).join("-"));
console.log(Array.isArray(Array.from("ab")));

var o = { a: 1, b: 2 };
console.log(o.hasOwnProperty("a"));
console.log(o.hasOwnProperty("c"));
console.log(Object.hasOwn(o, "b"));
console.log(Object.hasOwn(o, "z"));
console.log(({}).toString());
console.log(String({}));
console.log([1, 2].hasOwnProperty("length"));

console.log(encodeURIComponent("a b/c?d=e&f#g"));
console.log(encodeURI("a b/c?d=e&f#g"));
console.log(encodeURIComponent("hello~world!*()'-_."));
console.log(decodeURIComponent("a%20b%2Fc"));
console.log(decodeURIComponent(encodeURIComponent("x y&z=1")));
console.log(decodeURI("a%20b/c"));

console.log(btoa("Hello, World!"));
console.log(btoa("a"));
console.log(btoa("ab"));
console.log(btoa("abc"));
console.log(atob("SGVsbG8="));
console.log(atob(btoa("round trip 123")));

function named(a, b) { return a + b; }
console.log(named.name);
console.log(typeof named.name);
