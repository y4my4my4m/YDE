// Number.prototype and the Math surface. Transcendentals go through the x87
// kernel routines, so anything but an exact result is compared at a fixed
// number of digits rather than by its shortest representation.

console.log((3.14159).toFixed(2));
console.log((1234.5678).toFixed(3));
console.log((0).toFixed(2));
console.log((1.5).toFixed(0));
console.log((2.5).toFixed(0));
console.log((-1.5).toFixed(0));
console.log((-0.25).toFixed(1));
console.log((99.995).toFixed(2));
console.log((7).toFixed(4));

console.log((255).toString(16));
console.log((255).toString(2));
console.log((-255).toString(16));
console.log((0).toString(2));
console.log((35).toString(36));
console.log((123).toString());
console.log((123).toString(10));
console.log(true.toString());
console.log(false.toString());

console.log((1234567).toLocaleString("en-US"));
console.log((1234.5678).toLocaleString("en-US"));
console.log((-1234.5).toLocaleString("en-US"));
console.log((7.125).toLocaleString("en-US"));
console.log((999999).toLocaleString("en-US"));

console.log((42).valueOf());
console.log("abc".valueOf());
console.log("abc".toString());

console.log(Math.PI);
console.log(Math.E.toFixed(10));
console.log(Math.LN2.toFixed(10));
console.log(Math.LN10.toFixed(10));
console.log(Math.LOG2E.toFixed(10));
console.log(Math.LOG10E.toFixed(10));
console.log(Math.SQRT2.toFixed(10));
console.log(Math.SQRT1_2.toFixed(10));

console.log(Math.trunc(1.9));
console.log(Math.trunc(-1.9));
console.log(Math.sign(-5));
console.log(Math.sign(5));
console.log(Math.sign(0));
console.log(Math.log(1));
console.log(Math.log(Math.E).toFixed(9));
console.log(Math.log2(8).toFixed(9));
console.log(Math.log10(1000).toFixed(9));
console.log(Math.exp(0));
console.log(Math.exp(1).toFixed(9));
console.log(Math.sin(0));
console.log(Math.cos(0));
console.log(Math.tan(0));
console.log(Math.sin(Math.PI / 2).toFixed(9));
console.log(Math.cos(Math.PI).toFixed(9));
console.log(Math.atan(1).toFixed(9));
console.log(Math.asin(1).toFixed(9));
console.log(Math.asin(0.5).toFixed(9));
console.log(Math.acos(1).toFixed(9));
console.log(Math.acos(0).toFixed(9));
console.log(Math.atan2(1, 1).toFixed(9));
console.log(Math.atan2(0, -1).toFixed(9));
console.log(Math.hypot(3, 4));
console.log(Math.hypot(5, 12));
console.log(Math.cbrt(27).toFixed(6));
console.log(Math.cbrt(-8).toFixed(6));

console.log(Number.isInteger(4));
console.log(Number.isInteger(4.5));
console.log(Number.isInteger("4"));
console.log(Number.isSafeInteger(9007199254740993));
console.log(Number.isFinite(1));
console.log(Number.isFinite("1"));
console.log(Number.isFinite(1 / 0));
console.log(isFinite("1"));
console.log(isFinite(NaN));
console.log(Number.isNaN(NaN));
console.log(Number.isNaN("NaN"));
console.log(Number.MAX_SAFE_INTEGER);
console.log(Number.MIN_SAFE_INTEGER);
console.log(Number.EPSILON);
console.log(Number.MAX_VALUE);
console.log(Number.POSITIVE_INFINITY);
console.log(Number.NEGATIVE_INFINITY);
console.log(Number.parseInt("17px"));
console.log(Number.parseFloat("2.5rem"));
