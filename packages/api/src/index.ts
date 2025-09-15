import express from 'express';
import generateGabc, { defaultModels } from '@augustinus/core';
import type { Model, Parameters } from '@augustinus/core';

const app = express();
const port = 3000;

app.use(express.json());

app.post('/generate', (req, res) => {
    const { text, modelName, parameters } = req.body;

    if (!text || !modelName) {
        return res.status(400).send('Missing required parameters: text and modelName');
    }

    const model = defaultModels.find((m: Model) => m.name === modelName);

    if (!model) {
        return res.status(400).send(`Model '${modelName}' not found.`);
    }

    const gabc = generateGabc(text, model, parameters);

    // The frontend uses a div to render the svg, but we are on the server.
    // I need to find a way to get the svg string without a DOM element.
    // I will check the documentation of the library to see if it is possible.
    // For now, I will just return the gabc.
    res.send(gabc);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
