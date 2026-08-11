// Map and Set. keys/values/entries were absent, which reports as a member
// miss on a receiver that is a perfectly good object - `call 'values':
// base=OBJ/plain` is a Map, not a namespace that failed to populate. The
// constructors also dropped their seed argument, so `new Map([[k, v]])` came
// back empty and every get() off it fed undefined downstream.
//
// keys/values/entries return plain arrays rather than iterator objects, the
// same approximation arr.keys/values/entries already makes here. Array.from
// is used below rather than spread so the assertions do not depend on which.

var m = new Map([["a", 1], ["b", 2]]);
console.log(m.size);
console.log(m.get("a"));
console.log(m.get("b"));
console.log(m.has("b"));
console.log(Array.from(m.keys()).join(","));
console.log(Array.from(m.values()).join(","));
console.log(Array.from(m.entries()).length);
console.log(Array.from(m.entries())[0].join(":"));
console.log(Array.from(m.entries())[1].join(":"));

m.set("c", 3);
console.log(m.size);
console.log(Array.from(m.keys()).join(","));
console.log(Array.from(m.values()).join(","));
m.set("a", 9);
console.log(m.get("a"));
console.log(m.size);
m.delete("b");
console.log(m.size);
console.log(Array.from(m.keys()).join(","));

var empty = new Map();
console.log(empty.size);
console.log(Array.from(empty.values()).length);
console.log(typeof empty.values);
console.log(typeof empty.keys);
console.log(typeof empty.entries);

var s = new Set([1, 2, 2, 3]);
console.log(s.size);
console.log(Array.from(s.values()).join(","));
console.log(Array.from(s.keys()).join(","));
console.log(Array.from(s.entries())[0].join(":"));
console.log(s.has(2));
s.add(4);
console.log(s.size);
console.log(Array.from(s.values()).join(","));
s.delete(1);
console.log(Array.from(s.values()).join(","));

var eset = new Set();
console.log(eset.size);
console.log(Array.from(eset.values()).length);
console.log(typeof eset.values);

// forEach still works alongside the new accessors
var acc = [];
new Map([["k", 7]]).forEach(function (v, k) { acc.push(k + "=" + v); });
console.log(acc.join(","));
console.log("mapset done");
