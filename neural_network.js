'use strict';

function sig(x) {
    return 1 / (1 + Math.pow(Math.E, -x));
}

function dsig(x) {
    return sig(x) * (1 - sig(x));
}

class Layer {

    constructor(inputSize, size) {
        this._inputSize = inputSize;
        this._size = size;
        this._weights = [];
        this._biases = [];

        this._net = [];
        this._out = [];
    }

    initializeRandomly() {
        for (let i = 0; i < this._size; i++) {
            this._weights[i] = [];
            this._biases[i] = 1;
            for (let j = 0; j < this._inputSize; j++) {
                this._weights[i][j] = (Math.random() * 2) - 1;
            }
        }
    }

    initialize(weights, biases) {
        this._weights = weights;
        this._biases = biases;
    }

    async feed(input) {
        return new Promise(async resolve => {
            for (let i = 0; i < this._size; i++) {
                this._net[i] = this._biases[i];
                for (let j = 0; j < this._inputSize; j++) {
                    this._net[i] += this._weights[i][j] * input[j];
                }
                this._out[i] = sig(this._net[i]);
                this._network._stepIndex[1] += 1;
                await waitStep(this._network._onStepComplete);
            }
            resolve([this._net, this._out]);
        });
    }
}

class NeuralNetwork {

    constructor(layerSizes) {
        this._layerSizes = layerSizes;

        this._learningRate = 0.5;

        this._layers = [];
        for (let i = 1; i < layerSizes.length; i++) {
            this._layers.push(new Layer(layerSizes[i - 1], layerSizes[i]));
            this._layers[i - 1]._network = this;
        }
        this._layerCount = this._layers.length;

        //used only by step visualizer
        this._onStepComplete = () => {
            console.log('step complete: ', this._stepIndex);
        };
        this._stepIndex = [0, 0, 0];
        this._error = [];
    }

    setWeights(weights, biases) {
        for (let i = 0; i < this._layerCount; i++) {
            this._layers[i].initialize(weights[i], biases[i]);
        }
    }

    initializeFromFile(file) {
        return fetch(file).then(response => response.text());
    }

    initializeRandomly(){
        for (let i = 0; i < this._layerCount; i++) {
            this._layers[i].initializeRandomly();
        }
    }

    /**
     * Train this model on a single training example.
     * @param {*} input
     * @param {*} target_output
     */
    async train(input, target_output) {
        //These 2 are used only by the step visualizer
        this._input = input;
        this._targetOutput = target_output;

        const result = await this._feedForward(input);
        //console.log('OUTPUT: ', result);

        //Calculate error
        const error = await this._calculate_error(target_output);
        const loss = error.reduce((a, b) => a + b, 0);

        //This is used only by the step visualizer
        this._loss = loss;

        this._stepIndex[1] += 1;
        console.log('loss: ', loss);
        await waitStep(this._onStepComplete);

        this.summary();

        this._target_output = target_output;
        const changes = await this._backProp(input);
        //console.log('CHANGES: ', changes);

        //Update weights
        for (let i = 0; i < this._layers.length; i++) {
            for (let j = 0; j < this._layers[i]._size; j++) {
                for (let k = 0; k < this._layers[i]._inputSize; k++) {
                    this._layers[i]._weights[j][k] += changes.get(`${i}_${j}_${k}`);
                }
            }
        }

        this._stepIndex = [3, 1];
        this._onStepComplete();

        this.summary();
    }

    summary() {
        for (let i = 0; i < this._layers.length; i++) {
            console.log(`[Layer ${i}]`);
            for (let j = 0; j < this._layers[i]._size; j++) {
                let weightString = '';
                for (let k = 0; k < this._layers[i]._inputSize; k++) {
                    weightString += this._layers[i]._weights[j][k].toFixed(9) + " ";
                }
                console.log(`[Neuron ${j}]: ${weightString}`);
            }
        }
    }

