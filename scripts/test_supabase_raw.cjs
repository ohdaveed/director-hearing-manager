const https = require("https");
const dotenv = require("dotenv");
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const url = `${supabaseUrl}/rest/v1/users?select=*`;

const options = {
  headers: {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  },
};

console.log("Fetching:", url);

https
  .get(url, options, (res) => {
    console.log("Status:", res.statusCode);
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Response:", data);
    });
  })
  .on("error", (err) => {
    console.error("Error:", err.message);
  });
