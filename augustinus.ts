import models from "./models.json";
import syllable from "./separador-silabas/syllable";
import tonic from "./separador-silabas/tonic";

function replaceFromEnd(input: string, find: string, replaceWith: string, limit?: number): string {
    let result: string = input;
    let replacementsMade: number = 0;
    if (find.length === 0) {
        return input;
    }
    let currentSearchIndex: number = result.length;
    let lastFoundIndex: number = result.lastIndexOf(find, currentSearchIndex - 1);

    while (lastFoundIndex !== -1 && (limit === undefined || replacementsMade < limit)) {
        result = result.substring(0, lastFoundIndex) + replaceWith + result.substring(lastFoundIndex + find.length);
        replacementsMade++;
        currentSearchIndex = lastFoundIndex;
        lastFoundIndex = result.lastIndexOf(find, currentSearchIndex - 1);
    }

    return result;
}
function applyModel(lyrics: string, gabcModel: string): string {
    // Step 1: Prepare the lyrics by splitting into words and appending a placeholder '@' for notes.
    let wordsWithNotePlaceholders: string[] = lyrics.split(" ");
    let gabcOutput: string = "";

    for (let i = 0; i < wordsWithNotePlaceholders.length; i++) {
        // Assuming 'syllable' is an external function that processes each word,
        // likely converting it to a form suitable for GABC, then appending a note placeholder.
        wordsWithNotePlaceholders[i] = syllable(wordsWithNotePlaceholders[i] || "") + "@";

    }

    // Step 2: Parse the GABC model string to extract different sections of notes.

    // Split the GABC model string using the triplet pattern. This results in parts before the triplet,
    // the matched triplet itself, and parts after the triplet.
    let modelSegments: string[] = gabcModel.split(/(\([a-n]r [a-n]r [a-n]r\))/gm);
    // Filter out any empty strings that might result from the split operation,
    // ensuring we only work with meaningful segments.

    const validModelSegments: string[] = modelSegments.filter(segment => segment && segment.trim() !== '');
    // Assign the extracted model parts for clarity. Use fallback empty strings if a segment is missing.
    const prefixNotesRaw: string = (validModelSegments[0] || "").trim();
    // These are the notes (e.g., "gabc(c) d(f) e(g)") that precede the triplet pattern.
    const prefixNotesArray: string[] = prefixNotesRaw.split(" ");
    // Extract a single 'root' note from the matched triplet pattern.
    // For a pattern like '(ar br cr)', this extracts 'a' and formats it as '(a)'.
    const extractedTripletRootNote: string = "(" + (validModelSegments[1] || "").trim().charAt(1) + ")";
    // This is the part of the model string that comes after the triplet.
    const suffixString: string = (validModelSegments[2] || "").trim();
    let isDynamic: boolean = false;
    if (suffixString.includes("r1")) {
        isDynamic = true
    }
    const wordCount: number = wordsWithNotePlaceholders.length;
    let word: string = wordsWithNotePlaceholders[wordCount - 1] || "";
    let notes: string[] = suffixString.split(" ") || [];
    gabcOutput += wordsWithNotePlaceholders.join(" ");
    if (isDynamic) {
        const tonicNumber: number = tonic(word.split("@"));
        let offset: number = 0;
        for (let i = 0; i < notes.length; i++) {
            if (notes[i]?.match("r1")) {
                break;
            }
            offset++;
        }
        for (let i = 0; i < notes.length; i++) {
            notes[i] = notes[i]?.replace("r1", "").replace("r", "") || "";
        }
        switch (tonicNumber) {
            case 1:
                const joined_note: string = ((notes[0 + offset] || "").slice(0, -1) + (notes[2 + offset] || "").substring(1)).replaceAll(/([a-m])\1/g, "$1");
                gabcOutput = replaceFromEnd(gabcOutput, "@", joined_note, 1);
                break;
            case 2:
                gabcOutput = replaceFromEnd(gabcOutput, "@", notes[2 + offset] || "", 1);
                gabcOutput = replaceFromEnd(gabcOutput, "@", notes[0 + offset] || "", 1);
                break;
            default:
                gabcOutput = replaceFromEnd(gabcOutput, "@", notes[2 + offset] || "", 1);
                gabcOutput = replaceFromEnd(gabcOutput, "@", notes[1 + offset] || "", 1);
                gabcOutput = replaceFromEnd(gabcOutput, "@", notes[0 + offset] || "", 1);
                break;
        }
        for (let i = offset - 1; i >= 0; i--) {
            gabcOutput = replaceFromEnd(gabcOutput, "@", notes[i] || "", 1);
        }
        for (let i = offset + 3; i < notes.length; i++) {
            gabcOutput += " " + notes[i];
        }

    }

    for (let i = 0; i < prefixNotesArray.length; i++) {
        gabcOutput = gabcOutput.replace('@', prefixNotesArray[i]!);
    }

    gabcOutput = gabcOutput.replaceAll("@", extractedTripletRootNote);

    return gabcOutput;
}
function convertExsurge(input: string): string {
    let result: string = input;
    result = result.replaceAll("<c><sp>V/</sp>.</c>", "<c><sp>V/</sp></c>");
    result = result.replaceAll("<c><sp>R/</sp>.</c>", "<c><sp>V/</sp></c>");
    result = result.replaceAll("<nlba>", "");
    return result;
}
export interface Pattern {
    symbol: string;
    gabc: string;
}

export interface Model {
    name: string;
    type: string;
    tom: string;
    optional_end: string;
    optional_start: string;
    end: string;
    start: string;
    default: string;
    patterns: Pattern[];
    find: string[];
    replace: string[];
}

export interface Parameters {
    addOptionalStart?: boolean;
    addOptionalEnd?: boolean;
    exsurge?: boolean;
    removeNumbers?: boolean;
    removeParenthesis?: boolean;
    separator: string;
}
// todo: Add the new parameters to the generateGabc function
export default function generateGabc(input: string, modelObject: Model, parametersObject: Parameters): string {
    const chunks: string[] = input.split(parametersObject.separator).map(s => s.trim().replace(/\s*([\*\+])/g, '$1')).filter(Boolean);
    let gabcLines: string[] = [];

    for (const chunk of chunks) {
        const findIndex = modelObject.find.indexOf(chunk);
        if (findIndex !== -1) {
            const replacement = modelObject.replace[findIndex];
            if (replacement !== undefined) {
                gabcLines.push(replacement);
            } else {
                gabcLines.push(applyModel(chunk, modelObject.default));
            }
            continue;
        }
        
        const lastChar = chunk.slice(-1);
        const pattern = modelObject.patterns.find(p => p.symbol === lastChar);
        if (pattern) {
            const text = chunk.slice(0, -1);
            gabcLines.push(applyModel(text, pattern.gabc));
        } else {
            gabcLines.push(applyModel(chunk, modelObject.default));
        }
    }

    let resultGabc = "";
    if (parametersObject.addOptionalStart) {
        resultGabc = [modelObject.optional_start, ...gabcLines, modelObject.optional_end].join("\n");
    } else {
        if (gabcLines.length > 0) {
            gabcLines[0] = modelObject.start + gabcLines[0];
        }
        resultGabc = gabcLines.join("\n") + modelObject.end;
    }

    return resultGabc;
}