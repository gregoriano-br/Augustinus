import syllable from "./separador-silabas/syllable";
import tonic from "./separador-silabas/tonic";
// augustinus.ts
function convertExsurge(input: string): string{
    let result: string = input;
    result = result.replaceAll("<c><sp>V/</sp>.</c>", "<c><sp>V/</sp></c>");
	result = result.replaceAll("<c><sp>R/</sp>.</c>", "<c><sp>V/</sp></c>");
    result = result.replaceAll("<nlba>", "");
    return result;
}
function replaceFromEnd(input: string, find: string, replaceWith: string, limit?: number): string {
    let result = input;
    let replacementsMade = 0;

    // Handle the edge case where 'find' is an empty string.
    // Replacing an empty string from the end is ambiguous and typically not desired.
    // It could lead to infinite loops or nonsensical replacements.
    // In this case, we return the original string unchanged.
    if (find.length === 0) {
        return input;
    }

    // 'currentSearchIndex' defines the upper bound (exclusive) for the lastIndexOf search.
    // We start searching from the very end of the string, so we initialize it to the string's length.
    // The lastIndexOf(searchValue, fromIndex) method searches backward from 'fromIndex'.
    // If fromIndex is string.length - 1, it searches the whole string.
    // If fromIndex is string.length, it behaves as if it were string.length - 1.
    // We use currentSearchIndex - 1 to properly set the fromIndex for lastIndexOf.
    let currentSearchIndex = result.length;

    // Loop as long as 'find' is found and the replacement limit (if set) has not been reached.
    // lastIndexOf returns -1 if 'find' is not found.
    let lastFoundIndex = result.lastIndexOf(find, currentSearchIndex - 1);

    while (lastFoundIndex !== -1 && (limit === undefined || replacementsMade < limit)) {
        // Perform the replacement:
        // 1. Take the part of the string before the found 'find' occurrence.
        // 2. Append the 'replaceWith' string.
        // 3. Append the part of the string after the found 'find' occurrence.
        result = result.substring(0, lastFoundIndex) + replaceWith + result.substring(lastFoundIndex + find.length);
        replacementsMade++;

        // Update the 'currentSearchIndex' for the next iteration.
        // To ensure we find the *next* occurrence towards the beginning of the string
        // and avoid re-finding the just-replaced one, we set the new search boundary
        // to start immediately before the index of the last replacement.
        currentSearchIndex = lastFoundIndex;

        // Find the next occurrence backwards, respecting the new search boundary.
        lastFoundIndex = result.lastIndexOf(find, currentSearchIndex - 1);
    }

    return result;
}
function applyModel(lyrics: string, gabcModel: string): string {
    const syllableSeparator = '@'; // Assuming syllable() uses this separator.
    const BASIC_NOTE_REGEX = /[a-m][^\dr]/;
    const TONIC_NOTE_REGEX = /r1/;
    const GENERIC_NOTE_REGEX = /\(([a-z]r\s?)+\)/;

    let singleFragmentGabc = "";
    let currentText = lyrics.replace(/\d/gm, '');

    const words = currentText.split(" ");
    let syllablesList: string[] = [];
    let wordsSyllables: string[][] = [];
    let isLastSyllableOfWordList: boolean[] = [];

    for (const word of words) {
        if (!word) continue;
        const wordSyllables = syllable(word).split(syllableSeparator);
        syllablesList.push(...wordSyllables);
        wordsSyllables.push(wordSyllables);
        const booleans = new Array(wordSyllables.length).fill(false);
        if (booleans.length > 0) {
            booleans[booleans.length - 1] = true;
        }
        isLastSyllableOfWordList.push(...booleans);
    }

    if (syllablesList.length === 0) return "";

    let remainingSyllables = [...syllablesList];
    let remainingIsLast = [...isLastSyllableOfWordList];
    let remainingSymbols = gabcModel.match(/\([^()]+\)/gm) || [];
    
    const lastWordSyllables = wordsSyllables[wordsSyllables.length - 1] || [];
    let tonicSyllablePosition = -1;
    if (lastWordSyllables.length > 0) {
        tonicSyllablePosition = tonic(lastWordSyllables);
    }
    
    let genericNotePlaceholder = "";
    let preTonicNotes: string[] = [];
    let hasGenericNote = false;
    let hasLastNote = false;

    while (remainingSymbols.length > 0) {
        let currentSymbol = remainingSymbols.shift()!;
        if (currentSymbol.match(TONIC_NOTE_REGEX)) {
            let remainingSymbolsString = remainingSymbols.join(" ");
            currentSymbol = currentSymbol.replace("r1", "");
            
            const tonicSyllableIndex = remainingSyllables.length - tonicSyllablePosition;
            const tonicSyllable = remainingSyllables[tonicSyllableIndex];
            const isTonicLastInWord = remainingIsLast[tonicSyllableIndex];

            singleFragmentGabc += tonicSyllable + currentSymbol;
            if (isTonicLastInWord && tonicSyllablePosition === 1) singleFragmentGabc += " ";
            
            const genericMatch = remainingSymbolsString.match(GENERIC_NOTE_REGEX);
            if (!genericMatch) break;
            let middleNoteSymbol = genericMatch[0].replace("r", "");
            remainingSymbolsString = remainingSymbolsString.replace(GENERIC_NOTE_REGEX, "");
            
            const basicMatch = remainingSymbolsString.match(BASIC_NOTE_REGEX);
            if (!basicMatch) break;
            let finalNoteSymbol = "(" + basicMatch[0];

            if (tonicSyllablePosition == 1) {
                singleFragmentGabc = singleFragmentGabc.slice(0, -1);
                singleFragmentGabc += finalNoteSymbol.replace("(", "");
            } else {
                let syllablesToInsert = remainingSyllables.slice(remainingSyllables.length - tonicSyllablePosition + 1);
                let isLastToInsert = remainingIsLast.slice(remainingSyllables.length - tonicSyllablePosition + 1);

                for (let i = 0; i < syllablesToInsert.length - 1; i++) {
                    singleFragmentGabc += syllablesToInsert[i] + middleNoteSymbol;
                    if(isLastToInsert[i]) singleFragmentGabc += " ";
                }
                singleFragmentGabc += syllablesToInsert[syllablesToInsert.length - 1] + finalNoteSymbol;
                if(isLastToInsert[syllablesToInsert.length - 1]) singleFragmentGabc += " ";
            }

            const genericNoteIndex = remainingSymbols.findIndex(s => s.match(GENERIC_NOTE_REGEX));
            if (genericNoteIndex > -1) remainingSymbols.splice(genericNoteIndex, 1);
            const finalNoteIndex = remainingSymbols.findIndex(s => s.match(BASIC_NOTE_REGEX));
            if (finalNoteIndex > -1) remainingSymbols.splice(finalNoteIndex, 1);

            remainingSyllables.splice(remainingSyllables.length - tonicSyllablePosition);
            remainingIsLast.splice(remainingSyllables.length - tonicSyllablePosition);

            singleFragmentGabc += " " + remainingSymbols.join(" ");
            hasLastNote = true;
            break;
        }
        else if (currentSymbol.match(GENERIC_NOTE_REGEX)) {
            if (!hasGenericNote) {
                const match = currentSymbol.match(/[a-m]/);
                if (match) {
                    genericNotePlaceholder = "(" + match[0] + ")";
                }
                singleFragmentGabc += currentSymbol;
                hasGenericNote = true;
            }
        }
        else if (currentSymbol.match(BASIC_NOTE_REGEX)) {
            if (hasGenericNote) {
                preTonicNotes.push(currentSymbol);
            } else {
                const syll = remainingSyllables.shift()!;
                const isLast = remainingIsLast.shift()!;
                singleFragmentGabc += syll + currentSymbol;
                if (isLast) singleFragmentGabc += " ";
            }
        }
        else if (!hasLastNote) {
            singleFragmentGabc += currentSymbol;
        }
    }

    while (remainingSyllables.length > preTonicNotes.length) {
        const genericMatch = singleFragmentGabc.match(GENERIC_NOTE_REGEX);
        if (genericMatch && genericMatch.index !== undefined) {
            const placeholderIndex = genericMatch.index;
            const syll = remainingSyllables.shift()!;
            const isLast = remainingIsLast.shift()!;
            let textToInsert = syll + genericNotePlaceholder;
            if (isLast) textToInsert += " ";
            singleFragmentGabc = singleFragmentGabc.slice(0, placeholderIndex) + textToInsert + singleFragmentGabc.slice(placeholderIndex);
        } else if (remainingSyllables.length > 0) {
            const syll = remainingSyllables.shift()!;
            const isLast = remainingIsLast.shift()!;
            singleFragmentGabc += syll;
            if (isLast) singleFragmentGabc += " ";
        }
    }

    while (remainingSyllables.length > 0) {
        const genericMatch = singleFragmentGabc.match(GENERIC_NOTE_REGEX);
        if (genericMatch && genericMatch.index !== undefined && preTonicNotes.length > 0) {
            const placeholderIndex = genericMatch.index;
            const syll = remainingSyllables.shift()!;
            const isLast = remainingIsLast.shift()!;
            let textToInsert = syll + preTonicNotes.shift()!;
            if (isLast) textToInsert += " ";
            singleFragmentGabc = singleFragmentGabc.slice(0, placeholderIndex) + textToInsert + singleFragmentGabc.slice(placeholderIndex);
        } else if (remainingSyllables.length > 0) {
            const syll = remainingSyllables.shift()!;
            const isLast = remainingIsLast.shift()!;
            singleFragmentGabc += syll;
            if (isLast) singleFragmentGabc += " ";
        }
    }
    
    const genericRegexGlobal = new RegExp(GENERIC_NOTE_REGEX.source, 'g');
    singleFragmentGabc = singleFragmentGabc.replace(/([a-h])\1/gm, "$1").replace(genericRegexGlobal, "").replace("'", " (,) ");
    
    return singleFragmentGabc.trim();
}

// Example from your prompt
const inputText = "Ó Deus, amparo dos que em vós esperam, sem vós nada tem valor, nada é santo. Multiplicai em nós a vossa misericórdia para que, conduzidos por vós usemos agora de tal modo os bens temporais que possamos aderir desde já aos bens eternos. Por nosso Senhor Jesus Cristo, vosso Filho, que é Deus, e convosco vive e reina, na unidade do Espírito Santo, por todos os séculos dos séculos.";
const modelText = "(gh) (i) (hr hr hr) (jr1) (hr) (g)";
console.log(applyModel(inputText, modelText));