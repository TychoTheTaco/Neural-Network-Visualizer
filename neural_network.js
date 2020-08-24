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

    feed(input){
        for (let i = 0; i < this._size; i++){
            this._net[i] = this._biases[i];
            for (let j = 0; j < this._inputSize; j++)  {
                this._net[i] += this._weights[i][j] * input[j];
            }
            this._out[i] = sig(this._net[i]);
        }
        return [this._net, this._out];
    }
}

class NeuralNetwork{

    constructor(layer_sizes){
        this._layer_sizes = layer_sizes;
        this._layers = [];
        this._inputs = [];
        this._step_index = [0];

        this._learning_rate = 0.5;

        this._target_output = [];
        this._output = [];
        this._layer_index = 0;
        this._neuron_index = -1;
        this._last_layer_losses = [];

        this._layers = [];
        for (let i = 1; i < layer_sizes.length; i++){
            this._layers.push(new Layer(layer_sizes[i - 1], layer_sizes[i]));
        }
        this._layerCount = this._layers.length;
    }

    reset(){
        this._step_index = [0];
        this._target_output = [];
        this._output = [];
        this._layer_index = 0;
        this._neuron_index = -1;
        this._last_layer_losses = [];
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
        const result = await this._feedForward(input);
        //console.log('OUTPUT: ', result);

        const error = this._calculate_error(target_output);
        //console.log('ERROR: ', error);
        console.log('loss: ', error.reduce((a, b) => a + b, 0));

        this.summary();

        this._target_output = target_output;
        const changes = this._backProp(input);
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

    _backProp(input){
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
                    changes.set(`${i}_${j}_${k}`, this._learning_rate * -(d * a));
                }
            }
        }
        return changes;
    }

    _calculate_error(target_output){
        const error = [];
        for (let i = 0; i < this._layer_sizes[this._layerCount]; i++){
            error[i] = 0.5 * Math.pow(target_output[i] - this._layers[this._layerCount - 1]._out[i], 2);
        }
        return error;
    }

    async _feedForward(input){
        let result = this._layers[0].feed(input);
        for (let i = 1; i < this._layerCount; i++){
            await wait();
            result = this._layers[i].feed(this._layers[i - 1]._out);
        }
        return result[1];
    }

    _getMaxSubSteps(step_id){
        let sub_step_count = 0;
        if (step_id == 'feed_forward'){
            for (let i = 1; i < this._layer_sizes.length; i++){
                sub_step_count += this._layer_sizes[i];
            }
        }else if (step_id == 'calculate_loss'){
            sub_step_count += this._layer_sizes[this._layer_sizes.length - 1] + 1;
        }else if (step_id == 'back_prop'){
            for (let i = 0; i < this._layers.length; i++){
                sub_step_count += this._layer_sizes[i] * this._layers[i].weights.length;
            }
        }
        return sub_step_count
    }

    async step(){
        let result = null;
        if (this._step_index[0] == 0){
            if (this._step_index.length == 1){
                this._prev_output = this._inputs;
                this._step_index.push(0);
            }
           
            if (this._neuron_index + 1 == this._layer_sizes[this._layer_index + 1]){
                this._layer_index++;
                this._neuron_index = 0;
                this._prev_output = this._output;
                this._output = [];
            }else{
                this._neuron_index++;
            }

            this._output.push(this._feed_step(this._prev_output, this._layer_index, this._neuron_index));

            result = ['feed_forward', ++this._step_index[1], this._getMaxSubSteps('feed_forward')];

            //Next step
            if (this._layer_index == this._layers.length - 1 && this._neuron_index == this._layer_sizes[this._layer_index + 1] - 1){
                this._step_index = [1];
            }
        }else if (this._step_index[0] == 1){
            if (this._step_index.length == 1){
                this._step_index.push(0);
                this._loss = 0;
                this._neuron_index = -1;
            }

            this._neuron_index++;

            const loss = this._error_step(this._neuron_index);
            this._last_layer_losses.push(loss);
            this._loss += loss;

            result = ['calculate_loss', ++this._step_index[1], this._getMaxSubSteps('calculate_loss')];

            //Next step
            if (this._neuron_index + 1 == this._layer_sizes[this._layer_index + 1]){
                this._step_index = [2];
            }
        }else if (this._step_index[0] == 2){
            if (this._step_index.length == 1){
                this._step_index.push(0);
            }
            result = ['sum_losses', ++this._step_index[1], this._getMaxSubSteps('calculate_loss')];
            this._step_index = [3];
        }else if (this._step_index[0] == 3){
            if (this._step_index.length == 1){
                this._step_index.push(0);
                this._neuron_index = 0;
                this._weight_index = -1;
            }

            this._weight_index++;
            if (this._weight_index == this._layer_sizes[this._layer_index]){
                this._neuron_index++;
                this._weight_index = 0;
            }

            if (this._neuron_index == this._layer_sizes[this._layer_index + 1]){
                this._layer_index--;
                this._neuron_index = 0;
            }

            result = ['back_prop', ++this._step_index[1], this._getMaxSubSteps('back_prop')];
        }
        return result;
    }

    _error_step(neuron_index){
        return 0.5 * Math.pow(this._target_output[neuron_index] - this._layers[this._layers.length - 1].activations[neuron_index], 2);
    }

    async _feed_step(input, layer_index, neuron_index){
        //console.log('feed step: ', layer_index, ' ', neuron_index, 'input: ', input);
        await wait();
        console.log('continue');
        let sum = 0;
        for (let j = 0; j < input.length; j++){
            sum += this._layers[layer_index].weights[neuron_index][j] * input[j];
        }
        sum += this._layers[layer_index].biases[neuron_index];
        this._layers[layer_index].values[neuron_index] = sum;
        this._layers[layer_index].activations[neuron_index] = sig(this._layers[layer_index].values[neuron_index]);
        return this._layers[layer_index].activations[neuron_index];
    }

    _feed(input, layer_index){
        const output = [];
        for (let i = 0; i < this._layer_sizes[layer_index]; i++){
            let sum = 0;
            for (let j = 0; j < input.length; j++){
                sum += this._layers[layer_index].weights[i][j] * input[j];
            }
            sum += this._layers[layer_index].biases[i];
            this._layers[layer_index].values[i] = sum;
            this._layers[layer_index].activations[i] = sig(this._layers[layer_index].values[i]);
            output.push(this._layers[layer_index].activations[i]);
        }
        return output;
    }
}

async function wait(){
    console.log('Waiting...');
    return new Promise((resolve) => {
        const single_example_button = document.getElementById('single_example_button');
        single_example_button.addEventListener('click', (event) => {
            resolve();
        })
      });
}
