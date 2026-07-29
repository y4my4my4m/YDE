// class inheritance: extends, super(), super.method(), instanceof

class Animal {
	constructor(name) {
		this.name = name;
	}
	speak() {
		return this.name + " makes a noise";
	}
	kind() {
		return "animal";
	}
}

class Dog extends Animal {
	constructor(name, breed) {
		super(name);
		this.breed = breed;
	}
	speak() {
		return super.speak() + " (woof)";
	}
	kind() {
		return "dog:" + super.kind();
	}
}

class Puppy extends Dog {
	constructor(name) {
		super(name, "lab");
		this.small = true;
	}
	speak() {
		return super.speak() + " (yip)";
	}
}

var a = new Animal("generic");
var d = new Dog("rex", "shepherd");
var p = new Puppy("bitsy");

console.log(a.speak());
console.log(d.name + "/" + d.breed);
console.log(d.speak());
console.log(d.kind());
console.log(p.name + "/" + p.breed);
console.log(p.speak());
console.log(p instanceof Puppy);
console.log(p instanceof Dog);
console.log(p instanceof Animal);
