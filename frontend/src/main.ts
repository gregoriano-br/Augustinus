import generateGabc from '../../augustinus';
import type { Model, Parameters } from '../../augustinus';

declare const exsurge:
  any; // You might want to find or create a type definition for exsurge

let models: Model[] = [];

const modelSelect = document.getElementById('model') as HTMLSelectElement;
const separatorInput = document.getElementById('separator') as HTMLInputElement;
const addOptionalStartCheckbox = document.getElementById('addOptionalStart') as HTMLInputElement;
const addOptionalEndCheckbox = document.getElementById('addOptionalEnd') as HTMLInputElement;
const exsurgeCheckbox = document.getElementById('exsurge') as HTMLInputElement;
const removeNumbersCheckbox = document.getElementById('removeNumbers') as HTMLInputElement;
const removeParenthesisCheckbox = document.getElementById('removeParenthesis') as HTMLInputElement;
const removeSeparatorCheckbox = document.getElementById('removeSeparator') as HTMLInputElement;
const inputTextArea = document.getElementById('input') as HTMLTextAreaElement;
const gabcTextArea = document.getElementById('gabc') as HTMLTextAreaElement;
const generateButton = document.getElementById('generate') as HTMLButtonElement;
const chantContainer = document.getElementById('chant-container') as HTMLDivElement;

async function loadModels() {
  try {
    const response = await fetch('/models.json');
    models = await response.json();
    models.forEach((model, index) => {
      const option = document.createElement('option');
      option.value = index.toString();
      option.textContent = model.name;
      modelSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading models:', error);
  }
}

function initializeAndLayoutChant(gabc: string) {
  const ctxt = new exsurge.ChantContext();
  ctxt.lyricTextFont = "'Crimson Text', serif";
  ctxt.lyricTextSize *= 1.2;
  ctxt.dropCapTextFont = ctxt.lyricTextFont;
  ctxt.annotationTextFont = ctxt.lyricTextFont;

  const mappings = exsurge.Gabc.createMappingsFromSource(ctxt, gabc);
  const score = new exsurge.ChantScore(ctxt, mappings, true);

  score.performLayoutAsync(ctxt, () => {
    score.layoutChantLines(ctxt, chantContainer.clientWidth, () => {
      chantContainer.innerHTML = score.createSvg(ctxt);
    });
  });
}

function generate() {
  const selectedModelIndex = parseInt(modelSelect.value, 10);
  const selectedModel = models[selectedModelIndex];
  const inputText = inputTextArea.value;

  if (!selectedModel || !inputText) {
    return;
  }

  const parameters: Parameters = {
    separator: separatorInput.value,
    addOptionalStart: addOptionalStartCheckbox.checked,
    addOptionalEnd: addOptionalEndCheckbox.checked,
    exsurge: exsurgeCheckbox.checked,
    removeNumbers: removeNumbersCheckbox.checked,
    removeParenthesis: removeParenthesisCheckbox.checked,
    removeSeparator: removeSeparatorCheckbox.checked,
  };

  const gabc = generateGabc(inputText, selectedModel, parameters);
  gabcTextArea.value = gabc;

  initializeAndLayoutChant(gabc);
}

generateButton.addEventListener('click', generate);

loadModels();