// Number formatting and arithmetic. Only strings and numbers are logged:
// console.log of an array or object is host-formatted and would compare the
// printer, not the engine.
console.log(1);
console.log(0);
// not console.log(-0): node's inspector prints "-0" while String(-0) is "0",
// so that line would compare host console formatting, not the engine
console.log(String(-0));
console.log(1.5);
console.log(0.1);
console.log(0.1 + 0.2);
console.log(1 / 3);
console.log(100);
console.log(1e21);
console.log(1e-7);
console.log(123456789012345680000);
console.log(NaN);
console.log(Infinity);
console.log(-Infinity);
console.log(1 / 0);
console.log(-1 / 0);

console.log(7 % 3);
console.log(-7 % 3);
console.log(2 * 3 + 4);
console.log(2 + 3 * 4);
console.log((2 + 3) * 4);
console.log(Math.floor(1.7));
console.log(Math.ceil(1.2));
console.log(Math.round(1.5));
console.log(Math.round(-1.5));
console.log(Math.abs(-3));
console.log(Math.sqrt(16));
console.log(Math.pow(2, 10));
console.log(Math.max(1, 9, 5));
console.log(Math.min(1, 9, 5));

console.log(parseInt("42"));
console.log(parseInt("42px"));
console.log(parseInt("  17  "));
console.log(parseFloat("3.25rem"));
console.log(isNaN(parseInt("abc")));
console.log(Number("12"));
console.log(Number(""));
console.log(String(255));

console.log(1 + "2");
console.log("3" - 1);
console.log("3" * "4");
console.log(+"5");
console.log(1 == "1");
console.log(1 === "1");
console.log(null == undefined);
console.log(null === undefined);
