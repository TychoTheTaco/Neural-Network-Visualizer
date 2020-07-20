'use strict';

class NeuralNetwork extends HTMLElement{

    constructor(){
        super();
        this._layer_sizes = [2, 3, 2];
        this._layer_colors = ['red', 'blue', 'green'];
    }

    connectedCallback(){
        console.log('connected')

        this._applyStyle();
    }

    _applyStyle(){
        this.style.display = 'flex';
        this.style.justifyContent = 'center';
        this.style.gap = '100px';
        //this.style.backgroundColor = 'black';

        for (let i = 0; i < this._layer_sizes.length; i++){
            const layer_div = document.createElement('div');
            layer_div.setAttribute('id', `layer_${i}`);
            layer_div.style.display = 'flex';
            layer_div.style.flexDirection = 'column';
            layer_div.style.padding = '8px';
            //layer_div.style.backgroundColor = 'purple';

            //Layer name
            const layer_name_label = document.createElement('label');
            layer_name_label.innerHTML = `Layer ${i}`;
            layer_name_label.style.paddingBottom = '16px';
            layer_div.appendChild(layer_name_label);

            //Neurons
            const neurons_div = document.createElement('div');
            neurons_div.style.flexGrow = '1';
            //neurons_div.style.backgroundColor = 'coral';
            neurons_div.style.display = 'flex';
            neurons_div.style.flexDirection = 'column';
            neurons_div.style.alignItems = 'center';
            neurons_div.style.justifyContent = 'center';
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

                    const center_x = (src_x + dst_x - distance) / 2;
                    const center_y = (src_y + dst_y - 4) / 2; //-4 for line thickness

                    const connection = document.createElement('div');
                    connection.style.position = 'absolute';
                    connection.style.width = `${distance}px`;
                    connection.style.height = '1px';
                    connection.style.backgroundColor = 'gray';
                    connection.style.top = `${center_y}px`
                    connection.style.left = `${center_x}px`
                    connection.style.transform = `rotate(${angle}rad)`
                    connection.addEventListener('mouseenter', (event) => {
                        connection.style.backgroundColor = 'white';
                        connection.style.zIndex = 1;
                    })
                    connection.addEventListener('mouseleave', (event) => {
                        connection.style.backgroundColor = 'gray';
                        connection.style.zIndex = 0;
                    })
                    dst_layer_div.appendChild(connection);
                }
            }
        }
    }
}

customElements.define('neural-network', NeuralNetwork);
let e = document.createElement('neural-network');
document.body.appendChild(e);



/* function getOffset( el ) {
    var rect = el.getBoundingClientRect();
    return {
        left: rect.left + window.pageXOffset,
        top: rect.top + window.pageYOffset,
        width: rect.width || el.offsetWidth,
        height: rect.height || el.offsetHeight
    };
}

function connect(div1, div2, color, thickness) { // draw a line connecting elements
    var off1 = getOffset(div1);
    var off2 = getOffset(div2);
    // bottom right
    var x1 = off1.left + off1.width;
    var y1 = off1.top + off1.height;
    // top right
    var x2 = off2.left + off2.width;
    var y2 = off2.top;
    // distance
    var length = Math.sqrt(((x2-x1) * (x2-x1)) + ((y2-y1) * (y2-y1)));
    // center
    var cx = ((x1 + x2) / 2) - (length / 2);
    var cy = ((y1 + y2) / 2) - (thickness / 2);
    // angle
    var angle = Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);
    // make hr
    var htmlLine = "<div style='padding:0px; margin:0px; height:" + thickness + "px; background-color:" + color + "; line-height:1px; position:absolute; left:" + cx + "px; top:" + cy + "px; width:" + length + "px; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform:rotate(" + angle + "deg);' />";
    //
    // alert(htmlLine);
    document.body.innerHTML += htmlLine;
} */