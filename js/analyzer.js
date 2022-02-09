const Chart = require("chart.js");


function Analyzer(solver) {
    this.solver = solver;
    this.color = [
        'rgb(75, 192, 192)',
        '#7FFF00',
        '#FFD700'
    ]
    this.el = document.querySelector('#analyzer');
    this.el.style.top = solver.maze.grid.canvas.height + "px";
    this.draw(this.solver.keyPointPolicy);
}

Analyzer.prototype = {

    draw: function (policyLog) {
        for (let s in policyLog) {
            let text = s + " state policy";

            let data = this.getData(policyLog[s]);
            let config = this.getConfig(data, text)

            this.makeCanvasDiv(config);
        }
    },

    getData: function (state) {
        let datasets = [];
        let labelsSize = 0;
        let labels = [];
        let color = 0;
        for (let a in state) {
            datasets.push(this.setDataProperty(a, state[a], this.color[color++]));
            labelsSize = (labelsSize > state[a].length) ? labelsSize : state[a].length;
        }

        for (let i = 1; i <= labelsSize; i++ ) {
            labels.push(i);
        }

        return {
            "labels": labels,
            "datasets":datasets
        };
    },

    setDataProperty: function (label, data, color) {
        // data in dataset
        return {
            label: label,
            data: data,
            borderColor: color
        }
    },

    getConfig: function (data, text) {
        return {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: text
                    }
                },
                fill: false,
                tension: 0.2,
                datasets:{
                    line:{
                        pointRadius:0
                    }
                }
            },
        }
    },

    makeCanvasDiv: function (config) {
        let chartDiv = document.createElement('div');
        this.el.appendChild(chartDiv);

        let canvas = document.createElement('canvas');
        chartDiv.appendChild(canvas);
        new Chart(canvas, config);
    },
    destroy: function () {
        this.el.innerHTML = "";
    }
}

module.exports = Analyzer;
