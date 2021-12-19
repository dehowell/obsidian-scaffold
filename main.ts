import { Plugin } from 'obsidian';

const MARKDOWN_LINK = /\[(?<linktext>.*?)\]\((?<url>.*?)\)/;
const BEAR_TITLE_LINE = /^\["(?<title>.*?)", (?<author>.*?), (?<publication>.*?)\]\((?<url>.*?)\)$/;

function trimTrailingWhitespace(content: string): string {
	return content.replace(/ +$/gm, "");;
}

function makePunctuationDumb(content: string): string {
	return content
		.replace(/‘|’/g, "'")
		.replace(/(“|”)/g, "\"");
}

function standardizeText(content: string): string {
	return trimTrailingWhitespace(makePunctuationDumb(content));
}

function findFirstLink(content: string): string {
	let match = content.match(MARKDOWN_LINK);
	if (match) {
		return match.groups['url'];
	} else {
		return undefined;
	}
}

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
			id: 'standarize-text',
			name: 'Standardize Text',
			callback: () => {},
			editorCallback: (editor, view) => {
				let content = editor.getValue();
				let position = editor.getCursor();
				let standardized = standardizeText(content);
				editor.setValue(standardized);
				editor.setCursor(position);
			}
		});

		this.addCommand({
			id: 'reformat-bear-note',
			name: 'Reformat Bear Note',
			callback: () => {},
			editorCallback: (editor, view) => {
				let position = editor.getCursor();
				let content = standardizeText(editor.getValue());
				let lines = content.split("\n");
				let firstLine = lines.shift();
				let rest = lines.join("\n");
				
				let match = firstLine.match(BEAR_TITLE_LINE);
				if (match) {
					let newContent = [
						`# [${match.groups.title}](${match.groups.url})`,
						match.groups.author,
						match.groups.publication,
						"#ref/article",
						rest
					].join("\n");

					editor.setValue(newContent);
					editor.setCursor(position);
				}
			}
		});

		this.addCommand({
			id: 'find-in-devonthink',
			name: 'Find in DEVONthink',
			callback: () => {},
			editorCallback: (editor, view) => {
				let url = findFirstLink(editor.getValue());
				if (url) {
					// construct DEVONthink search URL
					let dtUrl = `x-devonthink://search?query=url:${url}`;
					// open the DEVONthink URL
					open(dtUrl);
				}	
			}
		});

		this.addCommand({
			id: 'open-in-omnifocus',
			name: 'Find note as OmniFocus project',
			checkCallback: (checking: boolean) => {
				let activeFile = this.app.workspace.getActiveFile();
				let metadata = this.app.metadataCache.getFileCache(activeFile);
				let isProjectNote = metadata.tags?.findIndex(t => t.tag == "#project") > -1;
				if (checking) return isProjectNote;

				let script = `argument.forEach(arg => {
					let match = projectsMatching(arg);
					if (match.length > 0) {
						let project = match[0];
						let key = project.id.primaryKey;
						let url = URL.fromString("omnifocus://task/" + key);
						url.open();
					} else {
						// not found, create from scratch?
					}
				})`

				let encodedScript = encodeURIComponent(script);
				let arg = encodeURIComponent(JSON.stringify([activeFile.basename]));
				let scriptUrl = `omnifocus://localhost/omnijs-run?script=${encodedScript}&arg=${arg}`;
				open(scriptUrl);
			}
		});

		this.addCommand({
			id: 'move-tags-to-heading',
			name: 'Move tags to heading',
			callback: () => {},
			editorCallback: (editor, view) => {
				/**
				 * Moves the contents of the `tags` frontmatter field to just below 
				 * the heading (i.e. first block of text in the document).
				 */
				
				// Does this file have any tags in the frontmatter?
				let metadata = this.app.metadataCache.getFileCache(view.file);
				if (metadata.frontmatter && metadata.frontmatter.tags) {
					// construct string of inline tags
					let tags = metadata.frontmatter.tags;
					let inlineTags = tags.split(" ")
						.map((s: string) => "#"+s)
						.join(" ") + "\n";

					// remember the cursor position to restore it after edits
					let cursor = editor.getCursor();

					// insert the tag string below the heading
					let content = editor.getValue();
					let endOfHeadingPosition = editor.offsetToPos(content.search(/(?<=\n)\n/));
					editor.replaceRange(inlineTags, endOfHeadingPosition, endOfHeadingPosition);

					// remove tags from frontmatter
					let excluded = new Set(["tags", "position"]);
					let otherFields = Object.keys(metadata.frontmatter)
						.filter((s: string) => !excluded.has(s));
					if (otherFields.length == 0) {
						// remove the frontmatter if nothing else is there but tags field
						let frontmatter = metadata.frontmatter.position;
						editor.replaceRange("",
							editor.offsetToPos(frontmatter.start.offset),
							editor.offsetToPos(frontmatter.end.offset));
					} else {
						// just remove the tags field
						let match = content.match(/tags: .*?\n/);
						if (match) {
							let tagsStart = editor.offsetToPos(match.index);
							let tagsEnd = editor.offsetToPos(match.index + match[0].length);
							editor.replaceRange("", tagsStart, tagsEnd);
						}
					}

					// reset the cursor
					editor.setCursor(cursor);
				}
			}
		});
	}

	onunload() {
	}
}
