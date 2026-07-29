var o = { a: 1, b: "two", c: true };

console.log(o.a);
console.log(o.b);
console.log(o["c"]);
console.log(Object.keys(o).join(","));

o.d = 4;
console.log(o.d);
o.a = 10;
console.log(o.a);
console.log(o.missing);
console.log(typeof o.missing);

var nested = { x: { y: { z: "deep" } } };
console.log(nested.x.y.z);

var key = "b";
console.log(o[key]);

// numeric and quoted literal keys
var lit = { 1: "one", "two words": 2 };
console.log(lit[1]);
console.log(lit["two words"]);

// Object.assign merges left to right
var merged = Object.assign({}, { p: 1 }, { q: 2, p: 3 });
console.log(merged.p);
console.log(merged.q);

// prototype chain through a constructor
function Point(x, y) {
	this.x = x;
	this.y = y;
}
Point.prototype.sum = function () { return this.x + this.y; };
var p = new Point(3, 4);
console.log(p.x);
console.log(p.sum());

// classes
class Animal {
	constructor(name) { this.name = name; }
	speak() { return this.name + " makes a noise"; }
}
var an = new Animal("dog");
console.log(an.name);
console.log(an.speak());

// typeof across the value kinds
console.log(typeof 1);
console.log(typeof "s");
console.log(typeof true);
console.log(typeof undefined);
console.log(typeof {});
console.log(typeof function () {});

// truthiness
console.log(!!0);
console.log(!!"");
console.log(!!"x");
console.log(!!null);
console.log(!![]);
