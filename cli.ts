#!/usr/bin/env node
import generateGabc, { type Model, type Parameters } from "./augustinus.js";

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import models from './assets/models.json' with { type: 'json' };


    const argv = yargs(hideBin(process.argv))
        .options({
            text: { type: 'string', alias: 't', description: 'Input text to convert to GABC' },
            inputFile: { type: 'string', alias: 'i', description: 'Input file path' },
            outputFile: { type: 'string', alias: 'o', description: 'Output file path' },
            model: { type: 'string', demandOption: true, alias: 'm', description: 'Name of the model to use' },
            addOptionalStart: { type: 'boolean', default: false, alias: 'a', description: 'Add optional start' },
            addOptionalEnd: { type: 'boolean', default: false, description: 'Add optional end' },
            removeNumbers: { type: 'boolean', default: false, description: 'Remove numbers from input' },
            removeParenthesis: { type: 'boolean', default: true, description: 'Remove parenthesis and their content from input' },
            separator: { type: 'string', default: '\n', description: 'Separator for chunks of text' },
            removeSeparator: { type: 'boolean', default: true, description: 'If false, the separator character will be used to join GABC lines.' }
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

    const parameters: Parameters = {
        addOptionalStart: argv.addOptionalStart,
        addOptionalEnd: argv.addOptionalEnd,
        removeNumbers: argv.removeNumbers,
        removeParenthesis: argv.removeParenthesis,
        separator: argv.separator,
        removeSeparator: argv.removeSeparator
    };

    const gabc = generateGabc(inputText, modelObject, parameters);

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
