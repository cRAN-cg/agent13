// Rich Text Transformer with Plugin System
export class RichTextTransformer {
    constructor(options = {}) {
        this.options = {
            breaks: true,
            gfm: true,
            ...options
        };
        
        this.plugins = new Map();
        this.registerDefaultPlugins();
    }

    // Plugin System
    registerPlugin(type, handler) {
        this.plugins.set(type, handler);
    }

    registerDefaultPlugins() {
        // Code Block Plugin
        this.registerPlugin('code', {
            test: (block) => block.type === 'code',
            transform: (block) => {
                const { content, language } = block;
                // Clean up the content
                const cleanContent = content.trim();
                const highlightedCode = this.highlightCode(cleanContent, language);
                
                // Split into lines and wrap each in a line container
                const contentLines = cleanContent.split('\n');
                const wrappedLines = contentLines.map(line => 
                    `<div class="agent13-line">${line}</div>`
                ).join('\n');
                
                return `
                    <div class="agent13-code-container">
                        <pre class="agent13-code-block${language ? ` language-${language}` : ''}" data-language="${language || 'text'}" data-line-count="${contentLines.length}"><code>${wrappedLines}</code></pre>
                    </div>`;
            }
        });

        // Blockquote Plugin
        this.registerPlugin('blockquote', {
            test: (block) => block.type === 'blockquote',
            transform: (block) => {
                return `<blockquote class="agent13-blockquote">${block.content}</blockquote>`;
            }
        });

        // Table Plugin
        this.registerPlugin('table', {
            test: (block) => block.type === 'table',
            transform: (block) => {
                const { header, body } = block;
                return `
                    <div class="agent13-table-container">
                        <table>
                            <thead>${header}</thead>
                            <tbody>${body}</tbody>
                        </table>
                    </div>
                `;
            }
        });
    }

    // Syntax Highlighting
    highlightCode(code, language) {
        try {
            // Enhanced HTML escaping and special character preservation
            code = code
                // First escape HTML special characters
                .replace(/[<>&"'`]/g, char => ({
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;',
                    '"': '&quot;',
                    "'": '&#39;',
                    '`': '&#96;'
                }[char]))
                // Preserve whitespace characters
                .replace(/\t/g, '    ') // Convert tabs to 4 spaces
                .replace(/ /g, '&nbsp;') // Preserve spaces
                .replace(/\r?\n/g, '\n'); // Normalize line endings

            // Language-specific patterns
            const patterns = {
                // Keywords
                keyword: /\b(function|class|const|let|var|if|else|return|import|export|from|try|catch|throw|new|this|extends|static|async|await|for|while|do|break|continue|switch|case|default|null|undefined|true|false)\b/g,
                
                // Built-in types and functions
                builtin: /\b(Array|Object|String|Number|Boolean|RegExp|Map|Set|Promise|Date|Math|console|parseInt|parseFloat|setTimeout|setInterval)\b/g,
                
                // Numbers (including hex, binary, scientific notation)
                number: /\b(0x[\da-f]+|0b[01]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/gi,
                
                // Strings (single quote, double quote, template literals)
                string: /(["'`])((?:\\.|(?!\1)[^\\])*)\1|`(?:\\[\s\S]|\${(?:[^{}]|{[^}]*})*}|[^\\`])*`/g,
                
                // Template literal expressions
                template: /\$\{(?:[^{}]|{[^}]*})*\}/g,
                
                // Comments (single line and multi-line)
                comment: /\/\/.*?(?=\n|$)|\/\*[\s\S]*?\*\//g,
                
                // Functions and methods
                function: /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g,
                
                // Class names (including after new, extends)
                class: /\b([A-Z][\w$]*)\b/g,
                
                // Variables and parameters
                variable: /\b([a-z_$][\w$]*)\b/g,
                
                // Operators
                operator: /([+\-*/%=!<>]=?|&&|\|\||=>|\?|:|\.{3}|\??\.|\+\+|--)/g,
                
                // Punctuation
                punctuation: /[{}[\]();,]/g
            };

            // Store matches to prevent double-highlighting
            const matches = new Map();
            
            // Apply syntax highlighting in specific order
            let highlighted = code;
            
            // Comments first (to avoid highlighting inside comments)
            highlighted = highlighted.replace(patterns.comment, match => {
                const token = `__COMMENT_${matches.size}__`;
                matches.set(token, `<span class="token comment">${match}</span>`);
                return token;
            });

            // Strings next (to avoid highlighting inside strings)
            highlighted = highlighted.replace(patterns.string, (match, quote, content) => {
                const token = `__STRING_${matches.size}__`;
                matches.set(token, `<span class="token string">${match}</span>`);
                return token;
            });

            // Template literal expressions
            highlighted = highlighted.replace(patterns.template, match => {
                const token = `__TEMPLATE_${matches.size}__`;
                matches.set(token, `<span class="token template-expression">${match}</span>`);
                return token;
            });

            // Other patterns in order of specificity
            const tokenOrder = [
                'keyword',
                'builtin',
                'class',
                'function',
                'number',
                'operator',
                'punctuation',
                'variable'
            ];

            tokenOrder.forEach(type => {
                highlighted = highlighted.replace(patterns[type], match => {
                    const token = `__${type.toUpperCase()}_${matches.size}__`;
                    matches.set(token, `<span class="token ${type}">${match}</span>`);
                    return token;
                });
            });

            // Restore tokens in reverse order
            for (const [token, html] of Array.from(matches.entries()).reverse()) {
                highlighted = highlighted.replace(token, html);
            }

            return highlighted;
        } catch (error) {
            console.error('Syntax highlighting error:', error);
            return code; // Fallback to plain code
        }
    }

    // Main Transform Method
    transform(content) {
        try {
            const blocks = this.parseBlocks(content);
            return blocks.map(block => this.transformBlock(block)).join('\n');
        } catch (error) {
            console.error('Transform error:', error);
            return `<pre class="agent13-error">Error transforming content: ${error.message}</pre>`;
        }
    }

    // Block Parsing
    parseBlocks(content) {
        const blocks = [];
        const lines = content.split('\n');
        let currentBlock = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code block detection
            if (line.startsWith('```')) {
                if (currentBlock?.type === 'code') {
                    blocks.push(currentBlock);
                    currentBlock = null;
                } else {
                    const language = line.slice(3).trim();
                    currentBlock = {
                        type: 'code',
                        language,
                        content: ''
                    };
                }
                continue;
            }

            // Handle code block content
            if (currentBlock?.type === 'code') {
                currentBlock.content += line + '\n';
                continue;
            }

            // Blockquote detection
            if (line.startsWith('>')) {
                if (currentBlock?.type !== 'blockquote') {
                    currentBlock = {
                        type: 'blockquote',
                        content: ''
                    };
                }
                // Properly escape > character in blockquotes
                const content = line.slice(1).trim().replace(/>/g, '&gt;');
                currentBlock.content += content + ' ';
                continue;
            }

            // Table detection
            if (line.includes('|')) {
                if (currentBlock?.type !== 'table') {
                    currentBlock = {
                        type: 'table',
                        header: '',
                        body: '',
                        isHeader: true
                    };
                }
                
                const cells = line.split('|')
                    .filter(cell => cell.trim())
                    .map(cell => `<td>${cell.trim()}</td>`)
                    .join('');

                if (currentBlock.isHeader) {
                    currentBlock.header = `<tr>${cells}</tr>`;
                    currentBlock.isHeader = false;
                } else if (!line.includes('---')) {
                    currentBlock.body += `<tr>${cells}</tr>`;
                }
                continue;
            }

            // Push completed blocks
            if (currentBlock && line.trim() === '') {
                blocks.push(currentBlock);
                currentBlock = null;
                continue;
            }

            // Regular text
            if (line.trim() !== '') {
                blocks.push({
                    type: 'text',
                    content: line
                });
            }
        }

        // Push final block if exists
        if (currentBlock) {
            blocks.push(currentBlock);
        }

        return blocks;
    }

