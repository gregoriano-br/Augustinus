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

    const validModelSegments = modelSegments.filter(segment => segment && segment.trim() !== '');
    // Assign the extracted model parts for clarity. Use fallback empty strings if a segment is missing.
    const prefixNotesRaw = (validModelSegments[0] || "").trim();
    // These are the notes (e.g., "gabc(c) d(f) e(g)") that precede the triplet pattern.
    const prefixNotesArray = prefixNotesRaw.split(" "); 
    // Extract a single 'root' note from the matched triplet pattern.
    // For a pattern like '(ar br cr)', this extracts 'a' and formats it as '(a)'.
    const extractedTripletRootNote = "(" + (validModelSegments[1] || "").trim().charAt(1) + ")";
    // This is the part of the model string that comes after the triplet.
    const suffixString = (validModelSegments[2] || "").trim();
    let isDynamic = false;
    if (suffixString.includes("r1")) {
        isDynamic = true
    }
    const wordCount = wordsWithNotePlaceholders.length;
    let word: string = wordsWithNotePlaceholders[wordCount - 1] || "";
        const notes = suffixString.replaceAll("r1", '').replaceAll("r", '').split(" ") || [];
        
        if (isDynamic) {
            const tonicNumber = tonic(word.split("@"));
            //replace with if; cases 2+ are the same
             switch (tonicNumber) {
            case 1:
                
                break;
            case 2:
                
                break;
            case 3:
                word = replaceFromEnd(word, "@", notes[2]!, 1)
                word = replaceFromEnd(word, "@", notes[1]!, 1)
                word = replaceFromEnd(word, "@", notes[0]!, 1)
                console.log(word)
                break;
            default:
                break;
        }
        
        wordsWithNotePlaceholders[wordCount - 1] = word;
    }
    gabcOutput += wordsWithNotePlaceholders.join(" ");
    // Step 3: Integrate the extracted prefix notes into the GABC output.
    // Replace the first 'n' '@' placeholders in 'gabcOutput' with notes from 'prefixNotesArray'.
    // The number of replacements is limited by the number of notes in 'prefixNotesArray'.
    
    for (let i = 0; i < prefixNotesArray.length; i++) {
        gabcOutput = gabcOutput.replace('@', prefixNotesArray[i]!);
    }
    
    // gabcOutput = gabcOutput.replaceAll("@", extractedTripletRootNote);
    
    return gabcOutput;
}

// Example from your prompt
const inputText = "Ó Deus, amparo dos que em vós esperam, sem vós nada tem valor, nada é santo. Multiplicai em nós a vossa misericórdia para que, conduzidos por vós usemos agora de tal modo os bens temporais que possamos aderir desde já aos bens eternos. Por nosso Senhor Jesus Cristo, vosso Filho, que é Deus, e convosco vive e reina, na unidade do Espírito Santo, por todos os séculos dos séculos.";
const modelText = "(gh) (i) (hr hr hr) (gr1) (hr) (i) (jr1) (hr) (g)";
console.log(applyModel(inputText, modelText));