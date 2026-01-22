import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat, convertInchesToTwip } from "docx";

export const generateDocx = async (content: string, title: string): Promise<Blob> => {

    // Config for auto-numbering
    const numbering = {
        config: [
            {
                reference: "default-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                            },
                        },
                    },
                    {
                        level: 1,
                        format: LevelFormat.DECIMAL,
                        text: "%1.%2.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.75), hanging: convertInchesToTwip(0.25) },
                            },
                        },
                    },
                ],
            },
        ],
    };

    const lines = content.split('\n');
    const docChildren: Paragraph[] = [];

    // Title
    docChildren.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: {
                after: 400,
            },
        })
    );

    // Parse Content
    lines.forEach(line => {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
            // Heading 1
            docChildren.push(
                new Paragraph({
                    text: trimmed.replace('# ', ''),
                    heading: HeadingLevel.HEADING_1,
                    numbering: {
                        reference: "default-numbering",
                        level: 0,
                    },
                    spacing: { before: 400, after: 200 },
                })
            );
        } else if (trimmed.startsWith('## ')) {
            // Heading 2
            docChildren.push(
                new Paragraph({
                    text: trimmed.replace('## ', ''),
                    heading: HeadingLevel.HEADING_2,
                    numbering: {
                        reference: "default-numbering",
                        level: 1,
                    },
                    spacing: { before: 300, after: 150 },
                })
            );
        } else if (trimmed.startsWith('### ')) {
            // Heading 3 (No numbering per typical script format, but can add if needed. Keeping generic for now)
            docChildren.push(
                new Paragraph({
                    text: trimmed.replace('### ', ''),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                })
            );
        } else if (trimmed === "" || trimmed === "---") {
            // Empty line or separator (add small space)
            docChildren.push(new Paragraph({ spacing: { after: 100 } }));
        } else {
            // Standard Paragraph
            // Basic Bold parsing for **text**
            const parts = trimmed.split(/(\*\*.*?\*\*)/g);
            const children = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({
                        text: part.slice(2, -2),
                        bold: true,
                    });
                } else {
                    return new TextRun({
                        text: part,
                    });
                }
            });

            docChildren.push(
                new Paragraph({
                    children: children,
                    spacing: { after: 120 },
                })
            );
        }
    });


    const doc = new Document({
        numbering: numbering,
        sections: [
            {
                properties: {},
                children: docChildren,
            },
        ],
        styles: {
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 32,
                        bold: true,
                        color: "2E75B6",
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 },
                    },
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 26,
                        bold: true,
                        color: "2E75B6",
                    },
                },
            ]
        }
    });

    return await Packer.toBlob(doc);
};

import { VideoPrompt } from "./openai";

export const generatePromptsDocx = async (prompts: VideoPrompt[], title: string = "Video Prompts"): Promise<Blob> => {
    const docChildren: Paragraph[] = [];

    // Title
    docChildren.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: {
                after: 400,
            },
        })
    );

    prompts.forEach((scene) => {
        // Scene Header
        docChildren.push(
            new Paragraph({
                text: `SCENE ${scene.sceneId}: ${scene.focus} (${scene.visualFocus})`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
            })
        );

        // Voiceover
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "Voiceover: ", bold: true }),
                    new TextRun({ text: scene.voiceoverSegment, italics: true }),
                ],
                spacing: { after: 100 },
            })
        );

        // Prompt Box Style
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "PROMPT:", bold: true, color: "2E75B6" }),
                ],
                spacing: { before: 100 },
            })
        );

        docChildren.push(
            new Paragraph({
                text: scene.prompt,
                style: "Quote", // Use a distinct style if possible, or just normal
                border: {
                    left: { color: "2E75B6", space: 10, style: "single", size: 6 },
                },
                spacing: { after: 300 },
                indent: { left: convertInchesToTwip(0.2) }
            })
        );
    });

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: docChildren,
            },
        ],
    });

    return await Packer.toBlob(doc);
};

import { ScriptImagePrompt, AudioPrompt } from "./openai";

