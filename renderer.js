document.addEventListener('DOMContentLoaded', function() {
    var editor = document.getElementById('code');

    // Function to perform syntax highlighting
    function highlightCode() {
        var selection = saveSelection(editor); // Save current selection
        
        // Get current plain text content
        var textContent = editor.textContent;

        // Clear the editor
        editor.innerHTML = '';

        // Regular expressions for different syntax elements
        var keywords = ['function', 'if', 'else', 'for', 'while', 'var', 'const', 'let'];
        var keywordPattern = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'g');
        var commentsPattern = /\/\/.*|\/\*[\s\S]*?\*\//g; // Matches both // comments and /* */ comments
        var stringPattern = /(['"])(?:\\.|[^\\])*?\1/g; // Matches strings within single or double quotes
        var numberPattern = /\b\d+\b/g; // Matches numbers

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
        while ((match = keywordPattern.exec(textContent)) !== null) {
            matches.push({ start: match.index, end: keywordPattern.lastIndex, className: 'keyword', text: match[0] });
        }
        while ((match = commentsPattern.exec(textContent)) !== null) {
            matches.push({ start: match.index, end: commentsPattern.lastIndex, className: 'comment', text: match[0] });
        }
        while ((match = stringPattern.exec(textContent)) !== null) {
            matches.push({ start: match.index, end: stringPattern.lastIndex, className: 'string', text: match[0] });
        }
        while ((match = numberPattern.exec(textContent)) !== null) {
            matches.push({ start: match.index, end: numberPattern.lastIndex, className: 'number', text: match[0] });
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
        var node, foundStart = false, stop = false;
    
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

            // Check if the previous text ends with '{'
            if (textBeforeCursor.endsWith('{')) {
                // Create a <div> element for new line with 4-space indentation
                var newline = document.createElement('div');
                newline.textContent = '\n    '; // 4 spaces for indentation

                range.deleteContents();
                range.insertNode(newline);

                // Move the cursor to the new line
                range.setStartAfter(newline);
                range.setEndAfter(newline);
                selection.removeAllRanges();
                selection.addRange(range);

                // Automatically insert closing '}'
                var closingBrace = document.createElement('div');
                closingBrace.textContent = '}';

                editor.appendChild(closingBrace);
                editor.appendChild(document.createElement('div')); // create an empty line after closing brace for better formatting

                // Move the cursor after the closing '}'
                var closingRange = document.createRange();
                closingRange.setStartBefore(closingBrace);
                closingRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(closingRange);

                // Trigger syntax highlighting after inserting new line and closing brace
                highlightCode();
            } else {
                // Normal behavior: create a new line without indentation
                var newline = document.createElement('div');
                newline.textContent = '\n';

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
