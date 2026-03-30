require('dotenv').config();
const fs = require('fs');
const https = require('https');

const envStr = fs.readFileSync('.env', 'utf-8');
const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.+)/);
const anonKeyMatch = envStr.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !anonKeyMatch) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const baseUrl = urlMatch[1].trim();
const anonKey = anonKeyMatch[1].trim();
const allowWriteMode = process.env.ALLOW_WRITE === 'true';
const bearerToken = process.env.SUPABASE_BEARER_TOKEN?.trim();

const headers = {
    'apikey': anonKey,
    'Authorization': 'Bearer ' + anonKey,
    'Content-Type': 'application/json'
};

if (allowWriteMode && !bearerToken) {
    console.error('ALLOW_WRITE=true requires SUPABASE_BEARER_TOKEN with a real authenticated session token.');
    process.exit(1);
}

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
            let cleanCat = tx.category.replace(/🏷️\s?/g, '').trim();

            if (cleanCat !== tx.category) {
                console.log(`Candidate ${tx.id}: '${tx.category}' -> '${cleanCat}'`);

                if (!allowWriteMode) {
                    return;
                }

                const patchHeaders = {
                    ...headers,
                    Authorization: 'Bearer ' + bearerToken
                };

                const req = https.request(
                    baseUrl + `/rest/v1/transactions?id=eq.${tx.id}`,
                    {
                        method: 'PATCH',
                        headers: patchHeaders
                    },
                    (patchRes) => {
                        console.log(`Status for ${tx.id}: ${patchRes.statusCode}`);
                    }
                );

                req.on('error', e => console.error(e));
                req.write(JSON.stringify({ category: cleanCat }));
                req.end();
            }
        });

        if (!allowWriteMode) {
            console.log('Dry-run only. No database rows were modified.');
            console.log('To allow writes, set ALLOW_WRITE=true and provide SUPABASE_BEARER_TOKEN explicitly.');
        }
    });
});
