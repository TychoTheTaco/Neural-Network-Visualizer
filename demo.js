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

const drawCanvas = new DrawCanvas(document.getElementById('input_canvas'));
