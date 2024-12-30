import { RichTextTransformer, richTextStyles } from './richtext.js';

// Initialize the transformer
const transformer = new RichTextTransformer({
    breaks: true,
    gfm: true
});

// Export for compatibility with existing code
export function initializeMarked() {
    // No-op as we're using our own transformer now
}

// Export the transform function
export function transformMarkdown(content) {
    try {
        return transformer.transform(content);
    } catch (error) {
        console.error('Markdown transformation error:', error);
        return `<pre class="agent13-error">Error transforming markdown: ${error.message}</pre>`;
    }
}

// Add custom plugins if needed
transformer.registerPlugin('custom-block', {
    test: (block) => block.type === 'custom-block',
    transform: (block) => {
        return `<div class="custom-block">${block.content}</div>`;
    }
});

// Export styles
export const markdownStyles = `
${richTextStyles}

/* Code Blocks */
.agent13-code-container {
    overflow-x: auto;
}

.agent13-code-block {
    padding: 12px 16px;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.5;
}

.agent13-line-numbers {
    min-width: 2em;
    opacity: 0.5;
}

/* Inline Code */
.agent13-response code:not(.agent13-code-block code) {
    background: var(--bg-primary);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.9em;
    color: var(--text-primary);
}

/* Blockquotes */
.agent13-blockquote {
    border-left: 3px solid var(--accent);
    margin: 1em 0;
    padding: 0.5em 0 0.5em 1em;
    color: var(--text-secondary);
    background: var(--bg-primary);
    border-radius: 4px;
}

/* Tables */
.agent13-table-container {
    overflow-x: auto;
    margin: 1em 0;
    border-radius: 6px;
    border: 1px solid var(--border);
}

.agent13-table-container table {
    width: 100%;
    border-collapse: collapse;
}

.agent13-table-container th {
    background: var(--bg-primary);
    border-bottom: 2px solid var(--border);
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
}

.agent13-table-container td {
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
}

.agent13-table-container tr:last-child td {
    border-bottom: none;
}

/* Lists */
.agent13-response ul,
.agent13-response ol {
    padding-left: 2em;
    margin: 0.8em 0;
}

.agent13-response li {
    margin: 0.4em 0;
}

/* Task Lists */
.agent13-response ul.contains-task-list {
    list-style: none;
    padding-left: 1em;
}

.agent13-response .task-list-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.agent13-response .task-list-item input[type="checkbox"] {
    margin: 0;
    cursor: default;
}

/* Headings */
.agent13-response h1,
.agent13-response h2,
.agent13-response h3,
.agent13-response h4,
.agent13-response h5,
.agent13-response h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    color: var(--text-primary);
}

.agent13-response h1 { font-size: 1.5em; }
.agent13-response h2 { font-size: 1.3em; }
.agent13-response h3 { font-size: 1.2em; }
.agent13-response h4 { font-size: 1.1em; }
.agent13-response h5 { font-size: 1em; }
.agent13-response h6 { font-size: 0.9em; }

/* Links */
.agent13-response a {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color var(--transition-fast);
}

.agent13-response a:hover {
    border-bottom-color: var(--accent);
}

/* Images */
.agent13-response img {
    max-width: 100%;
    border-radius: 6px;
    margin: 1em 0;
}
`;