export const generateImagePromptsDocx = async (prompts: ScriptImagePrompt[], title: string = "Visual Strategy"): Promise<Blob> => {
    const docChildren: Paragraph[] = [];

    // Title
    docChildren.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    );

    prompts.forEach((item) => {
        // Context Header
        docChildren.push(
            new Paragraph({
                text: `Context: ${item.segmentContext}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
            })
        );

        // Midjourney
        docChildren.push(
            new Paragraph({
                children: [new TextRun({ text: "Midjourney v6:", bold: true, color: "2E75B6" })],
                spacing: { before: 100 },
            })
        );
        docChildren.push(
            new Paragraph({
                text: item.midjourney,
                style: "Quote",
                border: { left: { color: "2E75B6", space: 10, style: "single", size: 6 } },
                spacing: { after: 200 },
                indent: { left: convertInchesToTwip(0.2) }
            })
        );

        // DALL-E
        docChildren.push(
            new Paragraph({
                children: [new TextRun({ text: "DALL-E 3:", bold: true, color: "C00000" })],
                spacing: { before: 100 },
            })
        );
        docChildren.push(
            new Paragraph({
                text: item.dalle,
                style: "Quote",
                border: { left: { color: "C00000", space: 10, style: "single", size: 6 } },
                spacing: { after: 300 },
                indent: { left: convertInchesToTwip(0.2) }
            })
        );
    });

    const doc = new Document({
        sections: [{ children: docChildren }],
    });

    return await Packer.toBlob(doc);
};

export const generateAudioPromptsDocx = async (audio: AudioPrompt, title: string = "Audio Strategy"): Promise<Blob> => {
    const docChildren: Paragraph[] = [];

    // Title
    docChildren.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    );

    // Global Mood
    docChildren.push(new Paragraph({ text: "Global Mood:", heading: HeadingLevel.HEADING_2 }));
    docChildren.push(new Paragraph({ text: audio.mood, spacing: { after: 300 } }));

    // Suno
    docChildren.push(new Paragraph({ text: "Suno AI Prompt (Music):", heading: HeadingLevel.HEADING_2 }));
    docChildren.push(
        new Paragraph({
            text: audio.suno,
            style: "Quote",
            border: { left: { color: "2E75B6", space: 10, style: "single", size: 6 } },
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.2) }
        })
    );

    // Udio
    docChildren.push(new Paragraph({ text: "Udio Prompt (Music):", heading: HeadingLevel.HEADING_2 }));
    docChildren.push(
        new Paragraph({
            text: audio.udio,
            style: "Quote",
            border: { left: { color: "2E75B6", space: 10, style: "single", size: 6 } },
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.2) }
        })
    );

    // Voiceover
    docChildren.push(new Paragraph({ text: "Voiceover Direction:", heading: HeadingLevel.HEADING_2 }));
    docChildren.push(
        new Paragraph({
            text: audio.voiceover,
            style: "Quote",
            border: { left: { color: "C00000", space: 10, style: "single", size: 6 } },
            spacing: { after: 300 },
            indent: { left: convertInchesToTwip(0.2) }
        })
    );

    const doc = new Document({
        sections: [{ children: docChildren }],
    });

    return await Packer.toBlob(doc);
};

import { Template } from "./templates";
import { WisdomNugget } from "./openai";

export const generateWisdomDocx = async (nuggets: Template[], title: string = "Wisdom Collection"): Promise<Blob> => {
    const docChildren: Paragraph[] = [];

    // Title
    docChildren.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    );

    nuggets.forEach((template, index) => {
        let content = template.content;
        // Normalize Content
        let nugget: WisdomNugget | null = null;

        if (Array.isArray(content) && content.length > 0) nugget = content[0];
        else if (typeof content === 'object' && content !== null) nugget = content as WisdomNugget;

        // Header (Name + Category)
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. ${template.name.replace("Wisdom: ", "").replace("Master Principle: ", "")}`, bold: true, size: 28, color: "2E75B6" }),
                ],
                spacing: { before: 400, after: 100 },
            })
        );

        const category = template.wisdomCategory || "General";
        const categoryColor = category === "LAW" ? "800080" : category === "GROWTH" ? "FFA500" : "008000";

        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `[${category}]`, bold: true, color: categoryColor, size: 20 }),
                ],
                spacing: { after: 200 },
            })
        );

        if (nugget) {
            // Universal Law
            if (nugget.universalLaw) {
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Universal Law:", bold: true, italics: true }),
                            new TextRun({ text: ` ${nugget.universalLaw}`, italics: true }),
                        ],
                        spacing: { after: 150 },
                        indent: { left: convertInchesToTwip(0.2) }
                    })
                );
            }

            // Principle (if different from name) & Explanation
            if (nugget.explanation) {
                docChildren.push(
                    new Paragraph({
                        text: nugget.explanation,
                        spacing: { after: 200 },
                        indent: { left: convertInchesToTwip(0.2) }
                    })
                );
            }

            // Actionable Tip
            if (nugget.actionableTip) {
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Actionable Tip:", bold: true, color: "008000" }),
                        ],
                        spacing: { before: 100 },
                        indent: { left: convertInchesToTwip(0.2) }
                    })
                );
                docChildren.push(
                    new Paragraph({
                        text: nugget.actionableTip,
                        style: "Quote",
                        border: { left: { color: "008000", space: 10, style: "single", size: 6 } },
                        spacing: { after: 300 },
                        indent: { left: convertInchesToTwip(0.2) }
                    })
                );
            }
        } else if (typeof content === 'string') {
            // Fallback for string content
            docChildren.push(
                new Paragraph({
                    text: content,
                    spacing: { after: 300 },
                    indent: { left: convertInchesToTwip(0.2) }
                })
            );
        }
    });

    const doc = new Document({
        sections: [{ children: docChildren }],
    });

    return await Packer.toBlob(doc);
};
