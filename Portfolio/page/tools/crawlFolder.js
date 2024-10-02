const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const minimist = require('minimist');

// Function to recursively scan the directory
async function scanDirectory(dirPath) {
    let results = [];

    async function scanRecursive(directory) {
        const files = await fs.promises.readdir(directory, { withFileTypes: true });

        for (const file of files) {
            const filePath = path.join(directory, file.name);
            const stat = await fs.promises.stat(filePath);

            if (file.isDirectory()) {
                await scanRecursive(filePath);  // Recursively scan sub-directories
            } else {
                let content = '';

                console.log(`|| Working on : ${file.name}`)
                // If the file is HTML, parse and extract visible text
                if (path.extname(file.name).toLowerCase() === '.html') {
                    const htmlContent = await fs.promises.readFile(filePath, 'utf8');
                    const dom = new JSDOM(htmlContent);
                    const document = dom.window.document;

                    // Extract visible text nodes
                    content = extractVisibleText(document.body, dom);
                    console.log(content)
                } else {
                    // Read raw content for non-HTML files
                    content = await fs.promises.readFile(filePath, 'utf8');
                }

                // Store file info
                results.push({
                    path: filePath,
                    content: content,
                    modifiedTime: stat.mtime
                });
            }
        }
    }

    await scanRecursive(dirPath);
    return results;
}

// Function to extract visible text from an HTML document
function extractVisibleText(element, dom) {
    let visibleText = '';

    // Recursively walk through all nodes and collect visible text
    function walk(node) {
        // Only consider text nodes and elements that are not scripts, styles, or invisible elements
        if (node.nodeType === node.TEXT_NODE) {
            visibleText += node.nodeValue.trim() + ' ';
        } else if (node.nodeType === node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            // Ignore certain tags that do not contain visible text
            const hiddenTags = ['script', 'style', 'noscript', 'meta', 'link', 'img', 'svg'];
            const hiddenDisplay = ['none', 'hidden'];

            // Skip elements with non-visible styles (like display:none or visibility:hidden)
            const computedStyle = dom.window.getComputedStyle(node);
            if (!hiddenTags.includes(tagName) && !hiddenDisplay.includes(computedStyle.display)) {
                node.childNodes.forEach(walk);  // Recursively visit child nodes
            }
        }
    }

    walk(element);
    return visibleText.trim();
}

// Parse CLI arguments using minimist
const args = minimist(process.argv.slice(2));

// Get directory paths from CLI arguments
const crawlFolder = args.crawlFolder;
const saveJsonTo = args.saveJsonTo;

if (!crawlFolder || !saveJsonTo) {
    console.error('Error: Please provide both --crawlFolder and --saveJsonTo arguments.');
    process.exit(1);  // Exit with failure
}

// Start scanning the directory
scanDirectory(crawlFolder)
    .then(results => {
        // Save results to a JSON file
        const jsonOutputPath = path.join(saveJsonTo, 'scan_results.json');
        fs.promises.writeFile(jsonOutputPath, JSON.stringify(results, null, 2), 'utf8')
            .then(() => {
                console.log(`Results saved to ${jsonOutputPath}`);
            })
            .catch(err => {
                console.error('Error saving results to JSON:', err);
            });
    })
    .catch(err => {
        console.error('Error during scanning:', err);
    });
