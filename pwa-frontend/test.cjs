const fs = require('fs');
const https = require('https');

const envStr = fs.readFileSync('.env', 'utf-8');
const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envStr.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const baseUrl = urlMatch[1].trim();
const apiKey = keyMatch[1].trim();

const headers = {
    'apikey': apiKey,
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
};

// 1. Fetch all transactions that have the tag emoji inside them
const fetchUrl = baseUrl + '/rest/v1/transactions?select=id,category&category=ilike.*🏷️*';

https.get(fetchUrl, { headers }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const transactions = JSON.parse(data);

        if (transactions.error) {
            console.error("Fetch Error:", transactions);
            return;
        }

        console.log(`Found ${transactions.length} transactions with tag emoji to inspect.`);

        transactions.forEach(tx => {
            // Only clean if it contains a tag emoji AFTER another emoji
            // e.g. "🐶 🏷️ Peçanha" -> "🐶 Peçanha"
            // Or "🏷️ Peçanha" -> "Peçanha" (the UI will safely handle no-emoji states and apply defaults or the user can edit it)
            // Actually, if it's "🏷️ Peçanha", it's fine for it to become "Peçanha" because the dashboard will just assign it a default icon without breaking the Edit Modal (since the Edit modal regex is now fixed).
            let cleanCat = tx.category.replace(/🏷️\s?/g, '').trim();

            if (cleanCat !== tx.category) {
                console.log(`Updating ${tx.id}: '${tx.category}' -> '${cleanCat}'`);

                const req = https.request(baseUrl + `/rest/v1/transactions?id=eq.${tx.id}`, {
                    method: 'PATCH',
                    headers: headers
                }, (patchRes) => {
                    console.log(`Status for ${tx.id}: ${patchRes.statusCode}`);
                });

                req.on('error', e => console.error(e));
                req.write(JSON.stringify({ category: cleanCat }));
                req.end();
            }
        });
    });
});
