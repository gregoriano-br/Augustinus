import generateGabc, { defaultModels } from '../../src/augustinus';
import type { Model, Parameters } from '../../src/augustinus';
declare const exsurge: any;

let models: Model[] = defaultModels;

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

const customOptions = document.getElementById('custom-options') as HTMLDivElement;
const customSimplesOptions = document.getElementById('custom-simples-options') as HTMLDivElement;
const customSoleneOptions = document.getElementById('custom-solene-options') as HTMLDivElement;
const customNoteInput = document.getElementById('custom-note') as HTMLInputElement;
const customClefSelect = document.getElementById('custom-clef') as HTMLSelectElement;
const customPatternTextArea = document.getElementById('custom-pattern') as HTMLTextAreaElement;
const customStartInput = document.getElementById('custom-start') as HTMLInputElement;

function handleModelChange() {
  const selectedModelIndex = parseInt(modelSelect.value, 10);
  const selectedModel = models[selectedModelIndex];

  if (selectedModel) {
    if (selectedModel.start) {
      customStartInput.value = selectedModel.start;
    } else {
      customStartInput.value = customStartInput.defaultValue;
    }
    if (selectedModel.default) {
      customPatternTextArea.value = selectedModel.default;
    } else {
      customPatternTextArea.value = customPatternTextArea.defaultValue;
    }

    if (selectedModel.type === 'custom') {
      customOptions.style.display = 'block';
      if (selectedModel.tom === 'simples') {
        customSimplesOptions.style.display = 'block';
        customSoleneOptions.style.display = 'none';
      } else if (selectedModel.tom === 'solene') {
        customSimplesOptions.style.display = 'none';
        customSoleneOptions.style.display = 'block';
      }
    } else {
      customOptions.style.display = 'none';
    }
  }
}

function initializeAndLayoutChant(gabc: string) {
  const ctxt = new exsurge.ChantContext();
  ctxt.lyricTextFont = "'Crimson Text', serif";
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
    customNote: customNoteInput.value,
    customClef: customClefSelect.value,
    customPattern: customPatternTextArea.value,
    customStart: customStartInput.value,
  };

  const gabc = generateGabc(inputText, selectedModel, parameters);
  gabcTextArea.value = gabc;

  initializeAndLayoutChant(gabc);
}

modelSelect.addEventListener('change', handleModelChange);
generateButton.addEventListener('click', generate);
gabcTextArea.addEventListener('input', () => {
  const gabc = gabcTextArea.value;
  initializeAndLayoutChant(gabc);
});

models.forEach((model, index) => {
  const option = document.createElement('option');
  option.value = index.toString();
  option.textContent = model.name;
  modelSelect.appendChild(option);
});
handleModelChange();
