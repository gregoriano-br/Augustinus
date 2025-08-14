const ADVANCED_CHECKBOX = document.getElementById('advanced');
const ADVANCED_ELEMENTS = document.querySelectorAll('.advanced');
const API_POCKET_CHECKBOX = document.getElementById('api-pocket');
const API_POCKET_ELEMENTS = document.querySelectorAll('.api-pocket');

ADVANCED_CHECKBOX.addEventListener('change', function () {
	ADVANCED_ELEMENTS.forEach(element => {
		element.style.display = this.checked ? 'block' : 'none';
	});
});

API_POCKET_CHECKBOX.addEventListener('change', function () {
	API_POCKET_ELEMENTS.forEach(element => {
		element.style.display = this.checked ? 'block' : 'none';
	});
});
function processGabc(gabcOutput) {
    const parts = gabcOutput.split(/(<sp>[VR]\/<\/sp>)/g);
    const sections = [];
    
    // Handle initial text before any tag
    if (parts[0]) {
        sections.push({ type: 'text', content: parts[0] });
    }

    let currentSection = null;

    for (let i = 1; i < parts.length; i += 2) {
        const tag = parts[i];
        const content = parts[i + 1] || ''; // handle possible undefined
        const tagType = tag === '<sp>V/</sp>' ? 'V' : 'R';

        if (tagType === 'V') {
            if (currentSection && currentSection.type === 'V') {
                // Merge with current V section
                currentSection.content += content;
            } else {
                // Start new V section
                currentSection = { type: 'V', content: content };
                sections.push(currentSection);
            }
        } else {
            // R section, cannot merge
            currentSection = { type: 'R', content: content };
            sections.push(currentSection);
        }
    }

    // Reconstruct the output string
    let result = '';
    for (const section of sections) {
        if (section.type === 'text') {
            result += section.content;
        } else {
            result += `<sp>${section.type}/</sp>${section.content}`;
        }
    }

    return result;
}

async function getPocketTerco() {
	const date = document.getElementById('date').value;
	const base_url = "https://pocket.augustinus.workers.dev";
	const oracaoDoDiaElement = document.getElementById('oracaoDoDia');
	const sobreAsOferendasElement = document.getElementById('sobreAsOferendas');
	const depoisDaComunhaoElement = document.getElementById('depoisDaComunhao');
	const evangelhoElement = document.getElementById('evangelho');
	const salmolmoElement = document.getElementById('salmo');

	const url = `${base_url}?date=${date}`;
	try {
		const token = localStorage.getItem('token');
		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
		const data = await response.json();
		// Update your element assignments like this:
		oracaoDoDiaElement.value = data.results.oracaoDoDia;
		sobreAsOferendasElement.value = data.results.sobreAsOferendas;
		depoisDaComunhaoElement.value = data.results.depoisDaComunhao;
		evangelhoElement.innerHTML = data.results.evangelhoOriginal;
		salmolmoElement.innerHTML = data.results.salmo;

		// return await response.json();
	} catch (error) {
		return console.error('Error:', error);
	}
}

var selected_model;
document.addEventListener('DOMContentLoaded', async function () {
	const SELECT = document.getElementById('chant-type');

	const response = await fetch('models.json');
	const MODELS_JSON = await response.text();

	const DATA = JSON.parse(MODELS_JSON);
	const MODELS = DATA.define;
	MODELS.forEach((model, index) => {
		const option = new Option(model.name, index);
		SELECT.add(option);
	});

	SELECT.addEventListener('change', function () {
		const selectedModel = MODELS[this.value];
		if (selectedModel) {
			selected_model = selectedModel;
		}
	});

	SELECT.dispatchEvent(new Event('change'));
}); function copyGabc() {
	const gabcOutput = document.getElementById('gabc').value;
	navigator.clipboard.writeText(gabcOutput);
}