    _der(i, j) {
        let derivative = 0;
        let generalEquationString = '';
        let equationString = '';
        if (i === this._layerCount - 1) {
            derivative = -(this._target_output[j] - this._layers[i]._out[j]);
            generalEquationString += `\\frac{\\partial{E}}{\\partial{E_${j}}} \\cdot \\frac{\\partial{E_${j}}}{\\partial{out^${i}_${j}}}`;
            equationString += `-\\left( ${this._target_output[j]} - ${this._layers[i]._out[j]} \\right)`;
        }else{
            generalEquationString += '\\left(';
            equationString += '\\left(';
            for (let k = 0; k < this._layers[i + 1]._size; k++) {
                const d = this._der(i + 1, k);
                derivative += d[0] * this._layers[i + 1]._weights[k][j];
                generalEquationString += `\\left(` + d[1] + `\\right) \\cdot \\frac{\\partial{net^${i + 1}_${k}}}{\\partial{out^${i}_${j}}}`;
                equationString += `\\left(` + d[2] + `\\right) \\cdot ${this._layers[i + 1]._weights[k][j]}`;
                if (k !== this._layers[i + 1]._size - 1){
                    generalEquationString += ' + ';
                    equationString += ' + ';
                }
            }
            generalEquationString += '\\right) ';
            equationString += '\\right) ';
        }
        generalEquationString += `\\cdot \\frac{\\partial{out^${i}_${j}}}{\\partial{net^${i}_${j}}}`;
        equationString += `\\cdot ${dsig(this._layers[i]._net[j])}`;
        return [derivative * dsig(this._layers[i]._net[j]), generalEquationString, equationString];
    }

    async _backProp(input) {
        this._stepIndex = [2, 0];
        return new Promise(async resolve => {
            const changes = new Map();
            for (let i = this._layerCount - 1; i >= 0; i--) {
                for (let j = 0; j < this._layers[i]._size; j++) {
                    const d = this._der(i, j);
                    for (let k = 0; k < this._layers[i]._inputSize; k++) {
                        let a = 0;
                        if (i === 0) {
                            a = input[k];
                        } else {
                            a = this._layers[i - 1]._out[k];
                        }
                        changes.set(`${i}_${j}_${k}`, this._learningRate * -(d[0] * a));

                        //this._derstring = this._ders(i, j) + ` \\cdot \\frac{\\partial{net^${i}_${j}}}{\\partial{w^${i}_{(${j})(${k})}}}`;
                        this._derstring = d[1] + ` \\cdot \\frac{\\partial{net^${i}_${j}}}{\\partial{w^${i}_{(${j})(${k})}}}`;
                        this._derivativeEquationString = d[2] + ` \\cdot ${a}`;
                        this._stepIndex[1] += 1;
                        await waitStep(this._onStepComplete);
                    }
                }
            }
            resolve(changes);
        });

    }

    _calculate_error(target_output) {
        this._stepIndex = [1, 0];
        const error = [];
        for (let i = 0; i < this._layerSizes[this._layerCount]; i++) {
            error[i] = 0.5 * Math.pow(target_output[i] - this._layers[this._layerCount - 1]._out[i], 2);

            //this is used only by the step visualizer
            this._error[i] = error[i];
        }
        return error;
    }

    async _feedForward(input) {
        this._stepIndex = [0, 0];
        return new Promise(async (resolve) => {
            let result = await this._layers[0].feed(input);
            for (let i = 1; i < this._layerCount; i++) {
                result = await this._layers[i].feed(this._layers[i - 1]._out);
            }
            resolve(result[1]);
        });
    }

    _getMaxSubSteps(step_id) {
        let sub_step_count = 0;
        if (step_id == 0) { //feed forward
            for (let i = 1; i < this._layerSizes.length; i++) {
                sub_step_count += this._layerSizes[i];
            }
        } else if (step_id == 1) { //calculate loss
            //sub_step_count += this._layerSizes[this._layerSizes.length - 1] + 1;
            return 1;
        } else if (step_id == 2) { //back prop
            for (let i = 0; i < this._layers.length; i++) {
                sub_step_count += this._layers[i]._size * this._layers[i]._inputSize;
            }
        }else if (step_id == 3){
            return 1;
        }
        return sub_step_count
    }
}

let stepper = null;
function setStepper(s){
    stepper = s;
}

async function waitStep(callback) {
    callback();
    console.log('Waiting...');
    return new Promise((resolve) => {
        //const single_example_button = document.getElementById('single_example_button');
        stepper.onclick = (event) => {
            resolve();
        };
    });
}

class Stepper{

    constructor() {

    }

    async wait(){
        //wait until a call to step is made
        console.log('Waiting...');
        return new Promise(resolve => {
            this._resolve = resolve; //wrong this
        });
    }

    step(){
        //proceed to next step
        console.log(this._resolve);
        this._resolve();
    }
}
