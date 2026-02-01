const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.YOUTUBE_API_KEY;
const channelId = "UChIrxEgUIoc8tJsHj2fOlBg";

console.log("Fetching for:", channelId);

const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=5&key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (!json.items || json.items.length === 0) {
                console.log("No items found.");
                return;
            }

            console.log("Found videos:");
            json.items.forEach(i => {
                const pub = new Date(i.snippet.publishedAt);
                const now = new Date();
                const diffMins = (now - pub) / 1000 / 60;
                console.log(`- ${i.snippet.title}`);
                console.log(`  Published: ${i.snippet.publishedAt}`);
                console.log(`  Age: ${diffMins.toFixed(1)} mins`);
            });
        } catch (e) {
            console.error("Parse Error", e);
            console.log("Raw:", data);
        }
    });
}).on("error", (err) => {
    console.error("Error: " + err.message);
});
