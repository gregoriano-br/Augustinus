#!/usr/bin/env node
import generateGabc, { type Model, type Parameters } from "@augustinus/core";
import { defaultModels } from "@augustinus/core"
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';


    const argv = yargs(hideBin(process.argv))
        .options({
            text: { type: 'string', alias: 't', description: 'Texto de entrada para converter para GABC' },
            input: { type: 'string', alias: 'i', description: 'Caminho do arquivo de entrada' },
            output: { type: 'string', alias: 'o', description: 'Caminho do arquivo de saída' },
            model: { type: 'string', demandOption: true, alias: 'm', description: 'Nome do modelo a ser usado' },
            addOptionalStart: { type: 'boolean', default: false, description: 'Adicionar início opcional' },
            addOptionalEnd: { type: 'boolean', default: false, description: 'Adicionar final opcional' },
            removeNumbers: { type: 'boolean', default: false, description: 'Remover números da entrada' },
            removeParenthesis: { type: 'boolean', default: true, description: 'Remover parênteses e seu conteúdo da entrada' },
            separator: { type: 'string', default: '\n', description: 'Separador para pedaços de texto' },
            removeSeparator: { type: 'boolean', default: true, description: 'Se falso, o caractere separador será usado para unir as linhas GABC.' }
        })
        .check((argv: { text: any; input: any; }) => {
            if (!argv.text && !argv.input) {
                throw new Error('É necessário fornecer --text ou --input.');
            }
            return true;
        })
        .help()
        .alias('help', 'h')
        .parseSync();

    const modelObject = defaultModels.find((m: Model) => m.name === argv.model);

    if (!modelObject) {
        console.error(`Modelo '${argv.model}' não encontrado.`);
        process.exit(1);
    }

    let inputText = argv.text as string;
    if (argv.input) {
        try {
            inputText = fs.readFileSync(argv.input, 'utf-8');
        } catch (error) {
            console.error(`Erro ao ler o arquivo de entrada: ${(error as Error).message}`);
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

    if (argv.output) {
        try {
            fs.writeFileSync(argv.output, gabc);
            console.log(`Saída GABC escrita em ${argv.output}`);
        } catch (error) {
            console.error(`Erro ao escrever no arquivo de saída: ${(error as Error).message}`);
            process.exit(1);
        }
    } else {
        console.log(gabc);
    }
