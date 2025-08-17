import syllable from "./separador-silabas/dist/syllable";
import tonic from "./separador-silabas/dist/tonic";
import defaultModels from './assets/models.json';

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
    const taggedParts: string[] = [];
    const placeholder = "||TAGGED_PART||";
    
    let deTaggedLyrics = lyrics.replace(/(<[^>]+>.*?<\/[^>]+>)/g, (match) => {
        taggedParts.push(match);
        return placeholder;
    });

    let wordsWithNotePlaceholders: string[] = deTaggedLyrics.split(/\s+/).filter(w => w).map(word => {
        if (word === placeholder) {
            return taggedParts.shift() || "";
        }
        return syllable(word) + "@";
    });

    let gabcOutput: string = "";
    let modelSegments: string[] = gabcModel.split(/(\([a-n]r [a-n]r [a-n]r\))/gm);
    const validModelSegments: string[] = modelSegments.filter(segment => segment && segment.trim() !== '');
    const prefixNotesRaw: string = (validModelSegments[0] || "").trim();
    const prefixNotesArray: string[] = prefixNotesRaw.split(" ");
    const extractedTripletRootNote: string = "(" + (validModelSegments[1] || "").trim().charAt(1) + ")";
    const suffixString: string = (validModelSegments[2] || "").trim();
    let isDynamic: boolean = false;
    if (suffixString.includes("r1")) {
        isDynamic = true
    }
    const wordCount: number = wordsWithNotePlaceholders.length;
    
    let lastWordForTonic = "";
    for(let i = wordCount - 1; i >= 0; i--) {
        const currentWord = wordsWithNotePlaceholders[i] || "";
        if (!currentWord.includes('<')) {
            lastWordForTonic = currentWord;
            break;
        }
    }

    let notes: string[] = suffixString.split(" ") || [];
    gabcOutput += wordsWithNotePlaceholders.join(" ");
    if (isDynamic && lastWordForTonic) {
        const tonicNumber: number = tonic(lastWordForTonic.split("@"));
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
    removeSeparator?: boolean;
    customNote?: string;
    customClef?: string;
    customPattern?: string;
    customStart?: string;
}

export default function generateGabc(input: string, modelObject: Model, parametersObject: Parameters): string {
    let model = { ...modelObject };

    if (model.type === 'custom') {
        if (model.tom === 'simples') {
            const note = parametersObject.customNote || 'h';
            const clef = parametersObject.customClef || 'c4';
            model.start, model.optional_start = "(" + clef + ") ";
            model.default = "(" + note + ") (" + note + "r " + note + "r " + note + "r" + ")";
            console.log(model)
        } else if (model.tom === 'solene') {
            model.default = parametersObject.customPattern || '';
            model.start = parametersObject.customStart || '';
            model.optional_start = parametersObject.customStart || '';
        }
    }

    if (parametersObject.removeNumbers) {
        input = input.replace(/[0-9]/g, "");
    }
    if (parametersObject.removeParenthesis) {
        input = input.replace(/\(.*\)/g, "");
    }
    const chunks: string[] = input.split(parametersObject.separator).map(s => s.trim().replace(/\s*([*+]})/g, '$1') + (parametersObject.removeSeparator === false ? parametersObject.separator : '')).filter(chunk => chunk && chunk !== parametersObject.separator);
    let gabcLines: string[] = [];

    for (const chunk of chunks) {
        const findIndex = model.find.indexOf(chunk);
        if (findIndex !== -1) {
            const replacement = model.replace[findIndex];
            if (replacement !== undefined) {
                gabcLines.push(replacement);
            } else {
                gabcLines.push(applyModel(chunk, model.default));
            }
            continue;
        }
        
        const lastChar = chunk.slice(-1);
        const pattern = model.patterns.find(p => p.symbol === lastChar);
        if (pattern) {
            const text = chunk.slice(0, -1);
            gabcLines.push(applyModel(text, pattern.gabc));
        } else {
            gabcLines.push(applyModel(chunk, model.default));
        }
    }

    let resultGabc = "";
    if (parametersObject.addOptionalStart) {
        resultGabc = [model.optional_start, ...gabcLines].join("\n");
        if (parametersObject.addOptionalEnd) {
            resultGabc += "\n" + model.optional_end;
        }
    } else {
        if (gabcLines.length > 0) {
            gabcLines[0] = model.start + gabcLines[0];
        }
        resultGabc = gabcLines.join("\n");
    }

    if (parametersObject.exsurge) {
        resultGabc = convertExsurge(resultGabc);
    }

    return resultGabc;
}

export { defaultModels };