'use strict';

function sig(x){
    return 1 / (1 + Math.pow(Math.E, -x));
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
    }

    reset(){
        this._step_index = [0];
        this._target_output = [];
        this._output = [];
        this._layer_index = 0;
        this._neuron_index = -1;
        this._last_layer_losses = [];
    }

    initialize(weights, biases){
        this._layers = [];
        for (let i = 0; i < weights.length; i++){
            this._layers.push({'weights': weights[i], 'biases': biases[i], 'values': [], 'activations': []});
        }
    }

    initializeRandomly(){
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
    }

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

    step(){
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

    _feed_step(input, layer_index, neuron_index){
        //console.log('feed step: ', layer_index, ' ', neuron_index, 'input: ', input);
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
