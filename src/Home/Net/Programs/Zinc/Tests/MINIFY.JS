// Dense constructs a minifier emits: sequence expressions, nested ternaries,
// arrows returning object literals, computed keys, trailing commas, labelled
// statements, `in` inside a for head and nested template interpolation.

var n = 3, s = "ab";

// comma sequences in expression, declarator and for-head positions
var z = (1, 2, 3);
console.log(z);
var a = 0, b = 9;
for (a = 0, b = 9; a < 2; a++, b--) ;
console.log(a + "," + b);
console.log((console.log("seq-first"), "seq-last"));

// nested ternaries, both branches
var t = n > 1 ? n > 2 ? "hi" : "mid" : "lo";
console.log(t);
console.log(n > 5 ? "a" : n > 2 ? "b" : "c");
console.log(n ? n - 1 ? "x" : "y" : "z");

// arrow returning an object literal, and an arrow body that is a sequence
var mk = k => ({ k: k, n: 1 });
console.log(mk("q").k + "/" + mk("q").n);
var f2 = (p, q) => (p + q) * 2;
console.log(f2(1, 2));
var f3 = () => ({});
console.log(typeof f3());

// computed keys, shorthand, methods, trailing commas
var key = "dyn";
var obj = {
	[key + "1"]: 10,
	[2 * 3]: 20,
	n,
	m() { return this.n; },
	get g() { return 40; },
};
console.log(obj.dyn1 + "," + obj[6] + "," + obj.n + "," + obj.m() + "," + obj.g);
function tc(x, y,) { return x + y; }
console.log(tc(1, 2,));
console.log([1, 2, 3,].length);

// destructuring in all three declaration forms, with nesting and defaults
var { p, q: qq = 5 } = { p: 1 };
let [x1, , x3 = 7] = [1, 2];
const { deep: { inner = 8 } = {} } = {};
console.log(p + "," + qq + "," + x1 + "," + x3 + "," + inner);
let [[la, lb], ...lrest] = [[1, 2], 3, 4];
console.log(la + "," + lb + "," + lrest.join("-"));

// labelled statement and labelled break out of the innermost loop
lbl: for (var i = 0; i < 5; i++) { if (i === 2) break lbl; }
console.log(i);
plain: { console.log("labelled block"); }

// `in` as an operator inside a C-style for head, and as a for-in head
var has = { a: 1, b: 2 };
for (var j = 0; ("a" in has) && j < 1; j++) console.log("in-guard");
var ks = [];
for (var k in has) ks.push(k);
console.log(ks.join(","));
console.log(("a" in has) + "," + ("z" in has));

// template literals, nested interpolation, and an interpolation holding a
// block-bodied arrow
console.log(`a${1 + 1}b`);
console.log(`x${`y${2 * 2}z`}w`);
console.log(`${[1, 2].map(v => { return v * 2; }).join("|")}`);
console.log(`${ { u: 1 }.u }`);
console.log(`${s.length > 1 ? "long" : "short"}`);

// optional chaining as member, call and index
var oc = { deep: { fn: function () { return "called"; }, arr: [7] } };
console.log(oc?.deep?.arr?.[0]);
console.log(oc?.deep?.fn?.());
console.log(oc?.missing?.fn?.() === undefined);
console.log(oc.missing?.arr?.[0] === undefined);

// nullish coalescing and logical assignment
var nu = null;
console.log(nu ?? "dflt");
var la2 = 0;
la2 ||= 5;
console.log(la2);
var lb2 = 1;
lb2 &&= 6;
console.log(lb2);
var lc2 = null;
lc2 ??= 7;
console.log(lc2);

// spread in calls, arrays and objects
function sum3(u, v, w) { return u + v + w; }
console.log(sum3(...[1, 2, 3]));
console.log([...[1, 2], ...[3]].join(","));
console.log(Object.keys({ ...{ e: 1 }, f: 2 }).join(","));

console.log("end of dense block");
