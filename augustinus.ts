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

export default function generateGabc(input: string, model: string): string {
    let separatedWords: string[] = input.split(" ");
    let fullString: string = "";
    for (let i = 0; i < separatedWords.length; i++) {
        separatedWords[i] = syllable(separatedWords[i]!) + "@";
        fullString += separatedWords[i]! + " ";
    }

    // 1. Create a regular expression that correctly identifies the "etc notes" pattern.
    const etcPattern = new RegExp(`(\\([a-n]r [[a-n]r [a-n]r\\))`);

    // 2. Split the model string using the corrected pattern.
    let modelParts: string[] = model.split(etcPattern);

    // Filter out any potential empty strings that can result from the split
    const cleanedParts = modelParts.filter(part => part && part.trim() !== '');

    // Assign the parts for clarity. Use fallback '' in case the pattern isn't found.
    const beforePart = (cleanedParts[0] || "").trim().split(" ");
    const etcPart = "(" + (cleanedParts[1] || "").trim().charAt(1) + ")";
    const afterPart = (cleanedParts[2] || "").trim();

    const afterPattern = new RegExp(`(\\([a-n]r1 [[a-n]r [a-n]+\\))`);

    const lastPatterns: string[] = afterPart.split(afterPattern);

    for (let i = 0; i < beforePart.length; i++) {
        fullString = fullString.replace('@', beforePart[i]!);
    }

    fullString = fullString.replaceAll("@", etcPart);
    return fullString
}

// Example from your prompt
const inputText = "Ó Deus, amparo dos que em vós esperam, sem vós nada tem valor, nada é santo. Multiplicai em nós a vossa misericórdia para que, conduzidos por vós usemos agora de tal modo os bens temporais que possamos aderir desde já aos bens eternos. Por nosso Senhor Jesus Cristo, vosso Filho, que é Deus, e convosco vive e reina, na unidade do Espírito Santo, por todos os séculos dos séculos.";
const modelText = "(gh) (i) (hr hr hr) (gr1) (hr) (i) (jr1) (hr) (g)";

console.log(generateGabc(inputText, modelText));