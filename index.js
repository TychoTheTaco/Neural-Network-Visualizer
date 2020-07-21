'use strict';

function createTable(rows) {
    const table = document.createElement('table');
    for (let i = 0; i < rows.length; i++){
        const tr = document.createElement('tr');
        for (let j = 0; j < rows[i].length; j++){
            if (i == 0){
                const th = document.createElement('th');
                th.innerHTML = rows[i][j];
                tr.appendChild(th);
            }else{
                const td = document.createElement('td');
                td.innerHTML = rows[i][j];
                tr.appendChild(td);
            }
        }
        table.appendChild(tr);
    }
    return table;
}

function sig(x){
    return 1 / (1 + Math.pow(Math.E, -x));
}

class NeuralNetwork{

    constructor(layer_sizes){
        this._layer_sizes = layer_sizes;
        this._layers = [];
        this._inputs = [];
        this._step_index = 0;
        this._step_id = 'feed_forward';
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
                    weights[j].push(Math.random());
                }
            }
            w.push(weights);
            b.push(biases);
        }
        this.initialize(w, b);
    }

    setInputs(inputs){
        this._inputs = inputs;
    }

    _setStep(step_id){
        this._step_id = step_id;
        this._step_index = 0;
    }

    getStepId(){
        return this._step_id;
    }

    step(){
        if (this._step_id == 'feed_forward'){
            if (this._step_index == 0){
                this._prev_output = this._inputs;
            }
            this._prev_output = this._feed(this._prev_output, this._step_index++);
            console.log(this._prev_output);
            if (this._step_index == this._layers.length){
                this._setStep('calculate_loss');
            }
        }else if (this._step_id == 'calculate_loss'){

        }
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

function format(x, precision){
    let s = x.toFixed(precision);
    for (let i = s.length - 1; i > 0; i--){
        if (s[i] == '0'){
            s = s.slice(0, -1);
        }else{
            break;
        }
    }
    return s;
}

class NeuralNetworkElement extends HTMLElement{

    static INPUT_LAYER_COLOR = 'red';
    static HIDDEN_LAYER_COLOR = 'blue';
    static OUTPUT_LAYER_COLOR = 'green';

    constructor(){
        super();
        this._neuron_details_div = document.getElementById('neuron_details_div');
        this._neural_network = undefined;
        this._edit_mode_enabled = false;
    }

    setNeuralNetwork(neural_network){
        this._neural_network = neural_network;
        this._refresh();
    }

    connectedCallback(){
        //Cant do this in constructor because chrome error "the result must not have attributes" when creating object from js.
        this._applyStyle();
    }

    isEditMode(){
        return this._edit_mode_enabled;
    }

    setEditMode(enabled){
        this._edit_mode_enabled = enabled;
        this._refresh();
    }

    _refresh(){
        this.innerHTML = '';
        this._applyStyle();
    }

    _applyStyle(){
        this.style.display = 'flex';
        this.style.justifyContent = 'space-around';

        if (this._neural_network === undefined){
            return;
        }

        for (let i = 0; i < this._neural_network._layer_sizes.length; i++){
            const layer_div = document.createElement('div');
            this.appendChild(layer_div);
            layer_div.setAttribute('id', `layer_${i}`);
            layer_div.style.display = 'flex';
            layer_div.style.flexDirection = 'column';
            layer_div.style.padding = '8px';

            //Layer name
            const layer_name_label = document.createElement('label');
            if (i == 0){
                layer_name_label.innerHTML = `Input`;
            }else if (i == this._neural_network._layer_sizes.length - 1){
                layer_name_label.innerHTML = `Output`;
            }else{
                layer_name_label.innerHTML = `Layer ${i}`;
            }
            layer_name_label.style.paddingBottom = '16px';
            layer_name_label.style.textAlign = 'center';
            layer_div.appendChild(layer_name_label);

            //Controls
            const controls_div = document.createElement('div');
            controls_div.setAttribute('id', `${layer_div.id}_controls`);
            layer_div.appendChild(controls_div);
            controls_div.style.display = 'flex';
            controls_div.style.flexDirection = 'column';
            controls_div.style.marginBottom = '16px';
            controls_div.style.position = 'relative';

            const neuron_controls_div = document.createElement('div');
            controls_div.appendChild(neuron_controls_div);
            neuron_controls_div.style.position = 'relative';
            neuron_controls_div.style.display = 'flex';
            neuron_controls_div.style.justifyContent = 'center';
            neuron_controls_div.style.alignItems = 'center';
            neuron_controls_div.style.gap = '8px';
            
            const remove_neuron_button = document.createElement('button');
            neuron_controls_div.appendChild(remove_neuron_button);
            remove_neuron_button.innerHTML = '-';
            remove_neuron_button.addEventListener('click', (event) => {
                if (this._neural_network._layer_sizes[i] > 1){
                    this._neural_network._layer_sizes[i] -= 1;
                    this._neural_network.initializeRandomly();
                    this._refresh();
                }
            });

            const neuron_count_label = document.createElement('label');
            neuron_controls_div.appendChild(neuron_count_label);
            neuron_count_label.innerHTML = `${this._neural_network._layer_sizes[i]}`;

            const add_neuron_button = document.createElement('button');
            neuron_controls_div.appendChild(add_neuron_button);
            add_neuron_button.innerHTML = '+';
            add_neuron_button.addEventListener('click', (event) => {
                this._neural_network._layer_sizes[i] += 1;
                this._neural_network.initializeRandomly();
                this._refresh();
            });
          
            //Delete layer button
            const delete_layer_button = document.createElement('button');
            controls_div.appendChild(delete_layer_button);
            delete_layer_button.innerHTML = 'Delete';
            delete_layer_button.style.marginTop = '4px';
            if (i == 0 || i == this._neural_network._layer_sizes.length - 1){
                delete_layer_button.style.visibility = 'hidden';
            }
            delete_layer_button.addEventListener('click', (event) => {
                this._neural_network._layer_sizes.splice(i, 1);
                this._neural_network.initializeRandomly();
                this._refresh();
            });

            let layer_color;
            if (i == 0){
                layer_color = NeuralNetworkElement.INPUT_LAYER_COLOR;
            }else if (i == this._neural_network._layer_sizes.length - 1){
                layer_color = NeuralNetworkElement.HIDDEN_LAYER_COLOR;
            }else{
                layer_color = NeuralNetworkElement.OUTPUT_LAYER_COLOR;
            }

            //Neurons
            const neurons_div = document.createElement('div');
            layer_div.appendChild(neurons_div);
            neurons_div.style.flexGrow = '1';
            neurons_div.style.display = 'flex';
            neurons_div.style.flexDirection = 'column';
            neurons_div.style.alignItems = 'center';
            neurons_div.style.justifyContent = 'center';
            neurons_div.style.gap = '20px';
            for (let j = 0; j < this._neural_network._layer_sizes[i]; j++){
                const neuron = document.createElement('div');
                neurons_div.appendChild(neuron);
                neuron.setAttribute('id', `${layer_div.id}_neuron_${j}`);
                neuron.style.position = 'relative';
                neuron.style.zIndex = 2;
                neuron.innerHTML = `<svg height="50" width="50" style="display: block;"> <circle cx="25" cy="25" r="20" stroke="white" stroke-width="1" fill="${layer_color}" /></svg>`

                const label = document.createElement('label');
                label.setAttribute('id', `${neuron.id}_label`);
                neuron.appendChild(label);
                label.style.position = 'absolute';
                let value = null;
                if (i == 0){
                    value = this._neural_network._inputs[j];
                }else{
                    value = this._neural_network._layers[i - 1].activations[j];
                }
                if (value == null){
                    label.innerHTML = `?`;
                }else{
                    label.innerHTML = `${value.toFixed(2)}`;
                }
                
                label.style.top = `${(neuron.clientHeight - label.clientHeight) / 2}px`;
                label.style.left = `${(neuron.clientWidth - label.clientWidth) / 2}px`;
            }
        }

        //Add layer buttons
        for (let i = 0; i < this._neural_network._layer_sizes.length - 1; i++){
            const layer_div = document.getElementById(`layer_${i}`);
            const next_layer_div = document.getElementById(`layer_${i + 1}`);
            const controls_div = document.getElementById(`${layer_div.id}_controls`);

            const add_layer_button = document.createElement('button');
            controls_div.appendChild(add_layer_button);
            add_layer_button.style.position = 'absolute';
            add_layer_button.innerHTML = '+ Layer';
            add_layer_button.style.zIndex = 5;
            const distance = next_layer_div.getBoundingClientRect().left - layer_div.getBoundingClientRect().left;
            add_layer_button.style.left = `${(controls_div.clientWidth + distance - add_layer_button.clientWidth) / 2}px`;
            add_layer_button.addEventListener('click', (event) => {
                this._neural_network._layer_sizes.splice(i + 1, 0, 1);
                this._neural_network.initializeRandomly();
                this._refresh();
            });
        }

        if (this._edit_mode_enabled){
            for (let i = 0; i < this._neural_network._layer_sizes.length; i++){
                const controls_div = document.getElementById(`layer_${i}_controls`);
                controls_div.style.display = 'flex';
            }
        }else{
            for (let i = 0; i < this._neural_network._layer_sizes.length; i++){
                const controls_div = document.getElementById(`layer_${i}_controls`);
                controls_div.style.display = 'none';
            }
        }

        //Create connections
        for (let i = 1; i < this._neural_network._layer_sizes.length; i++){
            const src_layer_div = document.getElementById(`layer_${i - 1}`);
            const dst_layer_div = document.getElementById(`layer_${i}`);
            for (let j = 0; j < this._neural_network._layer_sizes[i - 1]; j++){
                const src_neuron = document.getElementById(`${src_layer_div.id}_neuron_${j}`);
                for (let k = 0; k < this._neural_network._layer_sizes[i]; k++){
                    const dst_neuron = document.getElementById(`${dst_layer_div.id}_neuron_${k}`);

                    const dst_bounds = dst_neuron.getBoundingClientRect();
                    const dst_x = dst_bounds.left + dst_bounds.width / 2;
                    const dst_y = dst_bounds.top + dst_bounds.height / 2;
                    
                    const src_bounds = src_neuron.getBoundingClientRect();
                    const src_x = src_bounds.left + src_bounds.width / 2;
                    const src_y = src_bounds.top + src_bounds.height / 2;

                    const distance = Math.sqrt(Math.pow(dst_x - src_x, 2) + Math.pow(dst_y - src_y, 2));
                    const angle = Math.atan2(dst_y - src_y, dst_x - src_x);

                    const center_x = (src_x + dst_x) / 2;
                    const center_y = (src_y + dst_y) / 2;

                    const connection_label = document.createElement('label');
                    connection_label.setAttribute('id', `weight_label_${src_neuron.id}_${dst_neuron.id}`);
                    connection_label.innerHTML = `${format(this._neural_network._layers[i - 1].weights[k][j], 4)}`;
                    connection_label.style.padding = '4px';
                    connection_label.style.borderRadius = '4px';
                    connection_label.style.zIndex = 2;
                    connection_label.style.backgroundColor = 'black'
                    connection_label.style.position = 'absolute';
                    dst_layer_div.appendChild(connection_label);
                    connection_label.style.left = `${center_x - (connection_label.getBoundingClientRect().width / 2)}px`;
                    connection_label.style.top = `${center_y - (connection_label.getBoundingClientRect().height / 2) - (4 / 2)}px`; //-4 /2 for baseline offset
                    connection_label.style.transform = `rotate(${angle}rad)`;
                    connection_label.hidden = true;

                    const connection = document.createElement('div');
                    connection.setAttribute('id', `connection_${src_neuron.id}_${dst_neuron.id}`)
                    connection.style.position = 'absolute';
                    connection.style.width = `${distance}px`;
                    connection.style.height = '1px';
                    connection.style.backgroundColor = 'gray';
                    connection.style.top = `${center_y - (1 / 2)}px`; //-1 for line thickness
                    connection.style.left = `${center_x - (distance / 2)}px`;
                    connection.style.transform = `rotate(${angle}rad)`;
                    connection.addEventListener('mouseenter', (event) => {
                        connection.style.backgroundColor = 'white';
                        connection.style.zIndex = 1;
                        connection_label.hidden = false;
                    })
                    connection.addEventListener('mouseleave', (event) => {
                        connection.style.backgroundColor = 'gray';
                        connection.style.zIndex = 0;
                        connection_label.hidden = true;
                        setSelectedNeuron(this._selected_neuron);
                    })
                    dst_layer_div.appendChild(connection);
                }
            }
        }

        const getSourceNeurons = (layer_index) => {
            layer_index--;
            const neurons = [];
            if (layer_index >= 0){
                for (let i = 0; i < this._neural_network._layer_sizes[layer_index]; i++){
                    neurons.push(document.getElementById(`layer_${layer_index}_neuron_${i}`));
                }
            }
            return neurons;
        }

        const setSelectedNeuron = (neuron) => {
            if (this._previous_selected_neuron != undefined){
                const split = this._previous_selected_neuron.id.split('_');
                const i = parseInt(split[1])
                const j = parseInt(split[3])
                
                const src_neurons = getSourceNeurons(i);
                for (let k = 0; k < src_neurons.length; k++){
                    const connection = document.getElementById(`connection_${src_neurons[k].id}_${this._previous_selected_neuron.id}`);
                    connection.style.backgroundColor = 'gray';
                    connection.style.zIndex = 0;
                    const connection_label = document.getElementById(`weight_label_${src_neurons[k].id}_${this._previous_selected_neuron.id}`);
                    connection_label.hidden = true;
                }
            }
            this._previous_selected_neuron = neuron;

            if (neuron === undefined){
                if (this._neuron_details_div != undefined){
                    this._neuron_details_div.innerHTML = '';
                }
                return;
            }

            const split = neuron.id.split('_');
            const i = parseInt(split[1])
            const j = parseInt(split[3])
            
            if (this._neural_network._layers[i - 1].values[j] === undefined){
                return;
            }

            const src_neurons = getSourceNeurons(i);
            for (let k = 0; k < src_neurons.length; k++){
                const connection = document.getElementById(`connection_${src_neurons[k].id}_${neuron.id}`);
                connection.style.backgroundColor = 'white';
                connection.style.zIndex = 1;
                const connection_label = document.getElementById(`weight_label_${src_neurons[k].id}_${neuron.id}`);
                connection_label.hidden = false;
            }

            //Neuron details
            if (this._neuron_details_div != undefined){
                this._neuron_details_div.innerHTML = `Layer ${i}, Neuron ${j}<br><br>`;

                //Step 1
                let step_1_general_equation_string = '\\(z = \\sum\\limits_{i = 0}^n (a_iw_i) + b_i\\)';
                let step_1_equation_string = '\\(';
                let step_1_result = this._neural_network._layers[i - 1].values[j];
                for (let k = 0; k < src_neurons.length; k++){
                    let inputs;
                    if (i == 1){
                        inputs = this._neural_network._inputs;
                    }else{
                        inputs = this._neural_network._layers[i - 2].activations;
                    }
                    const a = inputs[k];
                    const w = this._neural_network._layers[i - 1].weights[j][k];
                    step_1_equation_string += `${format(a, 6)} \\times ${format(w, 6)} + `;
                }
                step_1_equation_string += `${format(this._neural_network._layers[i - 1].biases[j], 6)}\\) `
                step_1_equation_string = `${format(step_1_result, 6)} = ` + step_1_equation_string;
              
                //Step 2
                let step_2_general_equation_string = '\\(a = \\sigma(z)\\)';
                let step_2_result = this._neural_network._layers[i - 1].activations[j];
                let step_2_equation_string = `\\(${format(step_2_result, 6)} = \\sigma(${format(step_1_result, 6)})\\)`;

                const table = createTable([
                    ['Generic Equations', 'Plugged In'],
                    [step_1_general_equation_string, step_1_equation_string],
                    [step_2_general_equation_string, step_2_equation_string]
                ]);
                table.style.width = '100%';
                this._neuron_details_div.appendChild(table);

                MathJax.typeset();
            }
        }

        //Apply mouse over for neurons
        for (let i = 1; i < this._neural_network._layer_sizes.length; i++){
            const layer_div = document.getElementById(`layer_${i}`);
            for (let j = 0; j < this._neural_network._layer_sizes[i]; j++){
                const neuron = document.getElementById(`${layer_div.id}_neuron_${j}`);

                neuron.addEventListener('click', (event) => {
                    if (this._selected_neuron === neuron){
                        this._selected_neuron = undefined;
                    }else{
                        this._selected_neuron = neuron;
                    }
                    setSelectedNeuron(neuron);
                });
                neuron.addEventListener('mouseenter', (event) => {
                    setSelectedNeuron(neuron);
                });
                neuron.addEventListener('mouseleave', (event) => {
                    setSelectedNeuron(this._selected_neuron);
                });
            }
        }
    }
}

customElements.define('neural-network', NeuralNetworkElement);

const neural_network_element = document.getElementById('neural_network');

const neural_network = new NeuralNetwork([2, 2, 2]);
//neural_network.initializeRandomly();
neural_network.initialize([
    [
        [0.15, 0.2],
        [0.25, 0.3]
    ],
    [
        [0.4, 0.45],
        [0.5, 0.55]
    ]
], [
    [
        0.35, 0.35
    ],
    [
        0.6, 0.6
    ]
]);
neural_network.setInputs([0.05, 0.1]);

neural_network_element.setNeuralNetwork(neural_network);

const single_step_button = document.getElementById('single_step_button');
single_step_button.addEventListener('click', (event) => {
    document.getElementById('network_step_id').innerHTML = neural_network.getStepId() + ' step: ' + (neural_network._step_index + 1);
    neural_network.step();
    neural_network_element._refresh();
});

const edit_network_button = document.getElementById('edit_network_button');
edit_network_button.addEventListener('click', (event) => {
    neural_network_element.setEditMode(!neural_network_element.isEditMode());
});