'use strict';

class NeuralNetwork{

    constructor(layer_sizes){
        this._layer_sizes = layer_sizes;
        this._layers = [];
    }

    initialize(weights, biases){
        this._layers.clear();
        for (let i = 0; i < weights.length; i++){
            this._layers.push({'weights': weights[i], 'biases': biases[i]});
        }
    }
}

var cumOffset = function(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {
        top: top,
        left: left
    };
};

class NeuralNetworkElement extends HTMLElement{

    static INPUT_LAYER_COLOR = 'red';
    static HIDDEN_LAYER_COLOR = 'blue';
    static OUTPUT_LAYER_COLOR = 'green';

    constructor(){
        super();
        this._layer_sizes = [2, 5, 3, 2];
    }

    connectedCallback(){
        console.log('connected')

        //Cant do this in constructor because chrome error "the result must not have attributes" when creating object from js.
        this._applyStyle();
    }

    addLayer(index){

    }

    _refresh(){
        this.innerHTML = '';
        this._applyStyle();
    }

    _applyStyle(){
        console.log('APPLY');
        this.style.display = 'flex';
        this.style.justifyContent = 'space-around';

        for (let i = 0; i < this._layer_sizes.length; i++){
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
            }else if (i == this._layer_sizes.length - 1){
                layer_name_label.innerHTML = `Output`;
            }else{
                layer_name_label.innerHTML = `Layer ${i}`;
            }
            layer_name_label.style.paddingBottom = '16px';
            layer_name_label.style.textAlign = 'center';
            layer_div.appendChild(layer_name_label);

            let layer_color;
            if (i == 0){
                layer_color = NeuralNetworkElement.INPUT_LAYER_COLOR;
            }else if (i == this._layer_sizes.length - 1){
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
            for (let j = 0; j < this._layer_sizes[i]; j++){
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
                label.innerHTML = '0.54';
                label.style.top = `${(neuron.clientHeight - label.clientHeight) / 2}px`;
                label.style.left = `${(neuron.clientWidth - label.clientWidth) / 2}px`;
            }

            //Controls
            const controls_div = document.createElement('div');
            controls_div.setAttribute('id', `${layer_div.id}_controls`);
            layer_div.appendChild(controls_div);
            controls_div.style.display = 'flex';
            controls_div.style.flexDirection = 'column';
            controls_div.style.marginTop = '16px';
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
                if (this._layer_sizes[i] > 1){
                    this._layer_sizes[i] -= 1;
                    this._refresh();
                }
            });

            const neuron_count_label = document.createElement('label');
            neuron_controls_div.appendChild(neuron_count_label);
            neuron_count_label.innerHTML = `${this._layer_sizes[i]}`;

            const add_neuron_button = document.createElement('button');
            neuron_controls_div.appendChild(add_neuron_button);
            add_neuron_button.innerHTML = '+';
            add_neuron_button.addEventListener('click', (event) => {
                this._layer_sizes[i] += 1;
                this._refresh();
            });

          
            //Delete layer button
            const delete_layer_button = document.createElement('button');
            controls_div.appendChild(delete_layer_button);
            delete_layer_button.innerHTML = 'Delete';
            delete_layer_button.style.marginTop = '4px';
            if (i == 0 || i == this._layer_sizes.length - 1){
                delete_layer_button.style.visibility = 'hidden';
            }
            delete_layer_button.addEventListener('click', (event) => {
                this._layer_sizes.splice(i, 1);
                this._refresh();
            });
        }

        //Add layer buttons
        for (let i = 0; i < this._layer_sizes.length - 1; i++){
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
                this._layer_sizes.splice(i + 1, 0, 1);
                this._refresh();
            });
        }

        //Create connections
        for (let i = 1; i < this._layer_sizes.length; i++){
            const src_layer_div = document.getElementById(`layer_${i - 1}`);
            const dst_layer_div = document.getElementById(`layer_${i}`);
            for (let j = 0; j < this._layer_sizes[i - 1]; j++){
                const src_neuron = document.getElementById(`${src_layer_div.id}_neuron_${j}`);
                for (let k = 0; k < this._layer_sizes[i]; k++){
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
                    connection_label.innerHTML = '0.35';
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
                    })
                    dst_layer_div.appendChild(connection);
                }
            }
        }

        const getSourceNeurons = (layer_index) => {
            layer_index--;
            const neurons = [];
            if (layer_index >= 0){
                for (let i = 0; i < this._layer_sizes[layer_index]; i++){
                    neurons.push(document.getElementById(`layer_${layer_index}_neuron_${i}`));
                }
            }
            return neurons;
        }

        function getDestinationNeurons(layer_index){
            return getSourceNeurons(layer_index + 2);
        }

        //Apply mouse over for neurons
        for (let i = 0; i < this._layer_sizes.length; i++){
            const layer_div = document.getElementById(`layer_${i}`);
            for (let j = 0; j < this._layer_sizes[i]; j++){
                const neuron = document.getElementById(`${layer_div.id}_neuron_${j}`);
                neuron.addEventListener('mouseenter', (event) => {
                    const src_neurons = getSourceNeurons(i);
                    for (let k = 0; k < src_neurons.length; k++){
                        const connection = document.getElementById(`connection_${src_neurons[k].id}_${neuron.id}`);
                        connection.style.backgroundColor = 'white';
                        connection.style.zIndex = 1;
                        const connection_label = document.getElementById(`weight_label_${src_neurons[k].id}_${neuron.id}`);
                        connection_label.hidden = false;
                    }
                    /* const dst_neurons = getDestinationNeurons(i);
                    for (let k = 0; k < dst_neurons.length; k++){
                        const connection = document.getElementById(`connection_${neuron.id}_${dst_neurons[k].id}`);
                        connection.style.backgroundColor = 'white';
                        connection.style.zIndex = 1;
                        const connection_label = document.getElementById(`weight_label_${neuron.id}_${dst_neurons[k].id}`);
                        connection_label.hidden = false;
                    } */
                });
                neuron.addEventListener('mouseleave', (event) => {
                    const src_neurons = getSourceNeurons(i);
                    for (let k = 0; k < src_neurons.length; k++){
                        const connection = document.getElementById(`connection_${src_neurons[k].id}_${neuron.id}`);
                        connection.style.backgroundColor = 'gray';
                        connection.style.zIndex = 0;
                        const connection_label = document.getElementById(`weight_label_${src_neurons[k].id}_${neuron.id}`);
                        connection_label.hidden = true;
                    }
                    /* const dst_neurons = getDestinationNeurons(i);
                    for (let k = 0; k < dst_neurons.length; k++){
                        const connection = document.getElementById(`connection_${neuron.id}_${dst_neurons[k].id}`);
                        connection.style.backgroundColor = 'gray';
                        connection.style.zIndex = 0;
                        const connection_label = document.getElementById(`weight_label_${neuron.id}_${dst_neurons[k].id}`);
                        connection_label.hidden = true;
                    } */
                });
            }
        }
    }
}

customElements.define('neural-network', NeuralNetworkElement);
const neural_network = document.getElementById('neural_network');