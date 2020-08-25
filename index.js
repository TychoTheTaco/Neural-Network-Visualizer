'use strict';

function createTable(rows, skipTitle=false, width='20%', format=true) {
    const table = document.createElement('table');
    if (format){
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
    }
    table.style.marginTop = '8px';
    table.style.marginBottom = '8px';
    
    for (let i = 0; i < rows.length; i++){
        const tr = document.createElement('tr');
        for (let j = 0; j < rows[i].length; j++){
            if (i == 0 && !skipTitle){
                const th = document.createElement('th');
                if (j == 0 && format){
                    th.style.width = width;
                }
                th.innerHTML = rows[i][j];
                tr.appendChild(th);
            }else{
                const td = document.createElement('td');
                td.style.overflow = 'auto';
                if (j == 0 && format){
                    td.style.width = width;
                }
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

function format(x, precision){
    let s = x.toFixed(precision);
    for (let i = s.length - 1; i > 0; i--){
        if (s[i] == '0'){
            s = s.slice(0, -1);
        }else{
            break;
        }
    }

    if (s.endsWith('.')){
        s += '0';
    }

    return s;
}

class NeuralNetworkElement extends HTMLElement{

    static INPUT_LAYER_COLOR = '#2196F3';
    static HIDDEN_LAYER_COLOR = '#3F51B5';
    static OUTPUT_LAYER_COLOR = '#673AB7';

    constructor(){
        super();
        this._calculation_details_div = document.getElementById('calculation_details_div');
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

        //Reset step when network changes
        this._layer_index = 0;
        this._neuron_index = -1;
    }

    _refresh(){
        this.innerHTML = '';
        this._applyStyle();
    }

    _updateLabels(){
        for (let i = 0; i < this._neural_network._layerSizes.length; i++){
            for (let j = 0; j < this._neural_network._layerSizes[i]; j++){
                const label = document.getElementById(`layer_${i}_neuron_${j}_label`);
                let value = null;
                if (i == 0){
                    value = this._neural_network._inputs[j];
                }else{
                    value = this._neural_network._layers[i - 1]._out[j];
                }
                if (value == null){
                    label.innerHTML = `?`;
                }else{
                    label.innerHTML = `${value.toFixed(2)}`;
                }
                const neuron = document.getElementById(`layer_${i}_neuron_${j}`);
                label.style.top = `${(neuron.clientHeight - label.clientHeight) / 2}px`;
                label.style.left = `${(neuron.clientWidth - label.clientWidth) / 2}px`;
            }
        }
    }

    _applyStyle(){
        this.style.display = 'flex';
        this.style.justifyContent = 'space-around';

        if (this._neural_network === undefined){
            return;
        }

        for (let i = 0; i < this._neural_network._layerSizes.length; i++){
            const layer_container = document.createElement('div');
            layer_container.style.display = 'flex';
            this.appendChild(layer_container);

            const layer_div = document.createElement('div');
            layer_container.appendChild(layer_div);
            layer_div.setAttribute('id', `layer_${i}`);
            layer_div.style.display = 'flex';
            layer_div.style.flexDirection = 'column';
            layer_div.style.padding = '8px';

            //Layer name
            const layer_name_label = document.createElement('label');
            if (i == 0){
                layer_name_label.innerHTML = `Input`;
            }else if (i == this._neural_network._layerSizes.length - 1){
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

            //Delete layer button
            const delete_layer_button = document.createElement('button');
            controls_div.appendChild(delete_layer_button);
            delete_layer_button.innerHTML = 'Delete';
            if (i == 0 || i == this._neural_network._layerSizes.length - 1){
                delete_layer_button.style.visibility = 'hidden';
            }
            delete_layer_button.addEventListener('click', (event) => {
                this._neural_network._layerSizes.splice(i, 1);
                this._neural_network.initializeRandomly();
                this._refresh();
            });

            const neuron_controls_div = document.createElement('div');
            controls_div.appendChild(neuron_controls_div);
            neuron_controls_div.style.marginTop = '4px';
            neuron_controls_div.style.position = 'relative';
            neuron_controls_div.style.display = 'flex';
            neuron_controls_div.style.justifyContent = 'center';
            neuron_controls_div.style.alignItems = 'center';
            neuron_controls_div.style.gap = '8px';
            
            const remove_neuron_button = document.createElement('button');
            neuron_controls_div.appendChild(remove_neuron_button);
            remove_neuron_button.innerHTML = '-';
            remove_neuron_button.addEventListener('click', (event) => {
                if (this._neural_network._layerSizes[i] > 1){
                    this._neural_network._layerSizes[i] -= 1;
                    this._neural_network.initializeRandomly();
                    this._refresh();
                }
            });

            const neuron_count_label = document.createElement('label');
            neuron_controls_div.appendChild(neuron_count_label);
            neuron_count_label.innerHTML = `${this._neural_network._layerSizes[i]}`;

            const add_neuron_button = document.createElement('button');
            neuron_controls_div.appendChild(add_neuron_button);
            add_neuron_button.innerHTML = '+';
            add_neuron_button.addEventListener('click', (event) => {
                this._neural_network._layerSizes[i] += 1;
                this._neural_network.initializeRandomly();
                this._refresh();
            });

            let layer_color;
            if (i == 0){
                layer_color = NeuralNetworkElement.INPUT_LAYER_COLOR;
            }else if (i == this._neural_network._layerSizes.length - 1){
                layer_color = NeuralNetworkElement.OUTPUT_LAYER_COLOR;
            }else{
                layer_color = NeuralNetworkElement.HIDDEN_LAYER_COLOR;
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
            for (let j = 0; j < this._neural_network._layerSizes[i]; j++){
                const neuron = document.createElement('div');
                neurons_div.appendChild(neuron);
                neuron.setAttribute('id', `${layer_div.id}_neuron_${j}`);
                neuron.style.position = 'relative';
                neuron.style.zIndex = 2;
                neuron.innerHTML = `<svg height="50" width="50" style="display: block;"> <circle cx="25" cy="25" r="20" stroke="white" stroke-width="1" fill="${layer_color}" /></svg>`

                const label = document.createElement('label');
                label.setAttribute('id', `${neuron.id}_label`);
                neuron.appendChild(label);
                label.style.width = '100%';
                label.style.textAlign = 'center';
                label.style.position = 'absolute';
                let value = null;
                if (i == 0){
                    value = this._neural_network._inputs[j];
                }else{
                    value = this._neural_network._layers[i - 1]._out[j];
                }
                if (value == null){
                    label.innerHTML = `?`;
                }else{
                    label.innerHTML = `${value.toFixed(2)}`;
                }
                
                label.style.top = `${(neuron.clientHeight - label.clientHeight) / 2}px`;
            }

            //Target output labels
            if (i == this._neural_network._layers.length){
                const target_output_div = document.createElement('div');
                target_output_div.setAttribute('id', `layer_${i}_target_output_div`)
                target_output_div.style.padding = '8px';
                target_output_div.style.paddingLeft = '24px';
                target_output_div.style.display = 'flex';
                target_output_div.style.flexDirection = 'column';
                layer_container.appendChild(target_output_div);

                const title_label = document.createElement('label');
                title_label.innerHTML = 'Target Output'
                title_label.style.paddingBottom = '16px';
                title_label.style.textAlign = 'center';
                target_output_div.appendChild(title_label);

                const label_container = document.createElement('div');
                label_container.setAttribute('id', 'target_output_container');
                target_output_div.appendChild(label_container);
                label_container.style.display = 'flex';
                label_container.style.flexDirection = 'column';
                label_container.style.flexGrow = '1';
                label_container.style.gap = '20px';
                label_container.style.justifyContent = 'center';
                label_container.style.flexBasis = 'auto';

                for (let j = 0; j < this._neural_network._layerSizes[this._neural_network._layers.length]; j++){
                    const value_label = document.createElement('label');
                    value_label.style.marginLeft = 'auto';
                    value_label.style.marginRight = 'auto';
                    value_label.setAttribute('id', `${target_output_div.id}_label_${j}`);
                    label_container.appendChild(value_label);
                    const value = this._neural_network._target_output[j];
                    if (value == undefined){
                        value_label.innerHTML = '?';
                    }else{
                        value_label.innerHTML = `${format(value, 4)}`;
                    }
                    value_label.style.padding = '4px';
                    value_label.style.borderRadius = '4px';
                    value_label.style.backgroundColor = 'black'
                    const margin = (50 - value_label.clientHeight) / 2;
                    value_label.style.marginTop = `${margin}px`;
                    value_label.style.marginBottom = `${margin}px`;
                }
            }
        }

        //Add layer buttons
        for (let i = 0; i < this._neural_network._layerSizes.length - 1; i++){
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
                this._neural_network._layerSizes.splice(i + 1, 0, 1);
                this._neural_network.initializeRandomly();
                this._refresh();
            });
        }

        if (this._edit_mode_enabled){
            for (let i = 0; i < this._neural_network._layerSizes.length; i++){
                const controls_div = document.getElementById(`layer_${i}_controls`);
                controls_div.style.display = 'flex';
            }
        }else{
            for (let i = 0; i < this._neural_network._layerSizes.length; i++){
                const controls_div = document.getElementById(`layer_${i}_controls`);
                controls_div.style.display = 'none';
            }
        }

        //Create connections
        for (let i = 1; i < this._neural_network._layerSizes.length; i++){
            const src_layer_div = document.getElementById(`layer_${i - 1}`);
            const dst_layer_div = document.getElementById(`layer_${i}`);
            for (let j = 0; j < this._neural_network._layerSizes[i - 1]; j++){
                const src_neuron = document.getElementById(`${src_layer_div.id}_neuron_${j}`);
                for (let k = 0; k < this._neural_network._layerSizes[i]; k++){
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
                    connection_label.innerHTML = `${format(this._neural_network._layers[i - 1]._weights[k][j], 4)}`;
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
                    connection.style.top = `${center_y - (2 / 2)}px`; //-2 (/2) for line thickness
                    connection.style.left = `${center_x - (distance / 2)}px`;
                    connection.style.transform = `rotate(${angle}rad)`;
                    /* connection.addEventListener('mouseenter', (event) => {
                        connection.style.backgroundColor = 'white';
                        connection.style.zIndex = 1;
                        connection_label.hidden = false;
                    })
                    connection.addEventListener('mouseleave', (event) => {
                        connection.style.backgroundColor = 'gray';
                        connection.style.zIndex = 0;
                        connection_label.hidden = true;
                    }) */
                    dst_layer_div.appendChild(connection);
                }
            }
        }

        //Apply mouse over for neurons
        for (let i = 1; i < this._neural_network._layerSizes.length; i++){
            const layer_div = document.getElementById(`layer_${i}`);
            for (let j = 0; j < this._neural_network._layerSizes[i]; j++){
                const neuron = document.getElementById(`${layer_div.id}_neuron_${j}`);

                /* neuron.addEventListener('click', (event) => {
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
                }); */
            }
        }
    }

    _getSourceNeurons(layer_index) {
        layer_index--;
        const neurons = [];
        if (layer_index >= 0){
            for (let i = 0; i < this._neural_network._layerSizes[layer_index]; i++){
                neurons.push(document.getElementById(`layer_${layer_index}_neuron_${i}`));
            }
        }
        return neurons;
    }

    _deselectAll(){
        for (let i = 1; i < this._neural_network._layerSizes.length; i++){
            for (let j = 0; j < this._neural_network._layerSizes[i]; j++){
                const src_neruons = this._getSourceNeurons(i);
                const dst_neuron = document.getElementById(`layer_${i}_neuron_${j}`);
                for (let k = 0; k < src_neruons.length; k++){
                    this._setConnectionSelected(src_neruons[k], dst_neuron, false);
                }
            }
        }
    }

    _setConnectionSelected(src_neuron, dst_neuron, selected){
        const connection = document.getElementById(`connection_${src_neuron.id}_${dst_neuron.id}`);
        const connection_label = document.getElementById(`weight_label_${src_neuron.id}_${dst_neuron.id}`);
        if (selected){
            connection.style.backgroundColor = 'white';
            connection.style.zIndex = 1;
            connection_label.hidden = false;
        }else{
            connection.style.backgroundColor = 'gray';
            connection.style.zIndex = 0;
            connection_label.hidden = true;
        }
    }

    selectNeuronAndWeights(layer_index, neuron_index, weight_indexes){
        const src_neurons = this._getSourceNeurons(layer_index);
        const dst_neuron = document.getElementById(`layer_${layer_index}_neuron_${neuron_index}`);
        for (let i = 0; i < weight_indexes.length; i++){
            this._setConnectionSelected(src_neurons[weight_indexes[i]], dst_neuron, true);
        }
    }

    setSelectedNeuron(layer_index, neuron_index) {
        //The input to this function assumes layer 0 is the first hidden layer.
        //Since we are also showing the input as a "layer", we need to add 1 to the index
        layer_index++;

        const neuron = document.getElementById(`layer_${layer_index}_neuron_${neuron_index}`);

        if (this._previous_selected_neuron != undefined){
            const split = this._previous_selected_neuron.id.split('_');
            const i = parseInt(split[1])
            const j = parseInt(split[3])
            
            const src_neurons = this._getSourceNeurons(i);
            for (let k = 0; k < src_neurons.length; k++){
                this._setConnectionSelected(src_neurons[k], this._previous_selected_neuron, false);
            }
        }
        this._previous_selected_neuron = neuron;

        if (neuron === undefined || neuron == null){
            if (this._calculation_details_div != undefined){
                this._calculation_details_div.innerHTML = '';
            }
            return;
        }

        const split = neuron.id.split('_');
        const i = parseInt(split[1])
        const j = parseInt(split[3])
        
        if (this._neural_network._layers[i - 1]._out[j] === undefined){
            return;
        }

        const src_neurons = this._getSourceNeurons(i);
        for (let k = 0; k < src_neurons.length; k++){
            this._setConnectionSelected(src_neurons[k], neuron, true);
        }
    }
}

customElements.define('neural-network', NeuralNetworkElement);

const neural_network_element = document.getElementById('neural_network');

let neural_network = new NeuralNetwork([2, 2, 2]);
neural_network.setWeights([
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
console.log('LAYERS: ', neural_network._layers);
neural_network.setInputs([0.05, 0.1]);
neural_network.setTargetOutput([0.01, 0.99]);

neural_network_element.setNeuralNetwork(neural_network);

const current_step_label = document.getElementById('current_step_label');
const sub_step_label = document.getElementById('sub_step_label');

const box = document.createElement('div');
box.setAttribute('id', 'box');
box.style.width = '180px';
box.style.height = '60px';
box.style.borderWidth = '2px';
box.style.borderColor = 'white';
box.style.borderRadius = '8px';
box.style.position = 'absolute';
box.style.borderStyle = 'dashed';

const single_step_button = document.getElementById('single_step_button');
single_step_button.addEventListener('click', (event) => {

    neural_network._onStepComplete = () => {
        console.log('STEP COMPLETE: ', neural_network._stepIndex);

        //Update neuron labels to reflect current network state
        neural_network_element._updateLabels();

        //Update step counter
        const STEP_COUNT = neural_network._getMaxSubSteps(neural_network._stepIndex[0]);
        sub_step_label.innerHTML = `Step ${neural_network._stepIndex[1]} / ${STEP_COUNT}`;

        neural_network_element._calculation_details_div.innerHTML = '';

        //Show calculation details
        if (neural_network._stepIndex[0] == 0){

            //Update step label
            current_step_label.innerHTML = 'Feed Forward';
           
            //Determine which neuron is being worked on so we can highlight it
            const determineNeuronFromStepId = function (stepId) {
                const target = stepId[1] - 1;
                let value = -1;
                for (let i = 0; i < neural_network._layers.length; i++){
                    for (let j = 0; j < neural_network._layers[i]._size; j++){
                        value++;
                        if (value == target){
                            return [i, j];
                        }
                    }
                }
                return null;
            };

            //Determine neuron position
            const NEURON_POSITION = determineNeuronFromStepId(neural_network._stepIndex);
            const LAYER_INDEX = NEURON_POSITION[0];
            const NEURON_INDEX = NEURON_POSITION[1];

            //Highlight current neuron
            neural_network_element.setSelectedNeuron(LAYER_INDEX, NEURON_INDEX);

            const GENERAL_EQUATION_STRING = '\\(net^i_j = \\sum\\limits_{k = 0}^{N^i - 1} (a^{(i - 1)}_{k}w^i_{jk}) + b^i_{j}\\)';
            let general_equation_expanded_string = '\\(net^i_j = ';
            let equation_string = `\\(net^${LAYER_INDEX}_${NEURON_INDEX} = `;

            for (let k = 0; k < neural_network._layers[LAYER_INDEX]._inputSize; k++){
                let activation_term_string;
                let input;
                if (LAYER_INDEX == 0){
                    activation_term_string = `I_${k}`
                    input = neural_network._input[k];
                }else{
                    input = neural_network._layers[LAYER_INDEX - 1]._out[k];
                    activation_term_string = `a^${LAYER_INDEX - 1}_${k}`;
                }
                general_equation_expanded_string += `${activation_term_string}w^${LAYER_INDEX}_{(${NEURON_INDEX})(${k})} + `;
                equation_string += `(${format(input, 4)} \\times ${format(neural_network._layers[LAYER_INDEX]._weights[NEURON_INDEX][k], 4)}) + `;
            }
            general_equation_expanded_string += `b^${LAYER_INDEX}_${NEURON_INDEX}\\)`;
            equation_string += `${format(neural_network._layers[LAYER_INDEX]._biases[NEURON_INDEX], 4)}\\)`;

            const appendEquation = (equation_string) => {
                const div = document.createElement('div');
                div.style.display = 'block';
                div.style.fontSize = '1.4em';
                div.style.margin = '16px 0px 16px 0px';
                div.innerHTML = equation_string;
                neural_network_element._calculation_details_div.appendChild(div);
            }

            //Show general equation
            appendEquation(GENERAL_EQUATION_STRING);

            //Show expanded form
            appendEquation(general_equation_expanded_string);

            //Show filled form
            appendEquation(equation_string);

            appendEquation(`\\(net^${LAYER_INDEX}_${NEURON_INDEX} = ${format(neural_network._layers[LAYER_INDEX]._out[NEURON_INDEX], 8)}\\)`);

        }else if (neural_network._stepIndex[0] == 1){

            //Update step label
            current_step_label.innerHTML = 'Calculate Error';
        }

        MathJax.typeset();
    }

    neural_network.train([0.05, 0.10], [0.01, 0.99]).then(() => {
        console.log('DONE');
    });

    return;

    if (step[0] == 'feed_forward'){
       

        neural_network_element._calculation_details_div.innerHTML = `To calculate the value of this neuron, we first need to multiply each input by the weight of its connection, then add the bias.`;

        //Step 1
        let step_1_general_equation_string = '\\(z = \\sum\\limits_{i = 0}^{n - 1} (a_iw_i) + b_i\\)';
        let step_1_equation_string = '';
        let step_1_result = neural_network._layers[i - 1].values[j];
        const src_neurons = neural_network_element._getSourceNeurons(i);
        for (let k = 0; k < src_neurons.length; k++){
            let inputs;
            if (i == 1){
                inputs = neural_network._inputs;
            }else{
                inputs = neural_network._layers[i - 2].out;
            }
            const a = inputs[k];
            const w = neural_network._layers[i - 1]._weights[j][k];
            step_1_equation_string += `${format(a, 6)} \\times ${format(w, 6)} + `;
        }
        step_1_equation_string += `${format(neural_network._layers[i - 1].biases[j], 6)}\\) `
        step_1_equation_string = `\\(${format(step_1_result, 6)} = ` + step_1_equation_string;

        neural_network_element._calculation_details_div.appendChild(
            createTable([
                [step_1_general_equation_string, step_1_equation_string]
            ], true)
        );

        neural_network_element._calculation_details_div.innerHTML += 'Next, we apply the activation funciton. In this case we are using the sigmoid function.'
      
        //Step 2
        let step_2_general_equation_string = '\\(a = \\sigma(z)\\)';
        let step_2_result = neural_network._layers[i - 1]._out[j];
        let step_2_equation_string = `\\(${format(step_2_result, 6)} = \\sigma(${format(step_1_result, 6)})\\)`;

        neural_network_element._calculation_details_div.appendChild(
            createTable([
                [step_2_general_equation_string, step_2_equation_string]
            ], true)
        );

        MathJax.typeset();
    }else if (step[0] == 'calculate_loss' || step[0] == 'sum_losses'){
        neural_network_element.setSelectedNeuron(-1, -1);
        current_step_label.innerHTML = 'Calculate Error';

        if (step[0] != 'sum_losses'){
            //console.log(i, j);
            const target_output_div = document.getElementById(`layer_${i}_target_output_div_label_${j}`);
            target_output_div.appendChild(box);

            const neuron = document.getElementById(`layer_${i}_neuron_${j}`);
            const distance = ((target_output_div.getBoundingClientRect().left + target_output_div.getBoundingClientRect().right) / 2) - ((neuron.getBoundingClientRect().left + neuron.getBoundingClientRect().right) / 2);
            
            box.style.left = `${target_output_div.getBoundingClientRect().left - (box.clientWidth / 2) + (target_output_div.clientWidth / 2) - parseInt(box.style.borderWidth, 10) - (distance / 2)}px`;
            box.style.top = `${target_output_div.getBoundingClientRect().top - (box.clientHeight / 2) + (target_output_div.clientHeight / 2) - parseInt(box.style.borderWidth, 10)}px`;
        }else{
            const target_output_div = document.getElementById(`target_output_container`);
            target_output_div.appendChild(box);

            const neuron = document.getElementById(`layer_${i}_neuron_0`);
            const distance = ((target_output_div.getBoundingClientRect().left + target_output_div.getBoundingClientRect().right) / 2) - ((neuron.getBoundingClientRect().left + neuron.getBoundingClientRect().right) / 2);
            
            box.style.height = `${target_output_div.clientHeight + 10}px`;
            box.style.left = `${target_output_div.getBoundingClientRect().left - (box.clientWidth / 2) + (target_output_div.clientWidth / 2) - parseInt(box.style.borderWidth, 10) - (distance / 2)}px`;
            box.style.top = `${target_output_div.getBoundingClientRect().top - (box.clientHeight / 2) + (target_output_div.clientHeight / 2) - parseInt(box.style.borderWidth, 10)}px`;
        }

        const rows = [['Generic Equation', 'Plugged In']];
        for (let k = 0; k < j + 1; k++){
            let equation_string = `\\(${format(neural_network._last_layer_losses[k], 6)} = `;
            equation_string += `${0.5}(${format(neural_network._target_output[k], 6)} - ${format(neural_network._layers[neural_network._layers.length - 1]._out[k], 6)})^2`;
            equation_string += `\\)`
            rows.push([`\\(e = \\frac{1}{2} (t - a)^2\\)`, equation_string]);
        }

        if (step[0] == 'sum_losses'){
            let equation_string = `\\(${format(neural_network._loss, 6)} = `;
            for (let k = 0; k < j + 1; k++){
                equation_string += `${format(neural_network._last_layer_losses[k], 6)}`;
                if (k != j){
                    equation_string += ' + ';
                }
            }
            equation_string += `\\)`
            rows.push(['\\(E = \\sum\\limits_{i = 1}^n \\frac{1}{2} (t_i - a_i)^2\\)', equation_string]);

            neural_network_element._calculation_details_div.innerHTML = `The total cost of our neural network is simply the summation of the individual errors.`;
            neural_network_element._calculation_details_div.appendChild(
                createTable([
                    ['\\(E = \\sum\\limits_{i = 1}^n \\frac{1}{2} (t_i - a_i)^2\\)', equation_string]
                ], true)
            );
        }else{
            neural_network_element._calculation_details_div.innerHTML = `To calculate the error of this neuron, we will use the equation for mean squared error.`;
            neural_network_element._calculation_details_div.appendChild(
                createTable([
                    rows[j + 1]
                ], true)
            );
        }

        MathJax.typeset();
    }else if (step[0] == 'back_prop'){
        //neural_network_element.setSelectedNeuron(i, j);
        neural_network_element._deselectAll();
        neural_network_element.selectNeuronAndWeights(i, j, [neural_network_element._neural_network._weight_index]);
        current_step_label.innerHTML = 'Backpropagation';
        neural_network_element._calculation_details_div.innerHTML = 'Backpropagation is the process of adjusting the weights and biases of each neuron in an attempt to lower the total error, or cost, of our neural network. To do this, we need to calculate the gradient of the cost function with respect to the output of each neuron in the last layer.';

        box.style.display = 'none';

        if (i == neural_network._layers.length){
            const t_i = format(neural_network._target_output[j], 6);
            const a_i = neural_network._layers[neural_network._layers.length - 1]._out[j];
            const f_a_i = format(a_i, 6);
            const d_c_d_a = -2 * (neural_network._target_output[j] - neural_network._layers[neural_network._layers.length - 1]._out[j]);
            const f_d_c_d_a = format(d_c_d_a, 6);

            neural_network_element._calculation_details_div.appendChild(
                createTable([
                    [`\\(E_i = (t_i - a_i)^2\\)`],
                    [`\\(\\frac{\\partial E}{\\partial a_i} = 2(t_i - a_i) \\times {-1}\\)`],
                    [`\\(\\frac{\\partial E}{\\partial a_i} = -2(t_i - a_i)\\)`, `\\(\\frac{\\partial c}{\\partial a_${j}} = -2(${t_i} - ${f_a_i})\\)`, `\\(\\frac{\\partial c}{\\partial a_${j}} = ${f_d_c_d_a}\\)`]
                ], true, '25%')
            );

            neural_network_element._calculation_details_div.innerHTML += `Now we know how much \\(c_${j}\\) changes when we change \\(a_${j}\\). Unfortunately, we can't directly change \\(a_${j}\\). Instead, we can only change the values that influence it. The only value that influences \\(a_${j}\\) is the input to our activation function, \\(z_${j}\\).`;

            const z_i = format(neural_network._layers[neural_network._layers.length - 1].values[j], 6);
            const d_a_d_z = a_i * (1 - a_i);
            const f_d_a_d_z = format(d_a_d_z, 6);

            neural_network_element._calculation_details_div.appendChild(
                createTable([
                    [`\\(a_i = \\sigma(z_i)\\)`, `\\(${f_a_i} = \\sigma(${z_i})\\)`],
                    [`\\(\\frac{\\partial a_i}{\\partial z_i} = \\sigma(z_i)(1 - \\sigma(z_i))\\)`],
                    [`\\(\\frac{\\partial a_i}{\\partial z_i} = a_i(1 - a_i)\\)`, `\\(\\frac{\\partial a_${j}}{\\partial z_${j}} = ${f_a_i}(1 - ${f_a_i})\\)`, `\\(\\frac{\\partial a_${j}}{\\partial z_${j}} = ${f_d_a_d_z}\\)`]
                ], true, '25%')
            );

            neural_network_element._calculation_details_div.innerHTML += `Now we know how much \\(a_${j}\\) changes when we change \\(z_${j}\\). But again, we can't directly change \\(z_${j}\\). Instead, we can only change the weights and bias that influence it.`;
            
            let equation_string = '\\(z = ';
            let derivative_string = `\\(\\frac{\\partial z}{\\partial w_${neural_network._weight_index}} = `;
            for (let k = 0; k < neural_network._layerSizes[i - 1]; k++){
                equation_string += `(w_${k} \\times a_${k}) + `;
                if (k == neural_network._weight_index){
                    derivative_string += `(1 \\times a_${k}) + `;
                }else{
                    derivative_string += `(0 \\times 0) + `;
                }
                if (k == neural_network._layerSizes[i - 1] - 1){
                    equation_string += 'b\\)';
                    derivative_string += '0\\)';
                }
            }

            const table = createTable([
                [`\\(z = \\sum\\limits_{i = 0}^{n-1}(w_i \\times a_i) + b_i\\)`],
                [equation_string]
            ], true, '25%', false);
            table.style.width = '100%';
            neural_network_element._calculation_details_div.appendChild(table);

            const p_a_i = neural_network._layers[neural_network._layer_index - 1]._out[neural_network._weight_index];
            const f_p_a_i = format(p_a_i, 6);

            const table_1 = createTable([
                [derivative_string],
                [`\\(\\frac{\\partial z}{\\partial w_${neural_network._weight_index}} = a_${neural_network._weight_index}\\)`, `\\(\\frac{\\partial z}{\\partial w_${neural_network._weight_index}} = ${f_p_a_i}\\)`]
            ], true, '25%', false);
            table_1.style.width = '100%';
            neural_network_element._calculation_details_div.appendChild(table_1);

            neural_network_element._calculation_details_div.innerHTML += `Now we multiply these values together.`;
            
            const d_c_d_w = d_c_d_a * d_a_d_z * p_a_i;
            const f_d_c_d_w = format(d_c_d_w, 6);
            const table_2 = createTable([
                [`\\(\\frac{\\partial c}{\\partial w} = \\frac{\\partial c}{\\partial a} \\times \\frac{\\partial a}{\\partial z} \\times \\frac{\\partial z}{\\partial w}\\)`],
                [`\\(\\frac{\\partial c}{\\partial w} = ${f_d_c_d_a} \\times ${f_d_a_d_z} \\times ${f_p_a_i} = ${f_d_c_d_w}\\)`]
            ], true, '', false);
            table_2.style.width = '100%';
            neural_network_element._calculation_details_div.appendChild(table_2);

            neural_network_element._calculation_details_div.innerHTML += `Finally, to compute the new value of w:`;

            const w = neural_network._layers[i - 1]._weights[j][neural_network._weight_index];
            const w_prime = w - (neural_network._learning_rate * d_c_d_w);
            const table_3 = createTable([
                [`\\(w\\prime = w - (R \\times \\frac{\\partial c}{\\partial w})\\)`, `\\(${format(w_prime, 6)} = ${format(w, 6)} - (${neural_network._learning_rate} \\times ${f_d_c_d_w})\\)`]
            ], true, '25%');
            neural_network_element._calculation_details_div.appendChild(table_3);
        }else if (i == neural_network._layers.length - 1){
            neural_network_element._calculation_details_div.appendChild(
                createTable([
                    [`\\(\\frac{\\partial L}{\\partial a_i} = \\frac{\\partial C}{\\partial a_${0}} + \\frac{\\partial c}{\\partial a_${1}}\\)`],
                    [`\\(c_i = (t_i - a_i)^2\\)`],
                    [`\\(\\frac{\\partial c}{\\partial a_i} = 2(t_i - a_i) \\times {-1}\\)`],
                    [`\\(\\frac{\\partial c}{\\partial a_i} = -2(t_i - a_i)\\)`, `\\(\\frac{\\partial c}{\\partial a_${j}} = -2(${7} - ${7})\\)`, `\\(\\frac{\\partial c}{\\partial a_${j}} = ${7}\\)`]
                ], true, '25%')
            );
        }
        
        MathJax.typeset();
    }
});

const train_all_button = document.getElementById('train_all_button');
train_all_button.addEventListener('click', (event) => {
    window.location = 'http://localhost:8000/demo.html';
});

const edit_network_button = document.getElementById('edit_network_button');
edit_network_button.addEventListener('click', (event) => {
    neural_network_element.setEditMode(!neural_network_element.isEditMode());
});

const random_configuration_button = document.getElementById('random_config_button');
random_configuration_button.addEventListener('click', (event) => {
    const MAX_HIDDEN_LAYERS = 2; //5
    const MAX_NEURONS = 3; //8
    const layer_sizes = [];

    //Force 4 inputs
    layer_sizes.push(4);

    const hidden_layer_count = Math.floor((Math.random() * MAX_HIDDEN_LAYERS) + 1);
    for (let i = 0; i < hidden_layer_count; i++){
        layer_sizes.push(Math.floor((Math.random() * MAX_NEURONS) + 1))
    }

    //Force 3 outputs
    layer_sizes.push(3);

    neural_network = new NeuralNetwork(layer_sizes);
    neural_network.initializeRandomly();

    // Learn 2 bit binary addition
    neural_network.setInputs([1, 1, 1, 0])
    neural_network.setTargetOutput([1, 0, 1])

    neural_network_element.setNeuralNetwork(neural_network);
});


class DrawCanvas{

    constructor(canvas){
        this._canvas = canvas;

        this._ctx = input_canvas.getContext('2d');
        this._ctx.lineWidth = 10;
        this._ctx.lineCap = 'round';
        this._ctx.strokeStyle = 'white';

        this._isMouseDown = false;
        this._last_x = 0;
        this._last_y = 0;

        canvas.addEventListener('mousemove', (event) => {
            if (this._isMouseDown){
                this._ctx.beginPath();
                this._ctx.moveTo(this._last_x, this._last_y);
                const bounds = event.target.getBoundingClientRect();
                this._last_x = event.clientX - bounds.left;
                this._last_y = event.clientY - bounds.top;
                this._ctx.lineTo(this._last_x, this._last_y);
                this._ctx.stroke();
            }
        });

        canvas.addEventListener('mousedown', (event) => {
            this._isMouseDown = true;

            const bounds = event.target.getBoundingClientRect();
            this._last_x = event.clientX - bounds.left;
            this._last_y = event.clientY - bounds.top;
            this._ctx.moveTo(this._last_x, this._last_y);
        })

        canvas.addEventListener('mouseup', (event) => {
            this._isMouseDown = false;

            //const image_data = this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
        })

        canvas.addEventListener('mouseleave', (event) => {
            this._isMouseDown = false;
        })

        this._clear_canvas_button = document.getElementById('clear_canvas_button');
        this._clear_canvas_button.addEventListener('click', (event) => {
            this.clear();
        })
    }

    clear(){
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
}

/*
[E] Error for one neuron
[c] loss of one training example
[C] Cost of entire training set

[A] Activation value of a neuron
*/
