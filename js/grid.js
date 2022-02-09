var _ = require('underscore');  // 浏览器无法解析
var helpers = require('./helpers');

var MIN_SPACING = helpers.MIN_SPACING;  // 5
var MAX_SPACING = helpers.MAX_SPACING;  // 80


function Grid(el) {
    this.w = document.getElementById('gridWidth').value;
    this.h = document.getElementById('gridHeight').value;
    this.el = el;  // html中的id='maze'的元素, 一个div
    this.spacing = MIN_SPACING;  // 初始值为5

    this.dots = helpers.createDotList(this.w, this.h);

    this.setupCanvas();
}

Grid.prototype = {
    setupCanvas: function() {
        // 创建canvas元素
        this.gridVisible = false;
        this.canvas = document.createElement('canvas');  //
        /* parseInt 将 string 转 int
           getComputedStyle 返回this.el元素的css对象的width属性
           canvas默认width=300, height=150 */
        let pWidth = parseInt(window.getComputedStyle(this.el)['width'], 10);
        // this.spacing 取值MIN_SPACING, MAX_SPACING, spacing中, 大于MIN_SPACING的最小值的1/2
        let spacing = (pWidth / this.w) | 0;  // pWidth / w
        this.spacing = Math.min(Math.max(MIN_SPACING, spacing), MAX_SPACING) / 2;

        this.canvas.style.backgroundColor = '#3d3d3d';  // maze background color
        this.canvas.width = this.spacing * this.w * 2;  //
        this.canvas.height = this.spacing * this.h * 2;  //

        this.ctx = this.canvas.getContext('2d');
        this.el.appendChild(this.canvas);  // 添加设置好width and height 的canvas对象
        this.draw();

    },

    isInGrid: function(node) {
        let pos = helpers.getCoords(node);
        return !(pos.x < 0 || pos.y < 0 || pos.x >= this.w || pos.y >= this.h);

    },


    draw: function() {
        this.canvasGrid = document.createElement('canvas');
        this.canvasGrid.className = 'hide';
        this.canvasGrid.width = this.spacing * this.w * 2;  //
        this.canvasGrid.height = this.spacing * this.h * 2;  //
        let ctx = this.canvasGrid.getContext('2d');
        this.el.appendChild(this.canvasGrid);
        ctx.fillStyle = "black";
        ctx.strokeStyle= "green";
        ctx.lineWidth = 2;
        ctx.font = "15px Arial";
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        let x = this.w;
        while(x--) {
            let y = this.h
            while(y--) {
                let str = '(' + x + ',' + y + ')';
                ctx.fillText(str, x * this.spacing * 2 + this.spacing, y * this.spacing * 2 + this.spacing);
                ctx.strokeRect(x * this.spacing * 2, y * this.spacing * 2, this.spacing*2, this.spacing*2);
            }
        }
    },

    setGridVisibility: function() {
        if (!this.gridVisible) {
            this.gridVisible = true;
            this.canvasGrid.className = '';
        } else {
            this.gridVisible = false;
            this.canvasGrid.className = 'hide';
        }

    }
};

module.exports = Grid;
