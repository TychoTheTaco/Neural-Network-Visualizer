'use strict';

class DrawCanvas{

    constructor(canvas){
        this._canvas = canvas;

        this._ctx = input_canvas.getContext('2d');
        this._ctx.filter = "blur(2px)";
        this._ctx.lineWidth = 15;
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

                //this.process();
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
            this.process();
        })

        canvas.addEventListener('mouseleave', (event) => {
            this._isMouseDown = false;
        })

        this._clear_canvas_button = document.getElementById('clear_canvas_button');
        this._clear_canvas_button.addEventListener('click', (event) => {
            this.clear();
        })
    }

    bounds(image_data){
        const CHANNEL_COUNT = 4;
        console.log(image_data);
        //x1, y1, x2, y2
        const bounds = [image_data.width, image_data.height, 0, 0];
        for (let y = 0; y < image_data.height; y++){
            for (let x = 0; x < image_data.width; x++){
                let value = 0;
                for (let i = 0; i < CHANNEL_COUNT - 1; i++){
                    value += image_data.data[CHANNEL_COUNT * (image_data.height * y + x) + i]
                }
                value /= (CHANNEL_COUNT - 1);

                if (value > 0){
                    if (x < bounds[0]){
                        bounds[0] = x;
                    }
                    if (y < bounds[1]){
                        bounds[1] = y;
                    }

                    //console.log('x: ', x);
                    bounds[2] = Math.max(bounds[2], x);
                    bounds[3] = Math.max(bounds[3], y);
                }
            }
        }
        return bounds;
    }

    center(image_data){
        const other = document.getElementById('other');
        const other_ctx = other.getContext('2d');
        const centered = other_ctx.createImageData(image_data.width, image_data.height);
        const bounds = this.bounds(image_data);
        
        const offsetX = (image_data.width / 2) - ((bounds[2] + bounds[0]) / 2);
        const offsetY = (image_data.height / 2) - ((bounds[3] + bounds[1]) / 2);
        console.log(offsetX, offsetY);

        let ictx = input_canvas.getContext('2d');
        ictx.clearRect(0, 0, input_canvas.width, input_canvas.height);
        ictx.putImageData(image_data, offsetX, offsetY, 0, 0, image_data.width, image_data.height);

        return ictx.getImageData(0, 0, input_canvas.width, input_canvas.height);
    }

    process(){
        const SCALE = 10;
        const CHANNEL_COUNT = 4;
        let image_data = this.center(this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height)).data;
        const scaled_data = [];
        const tensor_data = [];
        for (let y = 0; y < this._canvas.height; y += SCALE){
            const line_data = [];
            for (let x = 0; x < this._canvas.width; x += SCALE){
                let average = 0;
                for (let j = 0; j < CHANNEL_COUNT; j++){
                    average += image_data[CHANNEL_COUNT * (this._canvas.height * y + x) + j];
                }
                average /= CHANNEL_COUNT;
                scaled_data.push(average / 255);
                line_data.push([average / 255]);
            }
            tensor_data.push(line_data);
        }

        const input_image_data = this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
        const bounds = this.bounds(this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height));
        console.log('BOUNDS: ', bounds);
        let ictx = input_canvas.getContext('2d');
        ictx.strokeStyle = 'red';
        ictx.lineWidth = 1;
        ictx.strokeRect(bounds[0], bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1]);
        ictx.lineWidth = 15;
        ictx.strokeStyle = 'white';

        const tensor = tf.tensor([tensor_data]);
        const presult = dmodel.predict(tensor);
    
        const r = presult.softmax().arraySync()[0];
        const MAX_INDEX = r.indexOf(Math.max(...r));

        const output_canvas = document.getElementById('output_canvas');
        const output_ctx = output_canvas.getContext('2d');
        const RADIUS = 24;
        const SPACING = 8;

        const other = document.getElementById('other');
        const other_ctx = other.getContext('2d');
        let other_data = other_ctx.createImageData(28, 28);
        for (let i = 0; i < other_data.data.length; i += 4){
            const value = scaled_data[i / 4] * 255;
            other_data.data[i] = value;
            other_data.data[i + 1] = value;
            other_data.data[i + 2] = value;
            other_data.data[i + 3] = 255;
        }
        other_data = this.center(input_image_data);
        //other_ctx.putImageData(other_data, 0, 0, 0, 0, 28, 28);
       
        const result = r;

      
        const TRANSLATE_AMOUNT = (output_canvas.width / 2) - (RADIUS + SPACING);

        output_ctx.clearRect(0, 0, output_canvas.width, output_canvas.height);
        output_ctx.translate(TRANSLATE_AMOUNT, 0);
        for (let i = 0; i < result.length; i++){
            const centerX = RADIUS + SPACING;
            const centerY = i * (RADIUS * 2 + SPACING) + (SPACING + RADIUS);

            //Draw incoming line
            output_ctx.globalAlpha = 0.25;
            output_ctx.strokeStyle = 'gray';
            output_ctx.lineWidth = 1;
            output_ctx.beginPath();
            output_ctx.moveTo(-TRANSLATE_AMOUNT - input_canvas.width / 2, output_canvas.height / 2);
            output_ctx.lineTo(centerX, centerY);
            output_ctx.stroke();

            output_ctx.globalAlpha = result[i];

            //Draw outgoing line
            output_ctx.strokeStyle = (i == MAX_INDEX) ? '#32a852' : 'gray';
            output_ctx.lineWidth = result[i] * 3;
            output_ctx.beginPath();
            output_ctx.moveTo(centerX, centerY);
            output_ctx.lineTo(output_canvas.width / 2, output_canvas.height / 2);
            output_ctx.stroke();

            //Draw neuron background
            output_ctx.fillStyle = 'gray';
            output_ctx.beginPath();
            output_ctx.arc(centerX, centerY, RADIUS, 0, 2 * Math.PI, false);
            output_ctx.fill()
            output_ctx.beginPath()
            output_ctx.arc(centerX, centerY, RADIUS, 0, 2 * Math.PI, false);
            output_ctx.lineWidth = 2;
            output_ctx.globalAlpha = 1;
            output_ctx.strokeStyle = (i == MAX_INDEX) ? '#32a852' : 'black';
            output_ctx.stroke();

            //Draw neuron label
            output_ctx.fillStyle = 'white';
            output_ctx.font = '1em Arial';
            output_ctx.fillText(result[i].toFixed(3), centerX - RADIUS + (SPACING / 2), centerY + 5);
        }
        output_ctx.translate(-TRANSLATE_AMOUNT, 0); 

        //Draw prediction
        const centerX = output_canvas.width - SPACING - RADIUS;
        const centerY = output_canvas.height / 2;
        output_ctx.beginPath();
        output_ctx.arc(centerX, centerY, RADIUS, 0, 2 * Math.PI, false);
        output_ctx.fillStyle = 'gray';
        output_ctx.fill()
        output_ctx.lineWidth = 2;
        output_ctx.strokeStyle = 'black';
        output_ctx.stroke();

        output_ctx.fillStyle = 'white';
        output_ctx.font = '1.5em Arial';
        output_ctx.fillText(MAX_INDEX, centerX - 7, centerY + 8);
    }

    clear(){
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
}

