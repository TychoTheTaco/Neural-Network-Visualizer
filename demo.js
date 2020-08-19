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

        const result = nerual_network.process(scaled_data);

        const output_canvas = document.getElementById('output_canvas');
        const output_ctx = output_canvas.getContext('2d');

        const RADIUS = 24;
        const SPACING = 8;

        const MAX_INDEX = result.indexOf(Math.max(...result));

        output_ctx.clearRect(0, 0, output_canvas.width, output_canvas.height);
        for (let i = 0; i < result.length; i++){
            const centerX = 40;
            const centerY = i * (RADIUS * 2 + SPACING) + (SPACING + RADIUS);

            output_ctx.globalAlpha = result[i];
            output_ctx.beginPath();
            output_ctx.arc(centerX, centerY, RADIUS, 0, 2 * Math.PI, false);
            output_ctx.fillStyle = 'gray';
            output_ctx.fill()
            output_ctx.lineWidth = 2;
            output_ctx.strokeStyle = (i == MAX_INDEX) ? '#32a852' : 'black';
            output_ctx.stroke();
            output_ctx.globalAlpha = 1;

            output_ctx.fillStyle = 'white';
            output_ctx.font = '1em Arial';
            output_ctx.fillText(result[i].toFixed(3), centerX / 2, centerY + 5);
        }

        document.getElementById('prediction_label').innerHTML = MAX_INDEX;
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