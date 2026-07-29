// Real generator suspension. Currently `yield x` evaluates to x with no
// suspension at all, so the whole body runs eagerly on the first call.
function* count() {
	yield 1;
	yield 2;
	yield 3;
}
var g = count();
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().done);

// laziness is the point: nothing runs until next() is called
var ran = "";
function* lazy() { ran += "a"; yield 1; ran += "b"; yield 2; }
var l = lazy();
console.log(ran);
l.next();
console.log(ran);
l.next();
console.log(ran);

// generators are iterable
console.log([...count()].join(","));
var acc = "";
for (var v of count()) { acc += v; }
console.log(acc);

// two instances are independent
var g1 = count(), g2 = count();
g1.next();
console.log(g1.next().value);
console.log(g2.next().value);
