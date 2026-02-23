const fs = require('fs');

try {
    const main = fs.readFileSync('src/main.js', 'utf8');
    const html = fs.readFileSync('index.html', 'utf8');
    const ids = [...main.matchAll(/document\.getElementById\('([^']+)'\)/g)].map(m => m[1]);
    let missing = [];
    ids.forEach(id => {
        if (!html.includes('id=\"' + id + '\"') && !html.includes('id=\'' + id + '\'')) missing.push(id);
    });
    console.log('Missing IDs in HTML:', missing);
} catch (e) {
    console.error("Error reading files:", e);
}
