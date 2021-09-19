import { Plugin } from 'obsidian';

export default class DaveScaffoldingPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'trim-trailing-whitespace',
			name: 'Trim Trailing Whitespace',
			callback: () => {
				console.log("foo");
			},
			editorCallback: (editor, view) => {
				let content = editor.getValue();
				let position = editor.getCursor();
				let trimmedContent = content.replace(/ +$/gm, "");
				editor.setValue(trimmedContent);
				editor.setCursor(position);
			}
		});
	}

	onunload() {
	}
}
