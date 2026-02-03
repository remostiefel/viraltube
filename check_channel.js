// Removed TS import

// Mocking fetch as we are in node environment potentially without full nextjs context, 
// OR we rely on running this with ts-node if environment permits. 
// Actually, `src/lib/youtube.ts` uses `fetch` which is available in Node 18+.
// But it uses "next: { revalidate }" which might be ignored or cause warning in plain node.

// We need to load env vars.
require('dotenv').config({ path: '.env.local' });

async function check() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error("No API Key found in .env.local");
        return;
    }

    console.log("Checking current ID...");
    /*
    const currentData = await getChannelData(apiKey); 
    // getChannelData uses the imported ID internally in the lib, 
    // but the export provided takes no ID arg, checking the file `src/lib/youtube.ts`...
    // verify signature: `export async function getChannelData(apiKey: string): Promise<ChannelData | null>`
    // It hardcodes NEURO_CODE_CHANNEL_ID inside.
    */

    // We can't easily import TS files in plain Node without ts-node.
    // I will use a direct fetch in this script to be safe and fast.

    const CURRENT_ID = "UChIrxEgUIoc8tJsHj2fOlBg"; // From file

    // 1. Check Current
    console.log(`Fetching info for ${CURRENT_ID}...`);
    const res1 = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${CURRENT_ID}&key=${apiKey}`);
    const data1 = await res1.json();
    if (data1.items && data1.items.length > 0) {
        console.log("Current Channel Title:", data1.items[0].snippet.title);
    } else {
        console.log("Current Channel ID not found or empty.");
    }

    // 2. Search for "@Neurocode_de" via Channels API (forHandle)
    console.log("Looking up handle '@Neurocode_de'...");
    const res2 = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=Neurocode_de&key=${apiKey}`);
    const data2 = await res2.json();
    if (data2.items) {
        console.log("Found channels:");
        data2.items.forEach(item => {
            console.log(`- ${item.snippet.title} (ID: ${item.id})`);
        });
    }

    // 3. Search for "NeuroCode" just in case
    console.log("Searching for 'NeuroCode'...");
    const res3 = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=NeuroCode&type=channel&key=${apiKey}`);
    const data3 = await res3.json();
    if (data3.items) {
        console.log("Found channels:");
        data3.items.forEach(item => {
            console.log(`- ${item.snippet.title} (ID: ${item.id.channelId})`);
        });
    }
}

check();