    // Block Transformation
    transformBlock(block) {
        for (const [_, plugin] of this.plugins) {
            if (plugin.test(block)) {
                return plugin.transform(block);
            }
        }

        // Default text transformation
        return `<p>${this.transformInlineElements(block.content)}</p>`;
    }

    // Inline Element Transformation
    transformInlineElements(text) {
        return text
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    }
}

// Export styles for the transformer
export const richTextStyles = `
.token.keyword {
    color: hsl(35, 90%, 75%);  /* Warm orange like Catbus */
    font-weight: 500;
}

.token.builtin {
    color: hsl(210, 70%, 75%);  /* Soft blue like Totoro's fur */
}

.token.function {
    color: hsl(45, 85%, 75%);  /* Warm yellow like sunlight */
}

.token.class {
    color: hsl(140, 60%, 70%);  /* Forest green */
    font-weight: 500;
}

.token.string {
    color: hsl(95, 60%, 75%);  /* Light forest green */
}

.token.number {
    color: hsl(35, 85%, 70%);  /* Muted orange */
}

.token.comment {
    color: hsl(210, 30%, 60%);  /* Soft blue-grey */
    font-style: italic;
}

.token.variable {
    color: hsl(210, 65%, 75%);  /* Light blue like sky */
}

.token.operator {
    color: hsl(45, 70%, 75%);  /* Soft yellow */
}

.token.punctuation {
    color: hsl(210, 30%, 75%);  /* Light blue-grey */
}

.token.template-expression {
    color: hsl(140, 70%, 75%);  /* Bright forest green */
}

.agent13-error {
    color: var(--error);
    background: var(--error-muted);
    padding: 1em;
    border-radius: 4px;
    margin: 1em 0;
}

.agent13-code-container {
    position: relative;
    background: var(--surface-1);
    border: 1px solid var(--border-primary);
    border-radius: 10px;
    margin: 1em 0;
    overflow: hidden;
}

.agent13-code-block {
    margin: 0;
    border: none;
    background: transparent;
    padding: 1em 0;
    overflow-x: auto;
    tab-size: 4;
    -moz-tab-size: 4;
    counter-reset: line;
    position: relative;
}

.agent13-code-block::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3.5em;
    background: var(--surface-2);
    border-right: 1px solid var(--border-primary);
    z-index: 1;
}

.agent13-code-block code {
    display: block;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
    white-space: pre;
    padding-left: 3.5em;
    position: relative;
    z-index: 2;
}

.agent13-line {
    counter-increment: line;
    position: relative;
    padding: 0 1em;
    min-height: 1.6em;
}

.agent13-line:hover {
    background: rgba(255, 255, 255, 0.05);
}

.agent13-line::before {
    content: counter(line);
    position: absolute;
    left: -3em;
    width: 2em;
    text-align: right;
    color: var(--text-tertiary);
    opacity: 0.5;
    font-size: 12px;
    user-select: none;
    pointer-events: none;
    padding-top: 1px;
}

.agent13-line:hover::before {
    opacity: 0.8;
}

`;
