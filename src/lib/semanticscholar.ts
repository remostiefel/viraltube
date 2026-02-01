
import { ScientificPaper } from "./openalex";

interface SS_Author {
    authorId: string;
    name: string;
}

interface SS_Paper {
    paperId: string;
    title: string;
    abstract: string | null;
    year: number | null;
    venue: string | null;
    citationCount: number;
    openAccessPdf: { url: string } | null;
    authors: SS_Author[];
    externalIds: { DOI?: string };
    url: string;
}

interface SS_SearchResponse {
    total: number;
    offset: number;
    next: number;
    data: SS_Paper[];
}

export async function searchSemanticScholar(query: string): Promise<ScientificPaper[]> {
    try {
        const fields = "title,abstract,year,venue,citationCount,openAccessPdf,authors,externalIds,url";
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=${fields}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                // "x-api-key": process.env.SEMANTIC_SCHOLAR_KEY || "" // Optional
            }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            console.error("Semantic Scholar Fetch Error", res.status, res.statusText);
            return [];
        }

        const data: SS_SearchResponse = await res.json();

        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data.map(paper => mapSSToCommon(paper));

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error("Semantic Scholar Request Timed Out");
        } else {
            console.error("Semantic Scholar Service Error", error);
        }
        return [];
    }
}

function mapSSToCommon(paper: SS_Paper): ScientificPaper {
    // Construct simplified interface
    return {
        id: paper.paperId,
        title: paper.title,
        publication_year: paper.year || new Date().getFullYear(),
        host_venue: {
            display_name: paper.venue || "Unknown Venue",
            url: paper.url || ""
        },
        authorships: paper.authors ? paper.authors.map(a => ({
            author: { display_name: a.name }
        })) : [],
        // Semantic Scholar provides full text abstract, not inverted index.
        // We will mock the inverted index structure OR just handle the abstract text in UI modification.
        // But to avoid breaking UI that expects `reconstructAbstract`, we should probably just attach the text 
        // to a new field or use a hack.
        // Strategy: The 'ScientificPaper' interface in openalex.ts has `abstract_inverted_index`. 
        // We can't easily fake that. 
        // Better Strategy: Update the UI to prefer a simple `abstract` string if available.
        // For now, we'll store the text in a way that we can easily patch the UI to read.
        // Let's modify the UI to look for 'abstract_text' field if inverted index is missing.

        // HACK: We will patch the UI to support `abstract_text` property which we will add to the type via intersection or just assume implicit support 
        // if we change the interface.
        // For now, let's put it in a custom format the UI can read if we update the UI.

        // We will augment the return object with `abstract_text` (even if TS complains slightly unless we update the interface definition).
        // @ts-ignore
        abstract_text: paper.abstract || "No abstract available.",

        open_access: {
            is_oa: !!paper.openAccessPdf,
            oa_url: paper.openAccessPdf?.url || ""
        },
        cited_by_count: paper.citationCount,
        doi: paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : ""
    };
}
