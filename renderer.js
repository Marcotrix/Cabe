document.addEventListener('DOMContentLoaded', function() {
	var editor = document.getElementById('code');

	function highlightCode() {
		var selection = saveSelection(editor); // Save current selection

		// Get current plain text content
		var textContent = editor.textContent;

		// Regular expressions for different syntax elements
		var patterns = [
			{ pattern: /\/\/.*|\/\*[\s\S]*?\*\//g, className: 'comment' }, // Matches both // comments and /* */ comments
			{ pattern: /(['"])(?:\\.|[^\\])*?\1/g, className: 'string' }, // Matches strings within single or double quotes
			{ pattern: /\b\d+\b/g, className: 'number' }, // Matches numbers
			{ pattern: new RegExp('\\b(function|if|else|for|while|var|const|let)\\b', 'g'), className: 'keyword' } // Matches keywords
		];

		// Array to store matched patterns with their positions
		var matches = [];
		var occupied = Array(textContent.length).fill(false);

		// Find matches for each pattern and mark occupied positions
		patterns.forEach(({ pattern, className }) => {
			let match;
			while ((match = pattern.exec(textContent)) !== null) {
				let start = match.index;
				let end = pattern.lastIndex;
				if (!occupied.slice(start, end).includes(true)) {
					matches.push({ start, end, className, text: match[0] });
					for (let i = start; i < end; i++) occupied[i] = true;
				}
			}
		});

		// Sort matches by their start position
		matches.sort((a, b) => a.start - b.start);

		// Create a DocumentFragment to hold the new content
		var fragment = document.createDocumentFragment();

		// Iterate over the text and apply syntax highlighting
		var index = 0;
		matches.forEach(function(match) {
			if (index < match.start) {
				fragment.appendChild(document.createTextNode(textContent.substring(index, match.start)));
			}
			var span = document.createElement('span');
			span.className = match.className;
			span.textContent = match.text;
			fragment.appendChild(span);
			index = match.end;
		});

		if (index < textContent.length) {
			fragment.appendChild(document.createTextNode(textContent.substring(index))); // Append remaining text
		}

		// Replace the content of the editor with the fragment
		editor.innerHTML = '';
		editor.appendChild(fragment);

		// Restore selection
		restoreSelection(editor, selection);
	}

	function saveSelection(containerEl) {
		var sel = window.getSelection();
		if (sel.rangeCount === 0) return null;

		var range = sel.getRangeAt(0);
		var preSelectionRange = range.cloneRange();
		preSelectionRange.selectNodeContents(containerEl);
		preSelectionRange.setEnd(range.startContainer, range.startOffset);

		var start = preSelectionRange.toString().length;

		return {
			start: start,
			end: start + range.toString().length
		};
	}

	function restoreSelection(containerEl, savedSel) {
		if (!savedSel) return;

		var charIndex = 0;
		var range = document.createRange();
		range.setStart(containerEl, 0);
		range.collapse(true);

		var nodeStack = [containerEl];
		var node, foundStart = false,
			stop = false;

		while (!stop && (node = nodeStack.pop())) {
			if (node.nodeType === 3) {
				var nextCharIndex = charIndex + node.length;
				if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
					range.setStart(node, savedSel.start - charIndex);
					foundStart = true;
				}
				if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
					range.setEnd(node, savedSel.end - charIndex);
					stop = true;
				}
				charIndex = nextCharIndex;
			} else {
				var i = node.childNodes.length;
				while (i--) {
					nodeStack.push(node.childNodes[i]);
				}
			}
		}

		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}

	// Perform initial syntax highlighting
	highlightCode();

	// Perform syntax highlighting on input change
	editor.addEventListener('input', highlightCode);

	// Handle Enter key to create newline and auto-indent
	editor.addEventListener('keydown', function(event) {
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevent default behavior (line break)

			var selection = window.getSelection();
			var range = selection.getRangeAt(0);
			var textBeforeCursor = range.startContainer.textContent.substring(0, range.startOffset);

			// Get the current line's indentation
			var currentLine = textBeforeCursor.split('\n').pop();
			var indentation = currentLine.match(/^\s*/)[0];

			// Create a <div> element for new line with same indentation
			var newline = document.createElement('div');
			newline.textContent = '\n' + indentation;

			// Check if previous line ends with '{'
			if (textBeforeCursor.endsWith('{')) {
				var closingBrace = document.createTextNode('}');
				editor.insertBefore(closingBrace, range.startContainer.nextSibling); // Insert closing brace after the new line
				newline.textContent += '    '; // Add extra indentation
			}

			// Insert the new line
			range.deleteContents();
			range.insertNode(newline);

			// Move the cursor to the new line
			range.setStartAfter(newline);
			range.setEndAfter(newline);
			selection.removeAllRanges();
			selection.addRange(range);

			// Trigger syntax highlighting after inserting new line
			highlightCode();
		}
	});

	// Handle Tab key for indentation
	editor.addEventListener('keydown', function(event) {
		if (event.key === 'Tab') {
			event.preventDefault(); // Prevent default tab behavior

			// Get current selection and range
			var selection = window.getSelection();
			var range = selection.getRangeAt(0);

			// Insert 4 spaces at the current cursor position
			var spaces = document.createTextNode('    ');
			range.insertNode(spaces);

			// Move the cursor after the inserted spaces
			range.setStartAfter(spaces);
			range.setEndAfter(spaces);
			selection.removeAllRanges();
			selection.addRange(range);

			// Trigger syntax highlighting after inserting indent
			highlightCode();
		}
	});

});
