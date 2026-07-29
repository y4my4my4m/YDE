// The regex module was excluded from the build by a stray dollar in its header
// comment, so every pattern on every page silently did nothing. It has never
// had in-VM coverage. Keep this test cheap and broad rather than deep.

console.log(/abc/.test("xxabcxx"));
console.log(/abc/.test("xxabxx"));
console.log(/^abc/.test("abcdef"));
console.log(/^abc/.test("xabcdef"));
console.log(/abc$/.test("xxabc"));
console.log(/abc$/.test("abcx"));

console.log(/a.c/.test("abc"));
console.log(/a.c/.test("ac"));
console.log(/[abc]+/.test("zzbzz"));
console.log(/[^abc]/.test("abc"));
console.log(/\d+/.test("x42"));
console.log(/\w+/.test("__"));
console.log(/\s/.test("a b"));

console.log(/ABC/i.test("abc"));
console.log(/ABC/.test("abc"));

console.log("a1b2c3".replace(/\d/, "#"));
console.log("a1b2c3".replace(/\d/g, "#"));
console.log("one two  three".split(/\s+/).join("|"));

var m = "2026-07-29".match(/(\d+)-(\d+)-(\d+)/);
console.log(m[0]);
console.log(m[1]);
console.log(m[2]);
console.log(m[3]);
console.log(m.length);

console.log("hello world".search(/world/));
console.log("hello world".search(/zzz/));

// quantifiers, greedy vs lazy
console.log("<a><b>".match(/<.+>/)[0]);
console.log("<a><b>".match(/<.+?>/)[0]);
console.log(/^a{2,3}$/.test("aa"));
console.log(/^a{2,3}$/.test("a"));
console.log(/^a{2,3}$/.test("aaaa"));

// alternation, groups, non-capturing
console.log(/^(cat|dog)$/.test("dog"));
console.log(/^(?:ab)+$/.test("abab"));
console.log("abab".match(/^(?:ab)+$/).length);

// word boundary and backreference
console.log(/\bcat\b/.test("a cat here"));
console.log(/\bcat\b/.test("concatenate"));
console.log(/(ab)\1/.test("abab"));
console.log(/(ab)\1/.test("abcd"));

// exec with /g advances lastIndex
var re = /\d/g;
var r1 = re.exec("a1b2");
var r2 = re.exec("a1b2");
console.log(r1[0]);
console.log(r2[0]);

// RegExp constructor
console.log(new RegExp("b+", "i").test("ABBB"));
