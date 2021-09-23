import { Plugin } from 'obsidian';

const BEAR_TITLE_LINE = /^\["(?<title>.*?)", (?<author>.*?), (?<publication>.*?)\]\((?<url>.*?)\)$/;
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

		this.addCommand({
			id: 'reformat-bear-title-line',
			name: 'Reformat Bear Title Line',
			callback: () => {},
			editorCallback: (editor, view) => {
				let position = editor.getCursor();
				let content = editor.getValue();
				let lines = content.split("\n");
				let firstLine = lines.shift();
				let rest = lines.join("\n");
				
				let match = firstLine.match(BEAR_TITLE_LINE);
				if (match) {
					let newContent = [
						`# [${match.groups.title}](${match.groups.url})`,
						match.groups.author,
						match.groups.publication,
						`#refnote #type/literature/article`,
						rest
					].join("\n");

					editor.setValue(newContent);
					editor.setCursor(position);
				}
			}
		});
	}

	onunload() {
	}
}
