require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function inspect() {
    // Check stores table columns by selecting 1 row
    const { data, error } = await supabase
        .from('stores')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching stores:', error);
    } else {
        console.log('Stores table sample:', data);
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Stores table is empty or no columns returned (try inserting dummy first if needed, but select * usually works)');
        }
    }
}

inspect();
