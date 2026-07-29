// class extends / super. Currently the superclass is parsed and discarded.
class Animal {
	constructor(name) { this.name = name; }
	speak() { return this.name + " makes a noise"; }
	kind() { return "animal"; }
}
class Dog extends Animal {
	constructor(name) { super(name); this.legs = 4; }
	speak() { return super.speak() + " (a bark)"; }
}
var d = new Dog("Rex");
console.log(d.name);
console.log(d.legs);
console.log(d.speak());
console.log(d.kind());          // inherited, not overridden
console.log(d instanceof Dog);
console.log(d instanceof Animal);

// three levels deep
class Puppy extends Dog {
	speak() { return "small: " + super.speak(); }
}
var p = new Puppy("Bit");
console.log(p.speak());
console.log(p.legs);
console.log(p.kind());
