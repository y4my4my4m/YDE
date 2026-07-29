var a = [1, 2, 3, 4, 5];

console.log(a.length);
console.log(a[0]);
console.log(a[4]);
console.log(a.join(","));
console.log(a.indexOf(3));
console.log(a.indexOf(99));
console.log(a.includes(2));
console.log(a.slice(1, 3).join(","));
console.log(a.concat([6, 7]).join(","));

console.log(a.map(function (x) { return x * 2; }).join(","));
console.log(a.filter(function (x) { return x % 2 === 1; }).join(","));
console.log(a.reduce(function (acc, x) { return acc + x; }, 0));
console.log(a.find(function (x) { return x > 3; }));

var sum = 0;
a.forEach(function (x) { sum += x; });
console.log(sum);

var b = [3, 1, 2];
console.log(b.sort().join(","));
console.log(b.reverse().join(","));

var c = [];
c.push(1);
c.push(2);
console.log(c.join(","));
console.log(c.pop());
console.log(c.join(","));
console.log(c.shift());
console.log(c.length);

console.log(Array.isArray(a));
console.log(Array.isArray("no"));

// arrow forms of the same callbacks
console.log(a.map((x) => x + 1).join(","));
console.log(a.filter((x) => x > 2).join(","));

// nesting and index writes
var m = [[1, 2], [3, 4]];
console.log(m[1][0]);
m[0][1] = 9;
console.log(m[0].join(","));

// for-of over an array
var acc = "";
for (var v of a) { acc += v; }
console.log(acc);
