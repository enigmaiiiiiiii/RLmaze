var _ = require('underscore');
var helpers = require('./helpers');


function Maze(grid) {  // 构造函数
    this.grid = grid;  // grid对象
    this.queue = [];  // 空数组
    this.onGeneratedCallbacks = [];
    // this.endNode = (this.grid.w - 1) + '|' + (this.grid.h - 1);
    this.endNode = helpers.nodeKey(grid.w - 1, grid.h - 1);

    // connection 的每个元素是一个数组
    this.connections = helpers.createDotDict(grid.w, grid.h);  // connection是一个object
    this.draw = this.draw.bind(this, this.grid.ctx);  // ?

    // give the screen a chance to draw
    // this.grid.canvas.classList.add('hide');  // 添加属性class='hide'
    let onFinish = _.delay.bind(_, this.onFinish.bind(this), 300);
    // 调用maze对象的onFinish方法, 延迟300ms
    // 当前函数调用完成后，执行make(this.onProgress, onFinish)
    _.defer(this.make.bind(this, onFinish));  // loading宽度百分比
    // 当前调用栈清空时，由maze对象调用make,

    // 调用onGenerated,
    // this.onGenerated(function () {  // 函数表达式对象
    //     let progressContainer = document.querySelector('.loading');
    //     progressContainer.parentElement.removeChild(progressContainer);
    //     this.draw();
    //     // this.grid.canvas.classList.remove('hide');
    // }.bind(this));  // 参数都是maze对象
}

Maze.prototype = {
    onFinish: function () {
        /* 执行onGeneratedCallbacks中的函数
        *  完成从线程池中去任务的函数 */
        this.generated = true;
        while (this.onGeneratedCallbacks.length) {
            // 相当于弹出队列中第一个元素
            let cb = this.onGeneratedCallbacks.shift();  // 与pop()相反
            cb();
        }
    },

    make: function (finishCb) {
        if (this.startedMake) {
            throw 'Maze already generated';
        }
        let start = helpers.nodeKey(0, 0);  // 字符串，key
        let isFinished = this.isFinished.bind(this);  // function

        // 设置ctx画笔路径
        this.drawPath(isFinished, finishCb, start);
        // this.drawPathBFS(start, finishCb);
        this.startedMake = true;
    },

    drawPath: function (isFinished, finishCb, current) {
        /* 设置ctx画笔路线, 不执行画
        *  isFinished: 可调用函数表达式 */
        if (isFinished(current)) {  // 递归返回条件
            // 返回函数onProgress
            return this.fillUnvisited(this.queue.shift(), finishCb);
        }

        let connection = this.pickMove(current);  // [choice, current]
        let next = connection[0];  // 随机得到, choice选项
        current = connection[1];
        this.quickDraw(current, next);
        if (next) {
            this.createConnection(next, current);
            current = next;
        }
        let drawPath = this.drawPath.bind(this, isFinished, finishCb, current);  //
        _.defer(drawPath);  // 迭代
    },

    drawPathBFS: function (start, finishCb) {
        let queue = []
        queue.push(start);
        while(queue.length) {
           let node = queue.shift();
           let options = this.getOptions(node);
           let t = options.length
           for (let i = 0; i < t; i++) {
               // 随机顺序加入队列
               let nextIndex = Math.floor(Math.random() * options.length);
               let next = options[nextIndex];
               options[nextIndex] = options.pop();

               queue.push(next);
               this.createConnection(next, node);
               this.quickDraw(node, next);
           }

        }
        finishCb();
    },

    fillUnvisited: function (current, finishCb) {
        if (this.isFilled()) {
            return finishCb();
        }
        let connections = this.pickMove(current);
        let next = connections[0];
        current = connections[1];
        this.quickDraw(current, next);
        if (next) {
            this.createConnection(next, current);
            current = next;
        }
        let fillUnvisited = this.fillUnvisited.bind(this, current, finishCb);
        _.defer(fillUnvisited);  // 迭代？,创建了一个线程
    },

    createConnection: function (next, current) {
        // 关联next, current
        this.connections[next] = this.connections[next] || [];
        this.connections[current] = this.connections[current] || [];
        if (this.connections[next].indexOf(current) === -1) this.connections[next].push(current);
        if (this.connections[current].indexOf(next) === -1) this.connections[current].push(next);
    },

    pickMove: function (current) {
        // 递归
        let options = this.getOptions(current);  // 返回数组对象
        if (options.length) {  //
            this.queue.push(current);
            var choice = _.sample(options);  // 随机选择抉择点
            return [choice, current];  // node key数组, [x | y]
        }
        return this.pickMove(this.queue.shift());
    },

    getOptions: function (node) {
        /* 返回一个数组, 元素为node的key, 类似'x | y'
        *  相邻点中， 没有被连接的点 */
        return _.filter(helpers.getAdjacentNodes(node), function (option) {
            return this.grid.isInGrid(option) && !this.connections[option].length;
        }.bind(this));  // bind调用对象为maze
    },


    isFilled: function () {
        let unvisited = _.filter(this.connections, function (nodeConnections) {
            return nodeConnections.length === 0;
        })
        let isFilled = unvisited.length === 0;
        // let total = this.grid.w * this.grid.h;
        // let perc = isFilled ? 100 : (100 * (total - unvisited.length) / total) | 0; // maze已完成百分比
        // if (finishCb) finishCb();
        return isFilled;
    },

    isFinished: function (currentNd) {
        /* 判断是否有未到达的节点,
           updateCb函数表达式，设置class="progress"的元素的宽度
           updateCb: */
        let unvisited = _.filter(this.connections, function (nodeConnections) {
            return nodeConnections.length === 0;
        });
        // 选择connections中使谓词为真的元素
        return currentNd === this.endNode; // bool类型
    },



    draw: function () {
        // 用canvas绘制
        let ctx = this.grid.ctx
        let draw_single_line = this.draw_single_line.bind(this, ctx);
        _.each(this.connections, function (ends, start) {
            let startPos = helpers.getCoords(start);
            ends.forEach(function (end) {
                let endPos = helpers.getCoords(end);
                draw_single_line(startPos, endPos);
            });
        });
    },

    quickDraw: function(current, next) {
        // get nodekey as arguments
        let startPos = helpers.getCoords(current);
        let endPos = helpers.getCoords(next);
        let ctx = this.grid.ctx;
        this.draw_single_line(ctx, startPos, endPos);
    },

    draw_single_line: function(ctx, start, end) {
        let spacing = this.grid.spacing;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = spacing;
        ctx.beginPath();
        ctx.moveTo(start.x * spacing * 2 + spacing, start.y * spacing * 2 + spacing);  // begin
        ctx.lineTo(end.x * spacing * 2 + spacing, end.y * spacing * 2 + spacing);  // end
        ctx.stroke();
    },

    // onProgress: function (perc) {
    //     // 设置宽度百分比
    //     document.querySelector('.progress').style.width = perc + '%';
    // },

    onGenerated: function (cb) {
        if (this.generated) return cb();  // 返回callback函数的返回值
        this.onGeneratedCallbacks.push(cb);  // 将callback函数加入数组onGeneratedCallbacks
    }

};

module.exports = Maze;
