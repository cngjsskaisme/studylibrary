const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const minimist = require('minimist');
const pdfParse = require('pdf-parse');
const { Document } = require('docx');
const pptx2json = require('pptx2json');

// Function to recursively scan the directory
async function scanDirectory(dirPath, jsonOutputPath) {
    let results = [];
    let count = 0;
    
    async function writeResultsToJson() {
        try {
            await fs.promises.writeFile(jsonOutputPath, JSON.stringify(results, null, 2), 'utf8');
            console.log(`Progress: ${count} files processed and saved.`);
        } catch (err) {
            console.error('Error writing to JSON:', err);
        }
    }

    async function scanRecursive(directory) {
        const files = await fs.promises.readdir(directory, { withFileTypes: true });

        for (const file of files) {
            const filePath = path.join(directory, file.name);
            const stat = await fs.promises.stat(filePath);

            if (file.isDirectory()) {
                await scanRecursive(filePath);  // Recursively scan sub-directories
            } else {
                let content = '';
                const ext = path.extname(file.name).toLowerCase();

                // Skip image files
                if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext)) {
                    console.log(`Skipping image file: ${file.name}`);
                    continue;
                }

                console.log(`|| Working on : ${file.name}`);

                try {
                    if (ext === '.html') {
                        const htmlContent = await fs.promises.readFile(filePath, 'utf8');
                        const dom = new JSDOM(htmlContent);
                        const document = dom.window.document;
                        content = extractVisibleText(document.body, dom);

                    } else if (ext === '.pdf') {
                        const pdfBuffer = await fs.promises.readFile(filePath);
                        
                        // Try extracting text from the PDF, trying password '950715' if it's encrypted
                        try {
                            const pdfData = await pdfParse(pdfBuffer);
                            content = pdfData.text;
                        } catch (err) {
                            if (err.isPassword) {
                                console.log(`PDF is password-protected. Trying password...`);
                                try {
                                    const pdfData = await pdfParse(pdfBuffer, { password: '950715' });
                                    content = pdfData.text;
                                    console.log(`Password succeeded for: ${file.name}`);
                                } catch (passwordError) {
                                    console.error(`Failed to open password-protected PDF: ${file.name}`);
                                    content = '[Password Protected]';
                                }
                            } else {
                                throw err;
                            }
                        }

                    } else if (ext === '.docx') {
                        const docBuffer = await fs.promises.readFile(filePath);
                        const doc = new Document(docBuffer);
                        content = doc.getText();

                    } else if (ext === '.pptx') {
                        // Use pptx2json to extract text from PowerPoint files
                        await new Promise((resolve, reject) => {
                            pptx2json(filePath, (err, data) => {
                                if (err) {
                                    console.error(`Error processing PPTX file ${file.name}:`, err);
                                    content = 'Error occurred';
                                    reject(err);
                                } else {
                                    content = JSON.stringify(data);
                                    resolve();
                                }
                            });
                        });

                    } else {
                        // Read raw content for non-special files
                        content = await fs.promises.readFile(filePath, 'utf8');
                    }

                } catch (err) {
                    // Log the error for debugging purposes
                    console.error(`Error processing file ${file.name}:`, err);

                    // Add an entry to the results indicating an error occurred
                    content = 'Error occurred';
                }

                // Store file info (including error content if applicable)
                results.push({
                    path: filePath,
                    content: content,
                    modifiedTime: stat.mtime
                });

                count++;

                // Save progress to JSON after processing each file
                await writeResultsToJson();
            }
        }
    }

    await scanRecursive(dirPath);
    return results;
}

// Function to extract visible text from an HTML document
function extractVisibleText(element, dom) {
    let visibleText = '';

    function walk(node) {
        if (node.nodeType === node.TEXT_NODE) {
            visibleText += node.nodeValue.trim() + ' ';
        } else if (node.nodeType === node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            const hiddenTags = ['script', 'style', 'noscript', 'meta', 'link', 'img', 'svg'];
            const hiddenDisplay = ['none', 'hidden'];

            if (!dom.window) return;
            const computedStyle = dom.window.getComputedStyle(node);
            if (!hiddenTags.includes(tagName) && !hiddenDisplay.includes(computedStyle.display)) {
                if (node.childNodes) {
                    node.childNodes.forEach(walk);
                }
            }
        }
    }

    walk(element);
    return visibleText.trim();
}

// Parse CLI arguments using minimist
const args = minimist(process.argv.slice(2));
const crawlFolder = args.crawlFolder;
const saveJsonTo = args.saveJsonTo;

if (!crawlFolder || !saveJsonTo) {
    console.error('Error: Please provide both --crawlFolder and --saveJsonTo arguments.');
    process.exit(1);
}

// Start scanning the directory
const jsonOutputPath = path.join(saveJsonTo, 'scan_results.json');

scanDirectory(crawlFolder, jsonOutputPath)
    .then(() => {
        console.log('Directory scan complete.');
    })
    .catch(err => {
        console.error('Error during scanning:', err);
    });
