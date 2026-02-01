
import { ScientificPaper } from "./openalex";

interface PubMedDoc {
    uid: string;
    title: string;
    pubdate: string;
    source: string;
    authors: { name: string }[];
    volume?: string;
    issue?: string;
    pages?: string;
    elocationid?: string; // DOI often here
    sortpubdate?: string;
}

interface PubMedSummaryResponse {
    result: {
        uids: string[];
        [key: string]: PubMedDoc | any;
    }
}

export async function searchPubMed(query: string): Promise<ScientificPaper[]> {
    try {
        // 1. Search for IDs
        const searchBase = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
        // Convert spaces to +
        const safeQuery = encodeURIComponent(query);
        const searchUrl = `${searchBase}?db=pubmed&term=${safeQuery}&retmode=json&retmax=10`;

        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) throw new Error("PubMed Search Failed");
        const searchData = await searchRes.json();

        const ids = searchData.esearchresult?.idlist || [];
        if (ids.length === 0) return [];

        // 2. Fetch Summaries
        const summaryBase = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
        const idString = ids.join(",");
        const summaryUrl = `${summaryBase}?db=pubmed&id=${idString}&retmode=json`;

        const sumRes = await fetch(summaryUrl);
        if (!sumRes.ok) throw new Error("PubMed Summary Failed");
        const sumData: PubMedSummaryResponse = await sumRes.json();

        const papers: ScientificPaper[] = [];

        // 3. For Abstracts, we mostly need 'efetch', but that returns XML. 
        // 'esummary' usually does NOT have abstracts.
        // To be robust, we really should fetch abstracts. But XML parsing in JS (Edge/Node) without libs is annoying.
        // We'll try to do a quick fetch for abstracts if 'esummary' is insufficient.
        // Actually, let's use 'efetch' with retmode=xml or text and regex parse strictly for abstracts? 
        // Too complex for V1.
        // Let's stick to Summaries first. If user needs abstracts, we might need a third step or a proxy.
        // Wait, 'efetch' can return 'text' format (abstract).

        // Let's just map the Summary data first. It has Title, Date, Source (Journal), Authors.
        // We will mark abstract as "View on PubMed" for now to avoid XML complexity issues in this iteration,
        // UNLESS we use a simple XML parser.

        ids.forEach((id: string) => {
            const doc = sumData.result[id];
            if (doc) {
                // Extract DOI
                let doi = "";
                // Sometimes in articleids
                if (doc.articleids) {
                    const doiObj = doc.articleids.find((a: any) => a.idtype === 'doi');
                    if (doiObj) doi = `https://doi.org/${doiObj.value}`;
                }

                papers.push({
                    id: id,
                    title: doc.title,
                    publication_year: doc.pubdate ? parseInt(doc.pubdate.split(' ')[0]) : new Date().getFullYear(),
                    host_venue: {
                        display_name: doc.source || "PubMed",
                        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
                    },
                    authorships: doc.authors ? doc.authors.map((a: any) => ({
                        author: { display_name: a.name }
                    })) : [],
                    // @ts-ignore
                    abstract_text: "Abstract available on PubMed. Click 'Read Full Paper'.",
                    open_access: {
                        is_oa: false, // Hard to tell from summary
                        oa_url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
                    },
                    cited_by_count: 0, // Not provided easily in eutils
                    doi: doi
                });
            }
        });

        return papers;

    } catch (error) {
        console.error("PubMed Error", error);
        return [];
    }
}
