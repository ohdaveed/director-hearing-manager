require('dotenv').config();
const { Anthropic } = require('@anthropic-ai/sdk');

async function test() {
  const anthropic = new Anthropic({
    apiKey: process.env.VITE_ANTHROPIC_API_KEY || "mock_key"
  });
  
  try {
    const res = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say hello!" }]
    });
    console.log("Success:", res.content[0].text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
