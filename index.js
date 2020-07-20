'use strict';

class NeuralNetwork extends HTMLElement{

    constructor(){
        super();
        this._layer_sizes = [2, 3, 3, 2];
        this._layer_colors = ['red', 'blue', 'blue', 'green'];
    }

    connectedCallback(){
        console.log('connected')

        this._applyStyle();
    }

    _applyStyle(){
        this.style.display = 'flex';
        this.style.justifyContent = 'center';
        this.style.gap = '20px';

        for (let i = 0; i < this._layer_sizes.length; i++){
            const layer_div = document.createElement('div');
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

            //Neurons
            const neurons_div = document.createElement('div');
            neurons_div.style.flexGrow = '1';
            neurons_div.style.display = 'flex';
            neurons_div.style.flexDirection = 'column';
            neurons_div.style.alignItems = 'center';
            neurons_div.style.justifyContent = 'center';
            neurons_div.style.gap = '20px';
            for (let j = 0; j < this._layer_sizes[i]; j++){
                const neuron = document.createElement('svg');
                neuron.setAttribute('id', `${layer_div.id}_neuron_${j}`);
                neuron.style.zIndex = 2;
                neuron.innerHTML = `<svg height="50" width="50"> <circle cx="25" cy="25" r="20" stroke="white" stroke-width="1" fill="${this._layer_colors[i]}" /></svg>`
                neurons_div.appendChild(neuron);
            }
            layer_div.appendChild(neurons_div);

            this.appendChild(layer_div);
        }

        const PREF_GAP = this.getBoundingClientRect().width / (this._layer_sizes.length - 1) - 100;
        this.style.gap = `${Math.min(PREF_GAP, 300)}px`;

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
                    connection.style.position = 'absolute';
                    connection.style.width = `${distance}px`;
                    connection.style.height = '1px';
                    connection.style.backgroundColor = 'gray';
                    connection.style.top = `${center_y - (4 / 2)}px`; //-4 for line thickness
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
                        const connection_label = document.getElementById(`weight_label_${src_neurons[k].id}_${neuron.id}`);
                        connection_label.hidden = false;
                    }
                    const dst_neurons = getDestinationNeurons(i);
                    for (let k = 0; k < dst_neurons.length; k++){
                        const connection_label = document.getElementById(`weight_label_${neuron.id}_${dst_neurons[k].id}`);
                        connection_label.hidden = false;
                    }
                });
                neuron.addEventListener('mouseleave', (event) => {
                    const src_neurons = getSourceNeurons(i);
                    for (let k = 0; k < src_neurons.length; k++){
                        const connection_label = document.getElementById(`weight_label_${src_neurons[k].id}_${neuron.id}`);
                        connection_label.hidden = true;
                    }
                    const dst_neurons = getDestinationNeurons(i);
                    for (let k = 0; k < dst_neurons.length; k++){
                        const connection_label = document.getElementById(`weight_label_${neuron.id}_${dst_neurons[k].id}`);
                        connection_label.hidden = true;
                    }
                });
            }
        }
    }
}

customElements.define('neural-network', NeuralNetwork);
let e = document.createElement('neural-network');
document.body.appendChild(e);
