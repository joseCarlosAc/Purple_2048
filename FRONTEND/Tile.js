"use strict";

export default class Tile {
	#tileElement;
	#x;
	#y;
	#value;

	constructor(tileContainer, value = Math.random() > 0.2 ? 2 : 4, x = undefined, y = undefined) {
		this.#tileElement = document.createElement("div");
		this.#tileElement.classList.add("tile");
		tileContainer.append(this.#tileElement);
		this.value = value;
		this.#tileElement.classList.add("t" + value);
		if (x != undefined && y != undefined) {
			this.#x = x;
			this.#y = y;
		}
	}

	get value() {
		return this.#value;
	}

	get x() {
		return this.#x;
	}

	get y() {
		return this.#y;
	}

	set value(v) {
		this.#value = v;
		this.#tileElement.textContent = v;
		let classes = this.#tileElement.classList;
		for (let i = classes.length + 1; i >= 0; i--) {
			if (classes[i] != "tile") this.#tileElement.classList.remove(classes[i]);
		}
		this.#tileElement.classList.add("t" + v);
	}

	set x(value) {
		this.#x = value;
		this.#tileElement.style.setProperty("--x", value);
	}

	set y(value) {
		this.#y = value;
		this.#tileElement.style.setProperty("--y", value);
	}

	remove() {
		this.#tileElement.remove();
	}

	waitForTransition(animation = false) {
		return new Promise((resolve) => {
			this.#tileElement.addEventListener(animation ? "animationend" : "transitionend", resolve, {
				once: true,
			});
		});
	}
}