// --- CHANGE START: The entire `generateGabcNotation` function is refactored ---
function generateGabcNotation() {
	// --- Get all user settings first ---
	const INPUT_TEXT = document.getElementById('text').value;
	const SHOULD_REMOVE_NUMBERS = document.getElementById('remove-numbers').checked;
	const SHOULD_ADD_OPTIONAL_END = document.getElementById('amen').checked;
	const SHOULD_ADD_OPTIONAL_START = document.getElementById('entoation').checked;
	const SHOULD_REMOVE_NEWLINE = document.getElementById('newline').checked;
	const SHOULD_REMOVE_PARENTESIS = document.getElementById('parenteses').checked;
	const LATEX_MODE = document.getElementById('latex').checked;
	const GABC_OUTPUT_ELEMENT = document.getElementById('gabc');

	const syllableSeparator = "@";
	definirSeparador(syllableSeparator);

	// --- Regex to find XML-like tags ---
	const xmlTagRegex = /(<[^>]+>.*?<\/[^>]+>)/g;

	// Split the input text by the XML tags, keeping the tags in the result array.
    // Example: "text1 <tag>content</tag> text2" -> ["text1 ", "<tag>content</tag>", " text2"]
	const textParts = INPUT_TEXT.split(xmlTagRegex).filter(part => part);

	let gabcOutput = "";
	
	// Add optional start pattern once at the beginning
	if (SHOULD_ADD_OPTIONAL_START) {
		gabcOutput += selected_model.optional_start;
	}
	gabcOutput += selected_model.start;

	// --- State that needs to be maintained across text segments ---
	const modelState = {
		index: 0
	};
	const MODEL_REPEAT = selected_model.default.split("|");

	// --- Process each part ---
	textParts.forEach(part => {
		if (xmlTagRegex.test(part)) {
			// If the part is an XML tag, append it directly without processing
			gabcOutput += part;
		} else {
			// If the part is plain text, process it to generate GABC
			gabcOutput += processTextFragmentForGabc(part, modelState);
		}
	});

	// --- Helper function to process only a text fragment ---
	function processTextFragmentForGabc(textFragment, state) {
		// All the original processing logic now applies to the fragment
		const BASIC_NOTE_REGEX = /[a-m][^\dr]/;
		const TONIC_NOTE_REGEX = /r1/;
		const GENERIC_NOTE_REGEX = /\(([a-z]r\s?)+\)/;
		
		let text = textFragment;
		if (SHOULD_REMOVE_NEWLINE) {
			text = text.replaceAll('\n', ' ');
		}
		// Apply clean-up rules
		text = text.replaceAll('℟.', '').replaceAll('—', '').replaceAll(' \n', '\n').replaceAll(/([aeiou])_([aeiou])/g, '{$1‿$2}');
		if (SHOULD_REMOVE_PARENTESIS) {
			text = text.replaceAll(/\([^)]*\)/g, '');
		}
		if (selected_model.patterns) {
			for (let pattern of selected_model.patterns) {
				text = text.replaceAll(" " + pattern.symbol, pattern.symbol);
				text = text.replaceAll(pattern.symbol, pattern.symbol + '\n');
			}
		}
		text = text.replaceAll('.', '.\n').replaceAll(';', ';\n');
		if (selected_model.tom === "solene" && selected_model.type === "prefacio") {
			text = text.replaceAll('Por isso,', 'Por isso,\n');
		}
		text = (text.trim() + '\n').replaceAll(/\n+/gm, '\n');

		const TEXT_FRAGMENTS = text.split("\n");
		let fragmentGabc = "";

		for (let fragmentIndex = 0; fragmentIndex < TEXT_FRAGMENTS.length - 1; fragmentIndex++) {
			let currentText = TEXT_FRAGMENTS[fragmentIndex].trim();
			if (!currentText) continue; // Skip empty fragments

			let isEnding = false;
			for (let i = 0; i < selected_model.find.length; i++) {
				const cleanCurrent = currentText.toLowerCase().replaceAll(/\W+/gm, '');
				const cleanFind = selected_model.find[i].toLowerCase().replaceAll(/\W+/gm, '');
				if (cleanCurrent === cleanFind) {
					fragmentGabc += selected_model.replace[i];
					isEnding = true;
					break;
				}
			}
			if (isEnding) continue;

			let processedTextFinal = "";
			if (SHOULD_REMOVE_NUMBERS) {
				currentText = currentText.replace(/\d/gm, '');
			}

			let words = currentText.split(" ");
			let separatedWords = [];
			for (let word of words) {
				separatedWords.push(separarTexto(word));
			}
			processedTextFinal = separatedWords.join(" ").replaceAll(" ", `${syllableSeparator} `).replaceAll(`${syllableSeparator}${syllableSeparator}`, syllableSeparator);
			let syllablesList = processedTextFinal.split(syllableSeparator).filter(s => s.trim() !== "");
			if (syllablesList.length === 0) continue;

			let remainingSyllables = syllablesList;
			let remainingSymbols;
			const LAST_SYLLABLE = syllablesList[syllablesList.length - 1];
			let isSpecialPattern = false;

			for (let i = 0; i < selected_model.patterns.length; i++) {
				let pattern = selected_model.patterns[i];
				if (processedTextFinal.endsWith(pattern.symbol)) {
					remainingSymbols = pattern.gabc.match(/\([^()]+\)/gm) || [];
					isSpecialPattern = true;
					if (selected_model.type != "evangelho") {
						syllablesList[syllablesList.length - 1] = LAST_SYLLABLE.replace(pattern.symbol, '');
					}
					break;
				}
			}

			if (!isSpecialPattern) {
				remainingSymbols = MODEL_REPEAT[state.index].match(/\([^()]+\)/gm) || [];
				state.index = (state.index + 1) % MODEL_REPEAT.length; // Use and update shared state
			}
			
			processedTextFinal = syllablesList.join(syllableSeparator);

			const wordsArray = processedTextFinal.split(' ').filter(word => word.trim() !== '');
			let tonicSyllablePosition = -1;
			if (wordsArray.length > 0) {
				const lastWord = wordsArray[wordsArray.length - 1];
				tonicSyllablePosition = tonica(lastWord.split(syllableSeparator));
			}
			
			// (The complex note assignment logic remains the same)
			let genericNotePlaceholder = "";
			let preTonicNotes = [];
			let hasGenericNote = false;
			let hasLastNote = false;

			while (remainingSymbols.length > 0) {
				let currentSymbol = remainingSymbols[0];
				if (currentSymbol.match(TONIC_NOTE_REGEX)) {
					remainingSymbols.shift();
					let remainingSymbolsString = remainingSymbols.join(" ");
					currentSymbol = currentSymbol.replace("r1", "");
					fragmentGabc += remainingSyllables[remainingSyllables.length - tonicSyllablePosition] + currentSymbol;
					let middleNoteSymbol = remainingSymbolsString.match(GENERIC_NOTE_REGEX)[0].replace("r", "");
					remainingSymbolsString = remainingSymbolsString.replace(GENERIC_NOTE_REGEX, "");
					let finalNoteSymbol = "(" + remainingSymbolsString.match(BASIC_NOTE_REGEX)[0];
					if (tonicSyllablePosition == 1) {
						fragmentGabc = fragmentGabc.slice(0, -1);
						fragmentGabc += finalNoteSymbol.replace("(", "");
					} else {
						let syllablesToInsert = remainingSyllables.slice(tonicSyllablePosition * (-1) + 1);
						for (let i = 1; i < syllablesToInsert.length; i++) {
							fragmentGabc += syllablesToInsert.shift() + middleNoteSymbol;
						}
						fragmentGabc += syllablesToInsert.shift() + finalNoteSymbol;
					}
					remainingSymbols.shift();
					remainingSymbols.shift();
					for (let index = 0; index < tonicSyllablePosition; index++) {
						remainingSyllables.pop();
					}
					remainingSymbolsString = remainingSymbols.join(" ");
					fragmentGabc += " " + remainingSymbolsString;
					hasLastNote = true;
					break;
				}
				else if (currentSymbol.match(GENERIC_NOTE_REGEX)) {
					if (!hasGenericNote) {
						genericNotePlaceholder = "(" + currentSymbol.match(/[a-m]/) + ")";
						fragmentGabc += currentSymbol;
						hasGenericNote = true;
					}
					remainingSymbols.shift();
				}
				else if (currentSymbol.match(BASIC_NOTE_REGEX)) {
					if (hasGenericNote) {
						preTonicNotes.push(currentSymbol);
					} else {
						fragmentGabc += remainingSyllables.shift() + currentSymbol;
					}
					remainingSymbols.shift();
				}
				else if (!hasLastNote) {
					fragmentGabc += currentSymbol;
					remainingSymbols.shift();
				} else {
					remainingSymbols.shift();
				}
			}
			while (remainingSyllables.length > preTonicNotes.length) {
				let placeholderIndex = fragmentGabc.match(GENERIC_NOTE_REGEX).index;
				fragmentGabc = fragmentGabc.slice(0, placeholderIndex) + remainingSyllables.shift() + genericNotePlaceholder + fragmentGabc.slice(placeholderIndex);
			}
			while (remainingSyllables.length > 0) {
				let placeholderIndex = fragmentGabc.match(GENERIC_NOTE_REGEX).index;
				fragmentGabc = fragmentGabc.slice(0, placeholderIndex) + remainingSyllables.shift() + preTonicNotes.shift() + fragmentGabc.slice(placeholderIndex);
			}
			fragmentGabc = fragmentGabc.replace(/([a-h])\1/gm, "$1").replace(GENERIC_NOTE_REGEX, "").replace(GENERIC_NOTE_REGEX, "").replace("'", " (,) ");
			fragmentGabc += " ";
		}
		return fragmentGabc;
	}


	// --- Final processing on the fully assembled string ---
	if (SHOULD_ADD_OPTIONAL_END) {
		gabcOutput += selected_model.optional_end;
	}
	gabcOutput += selected_model.end;
	
	let clef = gabcOutput.match(/\(c[0-9]\)/);
 	if (clef) {
 		clef = clef[0];
 		gabcOutput = gabcOutput.replace(/\(c[0-9]\)/g, "");
 		gabcOutput = clef + gabcOutput;
 	}
	
	gabcOutput = processGabc(gabcOutput);
	
	if (LATEX_MODE) {
		gabcOutput = gabcOutput.replaceAll("<sp>V/</sp>", "<c><sp>V/</sp></c>. ");
		gabcOutput = gabcOutput.replaceAll("<sp>R/</sp>", "<c><sp>R/</sp></c>. ")
	}
	
	GABC_OUTPUT_ELEMENT.value = gabcOutput;
	initializeAndLayoutChant("gabc", "svg-final");
}
// --- CHANGE END ---