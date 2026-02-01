const email = "neurocode.de@gmail.com";
const query = "Protein";
const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=5&sort=relevance_score:desc&mailto=${email}`;

console.log("Fetching:", url);

fetch(url)
    .then(res => {
        console.log("Status:", res.status);
        return res.json();
    })
    .then(data => {
        console.log("Results count:", data.results?.length);
        if (data.results?.length > 0) {
            console.log("First result:", data.results[0].title);
        } else {
            console.log("No results found.");
        }
    })
    .catch(err => console.error("Error:", err));
