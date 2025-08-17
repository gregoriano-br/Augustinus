import applyModel from "./logic";
import models from "./models.json";

interface Pattern {
    symbol: string;
    gabc: string;
}

interface Model {
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

interface Parameters {
    addOptionalStart?: boolean;
}

export default function generateGabc(input: string, modelObject: Model, parametersObject: Parameters): string {
    const chunks: string[] = input.split("$").map(s => s.trim()).filter(Boolean);
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
