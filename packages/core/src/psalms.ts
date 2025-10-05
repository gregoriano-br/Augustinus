import {syllable, tonic} from "separador-silabas";
//import defaultModels from '../assets/models.json' assert {type: "json"};
import defaultModels from '../assets/psalm_models.json' assert {type: "json"};

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

// Lógica de posicionamento das notas nas sílabas de um salmo
function psalmLogic(input: string[], notes: string[]) { //Função que aplica a lógica no array de sílabas com as tônicas marcadas com #
    const i = input.length;
    const tonicNote = notes.filter(note => note.includes("r1")).reverse().map(note => note.replace("r1", "")); // Procura pela nota da tônica melódica
    const replaceAt = (index: number, value: string) => {input[index] = input[index].replace("@", value)}; // Função menor, parecida com a replaceFromEnd, mas para array
    const isTonic = (index: number): boolean => input[index]?.includes("#") ?? false; // Função que será usada mais tarde
    const tonicIndex = i - input.findLastIndex(syllable => syllable.includes("#")); // Procura pelo índice da primeira sílaba tônica de trás pra frente
    switch (tonicIndex) {
        case 1:
            replaceAt(i - 1, tonicNote[0].replace(")", ""));
            input[i - 1] += notes[notes.length - 1].replace("(", "");
            break;
        case 2:
            replaceAt(i - 2, tonicNote[0]);
            replaceAt(i - 1, notes[notes.length - 1]);
            break;

        case 3:
            replaceAt(i - 3, tonicNote[1]? tonicNote[1] : tonicNote[0]);
            replaceAt(i - 2, notes[notes.length - 2]);
            replaceAt(i - 1, notes[notes.length - 1]);
            break;
    }  
};

