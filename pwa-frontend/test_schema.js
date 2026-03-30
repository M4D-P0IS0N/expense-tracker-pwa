require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSoftDeleteColumn() {
    console.log('Running read-only schema check for transactions.is_deleted...');

    const { error } = await supabase
        .from('transactions')
        .select('id,is_deleted')
        .limit(1);

    if (error && error.code === 'PGRST204') {
        console.log('Column is_deleted does not exist in the public API schema.');
        console.log('Apply the migration manually in the Supabase SQL Editor instead of trying to mutate schema from the client.');
        return;
    }

    if (error) {
        console.log('Read-only schema check failed:', error.message);
        return;
    }

    console.log('Column is_deleted appears to exist or is readable through the API schema.');
}

inspectSoftDeleteColumn();
