const _ = require('underscore');

const Grid = require('./grid');
const Maze = require('./maze');
const Solver = require('./solver');
const Stats = require('./stats');
const Analyzer = require('./analyzer')

const Info = require('./info');

let mazeEl;
let grid, maze, solver, stats, analyzer;
window.solvers = [];


const setup = function () {  // setup function
    // new Info({
    //     url: 'README.md',
    //     keyTrigger: true,
    //     container: 'wrapper'
    // });

    // mazeEL是html元素
    mazeEl = document.querySelector('#maze');  // 选择id = maze的元素

    let gridSize = document.querySelector('#setSize').querySelectorAll('input')

    for (let input of gridSize) {
        input.addEventListener('change', checkGridSize);
    }

    document.querySelector('.new-maze').addEventListener('click', newMaze);
    document.querySelector('.pause').addEventListener('click', pause);
    document.querySelector('.new-policy').addEventListener('click', newSolver);
    document.querySelector('.visualize-policy').addEventListener('click', visualizePolicy);
    document.querySelector('.visualize-grid').addEventListener('click', convertGrid);
    start();
};

const pause = function () {
    solver.togglePlay();
};

const visualizePolicy = function () {
    stats.togglePolicyViz();
};

const start = function () {
    grid = new Grid(mazeEl);
    maze = new Maze(grid);
    setupSolver();

    window._ = _;  // 添加window的_属性
};

const setupSolver = function () {
    solver = new Solver(maze);
    solvers.push(solver);
    stats = new Stats(solver);
    analyzer = new Analyzer(solver);
    maze.onGenerated(solver.startTraining.bind(solver));
    // setTimeout(analyzer.wait_to_draw, 15000);
    // _.defer(analyzer.wait_to_draw);
};

const newSolver = function () {
    document.querySelector('.messages').innerHTML = '';
    solver.destroy();
    stats.destroy();
    setupSolver();
};

const newMaze = function () {
    solver.destroy();
    analyzer.destroy();
    mazeEl.innerHTML = '';
    document.querySelector('.messages').innerHTML = '';
    solvers = [];
    start();
};

const convertGrid = function () {
    grid.setGridVisibility();
};

const checkGridSize = function () {
    let x = this.value;
    if (isNaN(x) || x < 2 || x > 20) {
        alert("2 to 20");
        this.value = x > 20 ? 20 : 2;
    }
};

window.onload = setup;
