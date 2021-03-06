
var DELIMITER = '|';


function getCoords(node) {
    // 返回x
    var coords = node.split(DELIMITER);  // coords: 左边
    var x = +coords[0];
    var y = +coords[1];
    return {x: x, y: y};
}

function createDotList(w, h) {
    var dots = [];
    var x = w;
    while (x--) {
        var y = h;
        while (y--) {
            dots.push(x + DELIMITER + y);
        }
    }
    return dots;
}

function createDotDict(w, h) {
    var dict = {}; // object
    var x = w;
    while (x--) {
        var y = h;
        while (y--) {
            dict[x + DELIMITER + y] = [];  //
        }
    }
    return dict;
}

function nodeKey(x, y) {  // 返回点坐标，类型：字符串
    return x + DELIMITER + y;
}

function getAdjacentNodes(node) {
    var pos = getCoords(node);
    return [
        nodeKey(pos.x - 1, pos.y),  // 左
        nodeKey(pos.x + 1, pos.y),  // 右
        nodeKey(pos.x, pos.y - 1),  // 上
        nodeKey(pos.x, pos.y + 1)   // 下
    ];
}

function EulerSumArray(obj) {
    let ans = 0;
    for (let a in obj) {
        ans += Math.pow(Math.E, obj[a]);
    }
    return ans;
}
function softmax(obj) {
    let ans = {};
    for (let s in obj) {
        ans[s] = {};
        let EulerSum = EulerSumArray(obj[s]);
        for (let a in obj[s]) {
            ans[s][a] = (Math.pow(Math.E, obj[s][a]) / EulerSum);
        }
    }
    return ans;
}

module.exports = {
    'DELIMITER': DELIMITER,
    'MIN_SPACING': 5,
    'MAX_SPACING': 80,

    getCoords,
    createDotList,
    createDotDict,
    nodeKey,
    getAdjacentNodes,
    softmax
};
