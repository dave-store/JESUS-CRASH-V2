const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ai",
    alias: ["bot", "dj", "gpt", "gpt4", "bing"],
    desc: "Chat with an AI model",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for the AI.\nExample: `.ai Hello`");

        const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.message) {
            await react("❌");
            return reply("AI failed to respond. Please try again later.");
        }

        await reply(`🤖 *AI Response:*\n\n${data.message}`);
        await react("✅");
    } catch (e) {
        console.error("Error in AI command:", e);
        await react("❌");
        reply("An error occurred while communicating with the AI.");
    }
});

cmd({
    pattern: "openai",
    alias: ["chatgpt", "gpt3", "open-gpt"],
    desc: "Chat with OpenAI",
    category: "ai",
    react: "🧠",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for OpenAI.\nExample: `.openai Hello`");

        const apiUrl = `https://vapis.my.id/api/openai?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.result) {
            await react("❌");
            return reply("OpenAI failed to respond. Please try again later.");
        }

        await reply(`🧠 *OpenAI Response:*\n\n${data.result}`);
        await react("✅");
    } catch (e) {
        console.error("Error in OpenAI command:", e);
        await react("❌");
        reply("An error occurred while communicating with OpenAI.");
    }
});

cmd({
    pattern: "deepseek",
    alias: ["deep", "seekai"],
    desc: "Chat with DeepSeek AI",
    category: "ai",
    react: "🧠",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for DeepSeek AI.\nExample: `.deepseek Hello`");

        const apiUrl = `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.answer) {
            await react("❌");
            return reply("DeepSeek AI failed to respond. Please try again later.");
        }

        await reply(`🧠 *DeepSeek AI Response:*\n\n${data.answer}`);
        await react("✅");
    } catch (e) {
        console.error("Error in DeepSeek AI command:", e);
        await react("❌");
        reply("An error occurred while communicating with DeepSeek AI.");
    }
});

cmd({
    pattern: "superai",
    alias: ["sai", "smartai", "dawensia"],
    desc: "Chat with multiple AI models with auto fallback",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for the AI.\nExample: `.superai Hello`");

        await react("🤔"); // thinking

        // List of AI APIs to try
        const apis = [
            { name: "Lance AI", url: `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`, path: "message" },
            { name: "OpenAI", url: `https://vapis.my.id/api/openai?q=${encodeURIComponent(q)}`, path: "result" },
            { name: "DeepSeek AI", url: `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(q)}`, path: "answer" },
        ];

        let responseText = null;
        let usedAPI = null;

        // Try each API until one returns a valid response
        for (let api of apis) {
            try {
                const { data } = await axios.get(api.url);
                const answer = api.path.split('.').reduce((o,i) => o?.[i], data);

                if (answer && answer.trim() !== "") {
                    responseText = answer;
                    usedAPI = api.name;
                    break;
                }
            } catch (err) {
                console.warn(`⚠️ ${api.name} failed:`, err.message);
            }
        }

        if (!responseText) {
            await react("❌");
            return reply("All AI APIs failed to respond. Please try again later.");
        }

        // Success
        await reply(`🤖 *${usedAPI} Response:*\n\n${responseText}`);
        await react("✅");

    } catch (e) {
        console.error("Error in SuperAI command:", e);
        await react("❌");
        reply("An unexpected error occurred while communicating with AI.");
    }
});