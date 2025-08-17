import generateGabc, { type Model } from "./augustinus";
import models from "./models.json";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';
import fs from 'fs';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const argv = yargs(hideBin(process.argv))
        .options({
            text: { type: 'string', alias: 't', description: 'Input text to convert to GABC' },
            inputFile: { type: 'string', alias: 'i', description: 'Input file path' },
            outputFile: { type: 'string', alias: 'o', description: 'Output file path' },
            model: { type: 'string', demandOption: true, alias: 'm', description: 'Name of the model to use' },
            addOptionalStart: { type: 'boolean', default: false, alias: 'a', description: 'Add optional start and end' },
        })
        .check((argv: { text: any; inputFile: any; }) => {
            if (!argv.text && !argv.inputFile) {
                throw new Error('Either --text or --inputFile must be provided.');
            }
            return true;
        })
        .help()
        .alias('help', 'h')
        .parseSync();

    const modelObject = models.find((m: Model) => m.name === argv.model);

    if (!modelObject) {
        console.error(`Model '${argv.model}' not found.`);
        process.exit(1);
    }

    let inputText = argv.text as string;
    if (argv.inputFile) {
        try {
            inputText = fs.readFileSync(argv.inputFile, 'utf-8');
        } catch (error) {
            console.error(`Error reading input file: ${(error as Error).message}`);
            process.exit(1);
        }
    }

    const gabc = generateGabc(inputText, modelObject, { addOptionalStart: argv.addOptionalStart });

    if (argv.outputFile) {
        try {
            fs.writeFileSync(argv.outputFile, gabc);
            console.log(`GABC output written to ${argv.outputFile}`);
        } catch (error) {
            console.error(`Error writing to output file: ${(error as Error).message}`);
            process.exit(1);
        }
    } else {
        console.log(gabc);
    }
}