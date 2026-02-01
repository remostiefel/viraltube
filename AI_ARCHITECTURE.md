# AI & LLM Architecture

The application uses a hybrid AI architecture leveraging both **Google Gemini** and **OpenAI**.

## 1. Google Gemini (Model: `gemini-2.5-flash`)
**Role:** The "Brain" (Speed, Analysis, Context).
Used for efficient processing of large contexts (transcripts) and rapid ideation.

*   **Chat Interface:** Cortex Q&A.
*   **Analysis:** Channel Audits, Prognosis, Metric Optimization, Title Optimization.
*   **Ideation:** Trend Radar, Brainstorming.
*   **Strategy:** "Blueprint" generation from transcripts (`generateBlueprint`).
*   **Asset Generation:** Loop Assets (Midjourney/Runway prompts), Voiceover Style.
*   **Synthesis:** Summarizing strategies (`synthesizeStrategy`).

## 2. OpenAI (Model: `gpt-4o`)
**Role:** The "Architect" (Creativity, Complex Structuring).
Used for heavy-lifting creative tasks requiring high nuance and strict instruction following.

*   **Scriptwriting:** The core `generateScriptWithOpenAI` function.
*   **Deep Analysis:** "Viral DNA" extraction and Neuro-Scoring (`analyzeViralVideoContent`).
*   **Refinement:** Script Doctoring (Rewriting, Extending, Condensing).
*   **Prompt Engineering:** Generating complex Art Direction prompts for DALL-E and Midjourney.

## 3. Specialized Models
*   **DALL-E 3 (via OpenAI):** Direct image generation within the app.
*   **Google Text-to-Speech:** Voiceover audio generation.
