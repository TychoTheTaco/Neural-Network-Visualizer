'use strict';

function sig(x){
    return 1 / (1 + Math.pow(Math.E, -x));
}

function dsig(x){
    return sig(x) * (1 - sig(x));
}

class Layer{

    constructor(inputSize, size){
        this._inputSize = inputSize;
        this._size = size;
        this._weights = [];
        this._biases = [];

        this._net = [];
        this._out = [];
    }

    initializeRandomly(){
        for (let i = 0; i < this._size; i++){
            this._weights[i] = [];
            this._biases[i] = 1;
            for (let j = 0; j < this._inputSize; j++){
                this._weights[i][j] = 1;
            }
        }
    }

    initialize(weights, biases){
        this._weights = weights;
        this._biases = biases;
    }

    async feed(input){
        return new Promise(async resolve => {
            for (let i = 0; i < this._size; i++){
                this._net[i] = this._biases[i];
                for (let j = 0; j < this._inputSize; j++)  {
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

class NeuralNetwork{

    constructor(layerSizes){
        this._layerSizes = layerSizes;

        this._learningRate = 0.5;

        this._layers = [];
        for (let i = 1; i < layerSizes.length; i++){
            this._layers.push(new Layer(layerSizes[i - 1], layerSizes[i]));
            this._layers[i - 1]._network = this;
        }
        this._layerCount = this._layers.length;

        this._onStepComplete = () => {
            console.log('step complete: ', this._stepIndex);
        };
        this._stepIndex = [0, 0, 0];

        //used only by step visualizer
        this._error = [];
    }

    setWeights(weights, biases){
        for (let i = 0; i < this._layerCount; i++){
            this._layers[i].initialize(weights[i], biases[i]);
        }
    }

    initializeFromFile(file){
        return fetch(file).then(response => response.text());
    }

    /* initializeRandomly(){
        const w = [];
        const b = [];
        for (let i = 1; i < this._layer_sizes.length; i++){
            const weights = [];
            const biases = []
            for (let j = 0; j < this._layer_sizes[i]; j++){
                weights[j] = [];
                biases[j] = Math.random();
                for (let k = 0; k < this._layer_sizes[i - 1]; k++){
                    weights[j].push(Math.random() * 2 - 1);
                }
            }
            w.push(weights);
            b.push(biases);
        }
        this.initialize(w, b);
    } */

    process(input){
        this.reset();
        this.setInputs(input);
        for (let i = 0; i < this._getMaxSubSteps('feed_forward'); i++){
           this.step();
        }
        return this._output;
    }

    setInputs(inputs){
        this._inputs = inputs;
    }

    setTargetOutput(target_output){
        this._target_output = target_output;
    }

    getStepId(){
        return this._next_step_id;
    }

    /**
     * Train this model on a single training example.
     * @param {*} input 
     * @param {*} output 
     */
    async train(input, target_output){
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
        for (let i = 0; i < this._layers.length; i++){
            for (let j = 0; j < this._layers[i]._size; j++){
                for (let k = 0; k < this._layers[i]._inputSize; k++){
                    this._layers[i]._weights[j][k] += changes.get(`${i}_${j}_${k}`);
                }
            }
        }

        this.summary();
    }

    summary(){
        for (let i = 0; i < this._layers.length; i++){
            console.log(`[Layer ${i}]`);
            for (let j = 0; j < this._layers[i]._size; j++){
                let weightString = '';
                for (let k = 0; k < this._layers[i]._inputSize; k++){
                    weightString += this._layers[i]._weights[j][k].toFixed(9) + " ";
                }
                console.log(`[Neuron ${j}]: ${weightString}`);
            }
        }
    }

    _der(i, j){
        if (i == this._layerCount - 1){
            return -(this._target_output[j] - this._layers[i]._out[j]) * dsig(this._layers[i]._net[j]);
        }
        let d = 0;
        for (let k = 0; k < this._layers[i + 1]._size; k++){
            d += this._der(i + 1, k) * this._layers[i + 1]._weights[k][j];
        }
        return d * dsig(this._layers[i]._net[j]);
    }

    async _backProp(input){
        this._stepIndex = [2, 0];
        return new Promise(async resolve => {
            const changes = new Map();
            for (let i = this._layerCount - 1; i >= 0; i--){
                for (let j = 0; j < this._layers[i]._size; j++){
                    const d = this._der(i, j);
                    for (let k = 0; k < this._layers[i]._inputSize; k++){
                        let a = 0;
                        if (i == 0){
                            a = input[k];
                        }else{
                            a = this._layers[i - 1]._out[k];
                        }
                        changes.set(`${i}_${j}_${k}`, this._learningRate * -(d * a));

                        this._stepIndex[1] += 1;
                        await waitStep(this._onStepComplete);
                    }
                }
            }
            resolve(changes);
        });
        
    }

    async _calculate_error(target_output){
        this._stepIndex = [1, 0];
        return new Promise(async resolve => {
            const error = [];
            for (let i = 0; i < this._layerSizes[this._layerCount]; i++){
                error[i] = 0.5 * Math.pow(target_output[i] - this._layers[this._layerCount - 1]._out[i], 2);

                //this is used only by the step visualizer
                this._error[i] = error[i];

                this._stepIndex[1] += 1;
                await waitStep(this._onStepComplete);
            }
            resolve(error);
        })
    }

    async _feedForward(input){
        this._stepIndex = [0, 0];
        return new Promise(async (resolve) => {
            let result = await this._layers[0].feed(input);
            for (let i = 1; i < this._layerCount; i++){
                result = await this._layers[i].feed(this._layers[i - 1]._out);
            }
            resolve(result[1]);
        });
    }

    _getMaxSubSteps(step_id){
        let sub_step_count = 0;
        if (step_id == 0){ //feed forward
            for (let i = 1; i < this._layerSizes.length; i++){
                sub_step_count += this._layerSizes[i];
            }
        }else if (step_id == 1){ //calculate loss
            sub_step_count += this._layerSizes[this._layerSizes.length - 1] + 1;
        }else if (step_id == 2){ //back prop
            for (let i = 0; i < this._layers.length; i++){
                sub_step_count += this._layers[i]._size * this._layers[i]._inputSize;
            }
        }
        return sub_step_count
    }
}

async function waitStep(callback){
    callback();
    console.log('Waiting...');
    return new Promise((resolve) => {
        const single_example_button = document.getElementById('single_example_button');
        single_example_button.onclick = (event) => {
            resolve();
        };
    });
}
