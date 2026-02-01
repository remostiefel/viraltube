
export interface ScientificPaper {
    id: string;
    title: string;
    publication_year: number;
    host_venue: {
        display_name: string;
        url: string;
    };
    authorships: Array<{
        author: {
            display_name: string;
        };
    }>;
    abstract_inverted_index?: Record<string, number[]>; // OpenAlex minimal abstract
    open_access: {
        is_oa: boolean;
        oa_url: string;
    };
    cited_by_count: number;
    doi: string;
    abstract_text?: string; // Optional field for alternative providers (Semantic Scholar / PubMed)
}

// Helper to reconstruct abstract from inverted index (if needed) or simple snippet
export function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    if (!invertedIndex) return "No abstract available.";
    const terms = Object.entries(invertedIndex);
    const words: string[] = [];
    terms.forEach(([word, positions]) => {
        positions.forEach(pos => {
            words[pos] = word;
        });
    });
    return words.join(" ");
}

export async function searchOpenAlex(query: string): Promise<ScientificPaper[]> {
    try {
        const email = "neurocode.de@gmail.com"; // Good practice: Identify yourself
        const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=5&sort=relevance_score:desc&mailto=${email}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
            console.error("OpenAlex Fetch Error", res.statusText);
            return [];
        }

        const data = await res.json();
        return data.results || [];
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error("OpenAlex Request Timed Out (5s limit)");
        } else {
            console.error("OpenAlex Service Error", error);
        }
        return [];
    }
}
