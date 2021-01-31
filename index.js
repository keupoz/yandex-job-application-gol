/** @author Ivan Sokolov <https://github.com/keupoz> */

const { readFileSync } = require("fs");

/**
 * @param {string} msg
*/
function error(msg) {
    console.error(msg);
    process.exit(1);
}

/**
 * @param {string} data
 * @param {number} width
 * @param {number} height
 * @returns {boolean[][]}
*/
function createBoard(data, width, height) {
    if (data.length !== width * height) error(`Board data is not matching specified dimensions (${width} x ${height})`);

    /** @type {boolean[][]} */
    const board = [];

    for (let y = 0; y < height; y++) {
        board[y] = [];

        for (let x = 0; x < width; x++) {
            board[y][x] = data.charAt(y * width + x) !== "0";
        }
    }

    return board;
}

/**
 * @param {boolean[][]} board
*/
function drawBoard(board) {
    // Clear stdout
    process.stdout.cursorTo(0, 0);
    process.stdout.clearScreenDown();

    let frame = "";

    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            frame += board[y][x] ? "▮" : ".";
            frame += " ";
        }
        frame += "\n";
    }

    // Output the frame
    process.stdout.write(frame);
}

/**
 * @param {boolean[][]} board
 * @param {number} x0
 * @param {number} y0
 * @returns {number}
*/
function getLiveNeighboursCount(board, x0, y0) {
    let count = 0;

    for (let y1 = -1; y1 <= 1; y1++) {
        for (let x1 = -1; x1 <= 1; x1++) {
            if (!(x1 || y1)) continue;

            const x = x0 + x1,
                y = y0 + y1;

            if (board[y] && board[y][x]) count++;
        }
    }

    return count;
}

/**
 * @param {boolean[][]} board
*/
function updateBoard(board) {
    /** @type {boolean[][]}*/
    const newBoard = [];

    for (let y = 0; y < board.length; y++) {
        newBoard[y] = [];

        for (let x = 0; x < board[y].length; x++) {
            const liveCount = getLiveNeighboursCount(board, x, y);
            // This "game" has 4 rules but they all can be merged in one statement
            newBoard[y][x] = board[y][x] && liveCount === 2 || liveCount === 3;
        }
    }

    return newBoard;
}

/**
 * @param {string} data
 * @param {number} width
 * @param {number} height
*/
function start(data, width, height) {
    let board = createBoard(data, width, height);
    drawBoard(board);

    setInterval(() => {
        board = updateBoard(board);
        drawBoard(board);
    }, 1000);
}

const [arg1, arg2] = process.argv.slice(2);

if (arg1 === undefined) {
    // No arguments specified. Output usage info
    console.log("Usage: [<width> <height> | <filename>]");
    process.exit(0);
} else if (arg2 === undefined) {
    // Only one argument specified. Loading from file
    try {
        const rawData = readFileSync(arg1, { encoding: "utf-8" })
            // Split by lines
            .split(/\r?\n/)
            // Remove all spaces
            .map((line) => line.replace(/\s+/g, ""))
            // Filter empty lines
            .filter((line) => line !== "");

        const height = rawData.length;

        // Find max width of the board
        let width = 0;
        for (let y = 0; y < rawData.length; y++) {
            width = Math.max(width, rawData[y].length);
        }

        // Make all rows equal width
        const data = rawData.map((value) => value.padEnd(width, "0")).join("");

        start(data, width, height);
    } catch {
        error(`Couldn't load file "${arg1}"`);
    }
} else {
    // Both arguments specified. Expecting them to be dimensions of a new random board
    const width = parseInt(arg1),
        height = parseInt(arg2);

    if (isNaN(width) || isNaN(height)) {
        error(`Either width or height is NaN (${width} x ${height})`);
    }

    const length = width * height;

    // Generate random state
    let data = "";
    for (let i = 0; i < length; i++) {
        data += Math.round(Math.random());
    }

    start(data, width, height);
}
