'use strict';

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

                this.process();
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
            //this.process();
        })

        canvas.addEventListener('mouseleave', (event) => {
            this._isMouseDown = false;
        })

        this._clear_canvas_button = document.getElementById('clear_canvas_button');
        this._clear_canvas_button.addEventListener('click', (event) => {
            this.clear();
        })
    }

    process(){
        const SCALE = 10;
        const CHANNEL_COUNT = 4;
        const image_data = this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height).data;
        const scaled_data = []
        for (let y = 0; y < this._canvas.height; y += SCALE){
            for (let x = 0; x < this._canvas.width; x += SCALE){
                let average = 0;
                for (let j = 0; j < CHANNEL_COUNT; j++){
                    average += image_data[CHANNEL_COUNT * (this._canvas.height * y + x) + j];
                }
                average /= CHANNEL_COUNT;
                scaled_data.push(average / 255);
            }
        }
       
        
        const other = document.getElementById('other');
        const other_ctx = other.getContext('2d');
        const other_data = other_ctx.createImageData(28, 28);
        for (let i = 0; i < other_data.data.length; i += 4){
            const value = scaled_data[i / 4] * 255;
            other_data.data[i] = value;
            other_data.data[i + 1] = value;
            other_data.data[i + 2] = value;
            other_data.data[i + 3] = 255;
        }
        other_ctx.putImageData(other_data, 0, 0, 0, 0, 28, 28);

        const result = nerual_network.process(scaled_data);

        let string = '';
        for (let i = 0; i < result.length; i++){
            string += result[i] + '<br>';
        }

        document.getElementById('output_label').innerHTML = string;
        document.getElementById('prediction_label').innerHTML = result.indexOf(Math.max(...result));
    }

    clear(){
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
}

const drawCanvas = new DrawCanvas(document.getElementById('input_canvas'));

//Initialize neural network for processing user input
const nerual_network = new NeuralNetwork([28 * 28, 8, 8, 10]);
nerual_network.initializeRandomly();
console.log(nerual_network._layer_sizes)
console.log(nerual_network._layers);