const drawCanvas = new DrawCanvas(document.getElementById('input_canvas'));

//Initialize neural network for processing user input
//const nerual_network = new NeuralNetwork([28 * 28, 8, 8, 10]);
/* let r = nerual_network.initializeFromFile('http://localhost:8000/weights.txt')
    .then(text => {
        const lines = text.split('\n');
        console.log(lines);
        const version = lines[0];
        const layer_count = lines[1] - 1;
        const layer_sizes = lines[2].trim().split(' ');
        for (let i = 0; i < layer_sizes.length; i++){
            layer_sizes[i] = Number(layer_sizes[i]);
        }

        console.log('Version: ', version);
        console.log('layer_count: ', layer_count);
        console.log('layer_sizes: ', layer_sizes);

        let weights = [];
        let biases = [];
        let index = 3;
        for (let i = 0; i < layer_count; i++){
            let layer_weights = [];
            for (let j = 0; j < layer_sizes[i + 1]; j++){
                let neuron_weights = [];
                for (let k = 0; k < layer_sizes[i]; k++){
                    neuron_weights.push(Number(lines[index++]));
                }
                layer_weights.push(neuron_weights);
            }

            let layer_biases = [];
            for (let j = 0; j < layer_sizes[i + 1]; j++){
                layer_biases.push(Number(lines[index++]));
            }

            weights.push(layer_weights);
            biases.push(layer_biases);
        }

        nerual_network.initialize(weights, biases);
    }); */
//nerual_network.initializeRandomly();
//console.log(nerual_network._layer_sizes)
//console.log(nerual_network._layers);


let dmodel = null;
tf.loadLayersModel('http://localhost:8000/digits_js_model_conv/model.json').then(model => {
    dmodel = model;
    dmodel.summary()
});