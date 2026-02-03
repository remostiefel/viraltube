// Debug Video Fetching
require('dotenv').config({ path: '.env.local' });

async function check() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const CHANNEL_ID = "UChIrxEgUIoc8tJsHj2fOlBg";

    if (!apiKey) {
        console.error("No API Key");
        return;
    }

    console.log(`Checking videos for ${CHANNEL_ID}...`);

    // 1. Try Search Endpoint (Current Method)
    console.log("\n--- METHOD 1: SEARCH ENDPOINT ---");
    try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=date&maxResults=5&key=${apiKey}`;
        const sRes = await fetch(searchUrl);
        const sData = await sRes.json();
        if (sData.items) {
            console.log(`Found ${sData.items.length} videos via Search.`);
            sData.items.forEach(i => console.log(`- ${i.snippet.title} (${i.snippet.publishedAt})`));
        } else {
            console.log("No items found via Search.", sData);
        }
    } catch (e) { console.error("Search failed:", e.message); }

    // 2. Try Uploads Playlist (Reliable Method)
    console.log("\n--- METHOD 2: UPLOADS PLAYLIST ---");
    try {
        const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`;
        const cRes = await fetch(chUrl);
        const cData = await cRes.json();

        if (cData.items && cData.items.length > 0) {
            const uploadsId = cData.items[0].contentDetails.relatedPlaylists.uploads;
            console.log(`Uploads Playlist ID: ${uploadsId}`);

            const pUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=5&key=${apiKey}`;
            const pRes = await fetch(pUrl);
            const pData = await pRes.json();
            if (pData.items) {
                console.log(`Found ${pData.items.length} videos via Playlist.`);
                pData.items.forEach(i => console.log(`- ${i.snippet.title} (${i.snippet.publishedAt})`));
            } else {
                console.log("No items found via Playlist.", pData);
            }
        } else {
            console.log("Channel not found for Uploads ID lookup.");
        }
    } catch (e) { console.error("Playlist lookup failed:", e.message); }
}

check();
