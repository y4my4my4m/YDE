// Destructuring: declarations, parameters, for-of and assignment all go
// through one binder, so this covers nesting, defaults and rest in each place.

// declarations
var { a, b } = { a: 1, b: 2 };
console.log(a + "," + b);
var { x: p, y: q } = { x: 3, y: 4 };
console.log(p + "," + q);
var [m, n] = [5, 6];
console.log(m + "," + n);

// defaults
var { u = 7, v = 8 } = { u: 1 };
console.log(u + "," + v);
var [i = 9, j = 10] = [0];
console.log(i + "," + j);

// nesting
var { c: { d } } = { c: { d: 11 } };
console.log(d);
var [[e], [f]] = [[12], [13]];
console.log(e + "," + f);
var { g: [h, k] } = { g: [14, 15] };
console.log(h + "," + k);

// rest
var [r1, ...rest] = [1, 2, 3, 4];
console.log(r1 + ":" + rest.join("-"));
var { s1, ...srest } = { s1: 1, s2: 2, s3: 3 };
console.log(s1 + ":" + srest.s2 + srest.s3);

// elision
var [, second, , fourth] = [1, 2, 3, 4];
console.log(second + "," + fourth);

// array literal holes still build the right length
console.log([1, , 3].length);
console.log([1, 2, ].length);

// swap through assignment destructuring
var sa = 1, sb = 2;
[sa, sb] = [sb, sa];
console.log(sa + "," + sb);
var so = {};
({ z: so.z } = { z: 16 });
console.log(so.z);

// function parameters
function fo({ w, t = 20 }) { return w + "/" + t; }
console.log(fo({ w: 19 }));
function fa([one, two]) { return one * two; }
console.log(fa([3, 7]));
function fboth(pre, { deep: { inner } }, post) { return pre + inner + post; }
console.log(fboth("<", { deep: { inner: 21 } }, ">"));
function fdef({ o } = { o: 22 }) { return o; }
console.log(fdef());

// arrow parameters, including the position of later params
var arrow = ({ k1 }, k2) => k1 + "|" + k2;
console.log(arrow({ k1: "A" }, "B"));
var pair = ([lo, hi]) => hi - lo;
console.log(pair([2, 9]));

// for-of over entries, the pattern this whole path exists for
var acc = "";
for (var [key, val] of [["a", 1], ["b", 2]]) { acc += key + val; }
console.log(acc);
var eacc = "";
for (var [ek, ev] of Object.entries({ p: 1, q: 2 })) { eacc += ek + ev; }
console.log(eacc);
var oacc = "";
for (var { id } of [{ id: 1 }, { id: 2 }]) { oacc += id; }
console.log(oacc);

// callbacks taking a destructured element
console.log([{ n: 1 }, { n: 2 }].map(({ n }) => n * 10).join(","));

// strings destructure by character
var [c1, c2] = "hi";
console.log(c1 + c2);
var { length: slen } = "abcd";
console.log(slen);