function applyModel(lyrics: string, gabcModel: string, psalm: boolean): string {
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
        const syllableArray = syllable(word).split(/(?<=@)/);
        const tonicIndex = syllableArray.length - tonic(syllableArray);
        return syllableArray.map((s, i) => i === tonicIndex ? "#" + s : s).join("") + "@";
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
    let pause: string = notes.pop() || "";
    gabcOutput += wordsWithNotePlaceholders.join(" ");
    let gabcOutputArray: string[] = gabcOutput.split(/(?<=@)/);

    if (isDynamic && lastWordForTonic) {
        if (psalm) {
            // Separa as notas do sufixo em dois grupos de acentos
            let firstAccentIndex = notes.findIndex(note => note.includes("r1"));
            let secondAccentIndex = notes.findIndex((note, i) => i > firstAccentIndex && note.includes("r1"));
            let preNotesIndex = (firstAccentIndex - 1) >= 0 ? (firstAccentIndex - 1) : false;
            // Se só tiver um acento, mantém um único grupo

            let firstAccentNotes = secondAccentIndex === -1 ? notes.slice(firstAccentIndex) : notes.slice(firstAccentIndex, secondAccentIndex);
            let secondAccentNotes = secondAccentIndex === -1 ? [] : notes.slice(secondAccentIndex);
            let preNotes = preNotesIndex !== false ? notes.slice(0, preNotesIndex + 1) : false;

            // Se tiver dois grupos, o secondAccentNotes é aplicado primeiro, depois cortado do array, o firstAccentNotes é aplicado ao que sobrou e os dois arrays são concatenados
            if (secondAccentIndex !== -1) {
                psalmLogic(gabcOutputArray, secondAccentNotes);
                const firstAccentGabcIndex = gabcOutputArray.findIndex(syllable => syllable.includes("("));

                const firstAccentGabc = gabcOutputArray.slice(firstAccentGabcIndex);
                const secondAccentGabc = gabcOutputArray.slice(0, firstAccentGabcIndex);

                psalmLogic(secondAccentGabc, firstAccentNotes);

                gabcOutputArray = secondAccentGabc.concat(firstAccentGabc);
            }
            // Se tiver só um grupo, aplica o firstAccentNotes normalmente
            else {
                psalmLogic(gabcOutputArray, firstAccentNotes);
            }
            // Se tiver um grupo de notas prévias, aplica às sílabas restantes
            if (preNotes){
                for (let i = preNotes.length - 1, j = gabcOutputArray.length - 1; i >= 0 && j >= 0; j--) {
                    if (!gabcOutputArray[j].includes("(")) {
                        gabcOutputArray[j] = gabcOutputArray[j].replace("@", preNotes[i]);
                        i--;
                    }
                }
            }
        // Limpa os caracteres de marcação
        gabcOutputArray = gabcOutputArray.map(syllable => syllable.replace(/#|(?<=\()'/g, ""));

        // Junta o array com o GABC numa string e adiciona a pausa no final
        gabcOutputArray.push(pause);
        gabcOutput = gabcOutputArray.join("");
        }
        
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

        if (!psalm){
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
        
    }
    else{
        for (let i = notes.length - 2; i >= 0; i--) {
            gabcOutput = replaceFromEnd(gabcOutput, "@", notes[i] || "", 1);
        }
        gabcOutput += " " + notes[notes.length - 1];
    }

    for (let i = 0; i < prefixNotesArray.length; i++) {
        gabcOutput = gabcOutput.replace('@', prefixNotesArray[i]!);
    }

    gabcOutput = gabcOutput.replaceAll("@", extractedTripletRootNote);

    return gabcOutput;
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

    let psalm = model.type === "salmo"? true : false;

    if (model.type === 'custom') {
        if (model.tom === 'simples') {
            const note = parametersObject.customNote || 'h';
            const clef = parametersObject.customClef || 'c4';
            model.start, model.optional_start = "(" + clef + ") ";
            model.default = "(" + note + ") (" + note + "r " + note + "r " + note + "r" + ")";
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
    let regex_endings: string = "([\\" + parametersObject.separator;
    for (let i = 0; i < modelObject.patterns.length; i++) {
        const symbol: string = modelObject.patterns[i].symbol;
        input = input.replaceAll(symbol, symbol + parametersObject.separator);
        regex_endings += "\\" + symbol;
    }
    regex_endings += "]+)\\" + parametersObject.separator;
    if (modelObject.type === "prefacio" && modelObject.tom === "solene") {
        input = input.replaceAll("Por isso,", "Por isso," + parametersObject.separator);
    }
    const chunks: string[] = input.split(parametersObject.separator).map(s => s.trim()).filter(chunk => chunk && chunk !== parametersObject.separator);
    let gabcLines: string[] = [];

    for (const chunk of chunks) {
        if(modelObject.type === "prefacio" && modelObject.tom === "solene" && chunk == "Por isso,")
        {
            gabcLines.push("Por(f) is(ef)so,(f) (,) ");
            continue
        }
        let findIndex = model.find.indexOf(chunk + parametersObject.separator)
        if (findIndex !== -1) {
            const replacement = model.replace[findIndex];
            if (replacement !== undefined) {
                gabcLines.push(replacement);
            } else {
                gabcLines.push(applyModel(chunk, model.default, psalm));
            }
            continue;
        }
        
        const lastChar = chunk.slice(-1);
        const pattern = model.patterns.find(p => p.symbol === lastChar);
        if (pattern) {
            const text = model.type === 'evangelho' ? chunk.trim() : chunk.slice(0, -1).trim();
            gabcLines.push(applyModel(text, pattern.gabc, psalm));
        } else {
            gabcLines.push(applyModel(chunk.trim() + (parametersObject.removeSeparator === false ? parametersObject.separator : ''), model.default, psalm));
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
    resultGabc = resultGabc.replaceAll(/'\(.\)/gm, "(,)");
    return resultGabc;
}

export { defaultModels };

//let lyrics = "Não aceita o conselho dos ímpios"
//let lyrics = "O Senhor é fiel para sempre,"
let lyrics = "Ó Sião, o teu Deus reinará";
//let gabcModel = "(j) (jr jr jr) ('k) (jr) (j.)"
//let gabcModel = "(h) (hr hr hr) ('i) (gr) (g) ('h) (fr) (f.)"
//let gabcModel = "(h) (hr hr hr) (g) (f) ('gh) (gr) (gvFED.)"
//let gabcModel = "(h) (hr hr hr) (g) ('e) (fr) (f.)"
//let gabcModel = "(j) (jr jr jr) (kr1) (jr) (j) (jr1) (ihr1) (j.) (::)"
//console.log(applyModel(lyrics, gabcModel))

console.log(generateGabc("Não aceita + o conselho dos ímpios * Bendito seja o nome do Senhor \n O Senhor é fiel para sempre, Ó Sião, * o teu Deus reinará", defaultModels[0], {separator: "|", removeSeparator: true, addOptionalStart: false, addOptionalEnd: false, removeNumbers: false, removeParenthesis: false}));