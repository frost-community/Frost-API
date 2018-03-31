const readLine = require('./readline');
const { delay } = require('./helpers/GeneralHelper');

class ConsoleMenu {
	constructor() {
		this.isExit = false;
		this.items = [];
	}
	add(description, func) {
		this.items.push({ description, func });
	}
	async show() {
		while(!this.isExit) {
			console.log();
			console.log('<Menu>');
			for(let i = 0; i < this.items.length; i++) {
				console.log(`${i}: ${this.items[i].description}`);
			}
			const index = parseInt(await readLine('> '));
			if (Number.isInteger(index) && index < this.items.length) {
				await this.items[index].func({ exit: () => { this.isExit = true; }});
			}
			await delay(300);
		}
	}
}
module.exports = ConsoleMenu;
