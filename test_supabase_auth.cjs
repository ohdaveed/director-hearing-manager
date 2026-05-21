const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing connection to:', supabaseUrl);
  
  // Try to fetch with the mysterious columns parameter
  const axios = require('axios');
  const url = `${supabaseUrl}/rest/v1/complaints?columns=%22complaintid%22%2C%22address%22%2C%22locationid%22%2C%22description%22%2C%22status%22%2C%22assigned_to%22%2C%22date_entered%22%2C%22date_assigned%22%2C%22date_closed%22%2C%22category%22%2C%22complaint_type%22%2C%22complaint_subtype%22%2C%22method_received%22%2C%22assigned_program%22%2C%22311_case_number%22%2C%22unit_number%22%2C%22facility_name%22%2C%22facility_ownership%22%2C%22complainant_anonymous%22%2C%22complainant_name%22%2C%22complainant_phone%22%2C%22complainant_email%22%2C%22complainant_address%22%2C%22complainant_contact_dates%22%2C%22hearing_rp_name%22%2C%22hearing_rp_phone%22%2C%22hearing_rp_email%22%2C%22hearing_rp_address%22%2C%22purpose_of_hearing%22%2C%22notice_of_hearing_date%22%2C%22hearing_order_date%22&select=id%2Ccomplaintid%2Caddress%2Cstatus%2Cdescription%2Cassigned_to%2Cdate_entered%2Chearing_status%2Chearing_date%2Clocationid%2Ccategory%2Creinspection_due_on_after%2Cdeleted_at`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log('Successfully fetched with columns param:', response.status);
  } catch (err) {
    console.error('Error fetching with columns param:', err.response?.status, err.response?.data);
  }

  // Try to check user profile (if any)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.log('No active user or error:', userError.message);
  } else {
    console.log('Current user:', user.email);
  }
}

test();
