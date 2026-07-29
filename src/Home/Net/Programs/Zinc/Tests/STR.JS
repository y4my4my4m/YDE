var s = "Hello, World";

console.log(s.length);
console.log(s.charAt(0));
console.log(s.charCodeAt(0));
console.log(s.indexOf("World"));
console.log(s.indexOf("nope"));
console.log(s.substring(0, 5));
console.log(s.slice(7));
console.log(s.slice(-5));
console.log(s.toUpperCase());
console.log(s.toLowerCase());
console.log(s.split(", ").join("|"));
console.log(s.replace("World", "Zinc"));
console.log("  pad  ".trim());
console.log(s.includes("lo,"));
console.log(s.startsWith("Hell"));
console.log(s.endsWith("rld"));
console.log("ab".repeat(3));
console.log("7".padStart(3, "0"));
console.log("7".padEnd(3, "-"));
console.log(s.substr(7, 3));

console.log("a" + "b" + "c");
console.log("" + 1 + 2);
console.log("x".length + "yz".length);

// template literals desugar to concatenation in the lexer
var n = 3;
console.log(`n is ${n}`);
console.log(`${n + 1} and ${"lit"}`);

// escapes survive the lexer
console.log("tab\there");
console.log("quote\"inside");
console.log("back\\slash");

var parts = "a,b,,c".split(",");
console.log(parts.length);
console.log(parts.join("-"));
