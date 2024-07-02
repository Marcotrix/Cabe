document.addEventListener('DOMContentLoaded', function() {
	var editor = document.getElementById('code');

	function highlightCode() {
		var selection = saveSelection(editor); // Save current selection

		// Get current plain text content
		var textContent = editor.textContent;

		// Clear the editor
		editor.innerHTML = '';

		// Regular expressions for different syntax elements
		var commentsPattern = /\/\/.*|\/\*[\s\S]*?\*\//g; // Matches both // comments and /* */ comments
		var stringPattern = /(['"])(?:\\.|[^\\])*?\1/g; // Matches strings within single or double quotes
		var numberPattern = /\b\d+\b/g; // Matches numbers
		var keywords = ['function', 'if', 'else', 'for', 'while', 'var', 'const', 'let'];
		var keywordPattern = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'g');

		// Function to replace text with highlighted span
		function replaceWithSpan(className, match) {
			var span = document.createElement('span');
			span.className = className;
			span.textContent = match;
			return span;
		}

		// Array to store matched patterns with their positions
		var matches = [];

		// Find matches for each pattern
		var match;
		while ((match = commentsPattern.exec(textContent)) !== null) {
			matches.push({
				start: match.index,
				end: commentsPattern.lastIndex,
				className: 'comment',
				text: match[0]
			});
		}
		while ((match = stringPattern.exec(textContent)) !== null) {
			// Check if this match overlaps with any existing matches from comments
			var overlaps = matches.some(function(m) {
				return (match.index >= m.start && match.index < m.end) ||
					(stringPattern.lastIndex > m.start && stringPattern.lastIndex <= m.end);
			});
			if (!overlaps) {
				matches.push({
					start: match.index,
					end: stringPattern.lastIndex,
					className: 'string',
					text: match[0]
				});
			}
		}
		while ((match = numberPattern.exec(textContent)) !== null) {
			// Check if this match overlaps with any existing matches from comments or strings
			var overlaps = matches.some(function(m) {
				return (match.index >= m.start && match.index < m.end) ||
					(numberPattern.lastIndex > m.start && numberPattern.lastIndex <= m.end);
			});
			if (!overlaps) {
				matches.push({
					start: match.index,
					end: numberPattern.lastIndex,
					className: 'number',
					text: match[0]
				});
			}
		}
		while ((match = keywordPattern.exec(textContent)) !== null) {
			// Check if this match overlaps with any existing matches from comments, strings, or numbers
			var overlaps = matches.some(function(m) {
				return (match.index >= m.start && match.index < m.end) ||
					(keywordPattern.lastIndex > m.start && keywordPattern.lastIndex <= m.end);
			});
			if (!overlaps) {
				matches.push({
					start: match.index,
					end: keywordPattern.lastIndex,
					className: 'keyword',
					text: match[0]
				});
			}
		}

		// Sort matches by their start position
		matches.sort((a, b) => a.start - b.start);

		// Iterate over the text and apply syntax highlighting
		var index = 0;
		matches.forEach(function(match) {
			editor.appendChild(document.createTextNode(textContent.substring(index, match.start)));
			editor.appendChild(replaceWithSpan(match.className, match.text));
			index = match.end;
		});

		editor.appendChild(document.createTextNode(textContent.substring(index))); // Append remaining text

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
	editor.addEventListener('input', function() {
		highlightCode();
	});

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
