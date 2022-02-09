var _ = require('underscore');
var helpers = require('./helpers');
var analyzer = require('./analyzer.js')

function Solver(maze) {
    this.maze = maze;

    this.end = helpers.nodeKey(maze.grid.w - 1, maze.grid.h - 1);
    this.playing = true;
    this.complete = false;
    this.analyzer = new analyzer(this);

    this.msgContainer = document.querySelector('.messages');  // message元素

    this.setupCanvas();

    this.onPlay = function () {
    };

    _.defaults(this, {  // 填充undefined属性, 如果属性被定义, 则default无效
        'explore': 0.1,  //  探索系数，随机选择动作，而不根据策略
        'alpha': 0.5,  //
        'gamma': 0.9,
        'eta': 0.05,
        'discount': 0.95,  //  // 折扣
        'decay': 0.9997,  // 探索衰减系数
        'initial': 0,  //
        'trainingThreshold': 6, // number of consecutive occurences to stop training, 连续出现6次数被认为最终答案
        'rewards': {  // 奖励
            'step': -0.1,
            'finished': 1
        }
    });
}

Solver.prototype = {
    startTraining: function () {
        this.policy = {}; // Q(s,a)
        this.s_a_history = {};
        this.keyPointPolicy = {};
        console.log(this.keyPointPolicy);
        this.runs = 0;
        this.scores = [];
        this.start();
    },

    start: function () {
        this.clearCanvas();  // 删除上一次绘制路径
        this.startTime = this.startTime || Date.now();  // 记录当前时间
        this.path = [];
        this.current = helpers.nodeKey(0, 0);
        this.play();
    },

    setupCanvas: function () {
        this.canvas = document.createElement('canvas');

        // 设置canvas元素width, height属性, 和maze一样
        this.canvas.width = this.maze.grid.spacing * this.maze.grid.w * 2;
        this.canvas.height = this.maze.grid.spacing * this.maze.grid.h * 2;

        this.ctx = this.canvas.getContext('2d');
        this.draw = this.draw.bind(this, this.ctx);
        this.maze.grid.el.appendChild(this.canvas);  // maze元素后添加canvas
    },

    draw: function (ctx, start, end) {
        let spacing = this.maze.grid.spacing;
        let startPos = helpers.getCoords(start);
        let endPos = helpers.getCoords(end);
        ctx.strokeStyle = 'rgba(31, 231, 31, 0.3)';  // 颜色和透明度
        ctx.lineWidth = spacing;
        ctx.beginPath();
        ctx.moveTo(startPos.x * spacing * 2 + spacing, startPos.y * spacing * 2 + spacing);
        ctx.lineTo(endPos.x * spacing * 2 + spacing, endPos.y * spacing * 2 + spacing);
        ctx.stroke();
    },

    clearCanvas: function () {
        // 删除上次绘制的canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    togglePlay: function () {
        this.playing = !this.playing;
        if (this.playing) this.play();
    },

    play: function () {
        let next = this.choose();  // next = 'x|y'
        let evaluateFn = this.evaluate.bind(this, this.current, 'step');  //
        this.path.push(next);
        this.draw(this.current, next);
        this.current = next;
        evaluateFn();

        this.onPlay();

        if (next === this.end) {
            return this.completedMaze();
        }

        let totalNodes = this.maze.grid.h * this.maze.grid.w;
        if (this.path.length > totalNodes * 10) {
            // this is a relatively arbitrary number that keeps the algo from
            // getting stuck
            this.logMsg('Got stuck, trying again: ' + this.path.length + ' steps');
            return _.delay(this.start.bind(this), 100);
        }
        if (this.playing) {
            // 相当于创建新的play线程
            _.defer(this.play.bind(this));
        }
    },

    completedMaze: function () {
        this.runs += 1;
        this.logMsg(this.runs + ': Completed: ' + this.path.length + ' steps');

        this.scores.push(this.path.length);
        let last = _.last(this.path, 2)[0];
        this.evaluate(last, 'finished');

        // stop when the last n scores are the same
        // 返回后6次得分
        let lastUniqScores = _.uniq(_.last(this.scores, this.trainingThreshold));  // 返回scores，后面6个元素
        if (this.runs > 10 && lastUniqScores.length === 1) {
            this.complete = true;
            this.logMsg('Solution: ' + lastUniqScores[0] + ' steps');
            this.logMsg('Performance (ms): ' + (Date.now() - this.startTime));
            this.analyzer.draw(this.keyPointPolicy);
        } else {
            // 开始下一局游戏
            _.delay(this.start.bind(this), 100);
        }
    },

    logMsg: function (msg) {
        console.log(msg);
        let firstChild = this.msgContainer.childNodes[0];
        let span = document.createElement('span');
        span.innerHTML = msg;
        this.msgContainer.insertBefore(span, firstChild);
    },

    choose: function () {
        /*
          1. 动作范围
          2. 选择价值最大的动作或随机动作
         */
        _ensureDefaultVals(this.policy, this.current, this.maze, this.initial, this.keyPointPolicy);
        let last = _.last(this.path, 2)[0];

        // 前一个点在connection内，但不在下一步动作考虑范围，返回false, compact移除false
        let actions = _.map(this.policy[this.current], function (value, node) {  // value, key
            // 选择点不包括前一个, last点
            if (node === last && _.size(this.policy[this.current]) > 1) return false;
            return {
                'nodeMovedTo': node,  // key
                'value': value // value
            };
        }.bind(this));
        actions = _.compact(actions);  // 移除false元素


        let min = _.min(actions, function (action) {
            return action['value'];
        });
        let max = _.max(actions, function (action) {
            return action['value'];
        });

        // 最大值或最小值一样时，或roll number小于探索系数时
        let chooseRandom = (min['value'] === max['value'] || Math.random() < this.explore);
        let action = chooseRandom ? _.sample(actions) : max;  // 随机选择动作或价值最大的动作

        return action && action['nodeMovedTo'];
    },

    evaluate: function (last, rewardName) {
        // 更新状态价值, new Q(s,a), new explore
        _ensureDefaultVals(this.policy, this.current, this.maze, this.initial, this.keyPointPolicy);

        let reward = this.rewards[rewardName];  // -10 or 0

        let prevValue = this.policy[last][this.current];  // Q[s(t),a(t)]
        let curBestChoice = _.max(this.policy[this.current]);  // max(a)Q[s(t+1), a]

        // q值更新公式
        // let newValue = (1 - this.discount) * prevValue + this.alpha * (reward + this.discount * curBestChoice);
        let newValue = (1 - this.eta) * prevValue + this.eta * (reward + this.discount * curBestChoice);
        // Q(s,a)=(1-gamma)
        this.policy[last][this.current] = newValue; // 更新: Q[s(t), a(t)]
        this.pushHistoryPolicy(last, this.policy, this.keyPointPolicy);

        // console.log(this.explore);
        this.explore *= this.decay;
    },

    policyIterate: function(){

    },

    pushHistoryPolicy: function (current, policy, keyPointPolicy) {
        let actions = this.maze.connections[current];
        if (actions.length > 2) {
            actions.forEach(function(action) {
                keyPointPolicy[current][action].push(policy[current][action]);
            })
        }
    },

    destroy: function () {
        this.playing = false;
        this.canvas.parentElement.removeChild(this.canvas);
    }
};

function _ensureDefaultVals(policy, current, maze, initial, keypoint) {
    /* policy = {
           a:{
               prop1:"value",
               prop2:"value2},
           b:{
               prop3: "value3",
               prop4: "value4"}
       };
       policy通过maze中的connection初始化
     */

    let actions = maze.connections[current];  // 返回可选动作

    policy[current] = policy[current] || {};
    actions.forEach(function (action) {
        // 如当前变量有值，保持原值，否则，创建属性名为 表达式action计算结果的字符串 的属性
        policy[current][action] = policy[current][action] || initial;
    });

    if (actions.length > 2) {
        keypoint[current] = keypoint[current] || {};
        actions.forEach(function (action) {
            // 如当前变量有值，保持原值，否则，创建属性名为 表达式action计算结果的字符串 的属性
            keypoint[current][action] = keypoint[current][action] || [];
        });
    }
}

function _initPolicy(connection) {
    let theta = {};
    for (let s in connection) {
        theta[s] = {};
        for (let a of connection[s]) {
            theta[s][a] = 1;
        }
    }
    return helpers.softmax(theta);
}

module.exports = Solver;
