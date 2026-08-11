// '#name' private members. Lexed as one identifier, so `this.#x` is an
// ordinary member access; a bare '#' punct makes `.` fail and abandons the
// class, and with it every method declared after it.

class Counter {
	#n = 0;
	#label;

	constructor(label) {
		this.#label = label;
	}

	#bump(by) {
		this.#n = this.#n + by;
		return this.#n;
	}

	inc() { return this.#bump(1); }
	add(k) { return this.#bump(k); }
	get value() { return this.#n; }
	name() { return this.#label; }
}

var c = new Counter("first");
console.log(c.inc());
console.log(c.inc());
console.log(c.add(5));
console.log(c.value);
console.log(c.name());

var c2 = new Counter("second");
console.log(c2.inc());
console.log(c2.name());
console.log(c.value);

// a `static { }` initialiser block must not abandon the class body: the
// members after it still have to be defined
class Boxed {
	static {
		Boxed.tag = "made";
	}
	constructor(v) { this.v = v; }
	twice() { return this.v * 2; }
}
console.log(new Boxed(21).twice());
console.log(typeof Boxed);

// private members on a derived class
class Doubling extends Counter {
	#extra = 2;
	both() { return this.inc() + this.#extra; }
}
var dd = new Doubling("third");
console.log(dd.both());
console.log(dd.name());
console.log("after the private members");
