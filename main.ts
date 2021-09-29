import { Plugin } from 'obsidian';

const BEAR_TITLE_LINE = /^\["(?<title>.*?)", (?<author>.*?), (?<publication>.*?)\]\((?<url>.*?)\)$/;
export default class DaveScaffoldingPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'paste-as-blockquote',
			name: 'Paste as Blockquote',
			hotkeys: [{'modifiers': ['Ctrl', 'Mod'], 'key': 'v'}],
			callback: () => {},
			editorCallback: async (editor, view) => {
				// get contents of clipboard
				let clipboard = await navigator.clipboard.readText();

				// format as blockquote plus hr
				let blockquote = `> ${clipboard}\n\n---\n`

				// insert text
				editor.replaceSelection(blockquote);
			}
		});

		this.addCommand({
			id: 'trim-trailing-whitespace',
			name: 'Trim Trailing Whitespace',
			callback: () => {},
			editorCallback: (editor, view) => {
				let content = editor.getValue();
				let position = editor.getCursor();
				let trimmedContent = content.replace(/ +$/gm, "");
				editor.setValue(trimmedContent);
				editor.setCursor(position);
			}
		});

		this.addCommand({
			id: 'replace-smart-punctuation',
			name: 'Make Punctuation Dumb',
			callback: () => {},
			editorCallback: (editor, view) => {
				let position = editor.getCursor();
				let content = editor.getValue();
				let newContent = content
					.replace(/‘|’/g, "'")
					.replace(/(“|”)/g, "\"");
				editor.setValue(newContent);
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
