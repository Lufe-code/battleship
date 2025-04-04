const MIN_SIZE = 10;
const MAX_SIZE = 20;
let size;
let playerBoard = [];
let computerBoard = [];
let enemyVisibleBoard = [];
let shipsToPlace = [5, 4, 3, 3, 2];
let currentShip = 0;
let placingDirection = 'horizontal';

function createBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill('~'));
}

function renderBoard(board, containerId, clickHandler, isPlayer = false) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const table = document.createElement('table');

  for (let row = 0; row < size; row++) {
    const tr = document.createElement('tr');
    for (let col = 0; col < size; col++) {
      const td = document.createElement('td');
      td.dataset.row = row;
      td.dataset.col = col;
      const cell = board[row][col];

      if (cell === 'X') td.classList.add('hit');
      else if (cell === 'O') td.classList.add('miss');
      else if (isPlayer && cell === 'S') td.classList.add('ship');
      else td.classList.add('water');

      if (clickHandler) {
        td.addEventListener('click', clickHandler);
      }

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  container.appendChild(table);
}

function setupPlayerBoard() {
  size = parseInt(document.getElementById('boardSize').value);
  if (isNaN(size) || size < MIN_SIZE || size > MAX_SIZE) {
    alert(`El tamaño debe ser entre ${MIN_SIZE} y ${MAX_SIZE}`);
    return;
  }
  playerBoard = createBoard(size);
  renderBoard(playerBoard, 'playerBoard', handleShipPlacement, true);
  document.getElementById('startBtn').disabled = true;
  alert(`Coloca tus barcos (tamaño: ${shipsToPlace[currentShip]}). Da clic en la dirección (horizontal). Usa doble clic para cambiar la dirección.`);
}

function handleShipPlacement(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const shipLen = shipsToPlace[currentShip];

  if (canPlaceShip(playerBoard, row, col, shipLen, placingDirection)) {
    placeShip(playerBoard, row, col, shipLen, placingDirection);
    currentShip++;
    if (currentShip < shipsToPlace.length) {
      alert(`Siguiente barco (tamaño: ${shipsToPlace[currentShip]})`);
    } else {
      document.getElementById('startBtn').disabled = false;
      alert('¡Todos los barcos colocados! Listo para jugar.');
    }
    renderBoard(playerBoard, 'playerBoard', handleShipPlacement, true);
  } else {
    alert('No se puede colocar el barco aquí.');
  }
}

document.getElementById('playerBoard').addEventListener('dblclick', () => {
  placingDirection = placingDirection === 'horizontal' ? 'vertical' : 'horizontal';
  alert(`Dirección cambiada a: ${placingDirection}`);
});

function canPlaceShip(board, row, col, length, direction) {
  if (direction === 'horizontal') {
    if (col + length > size) return false;
    return board[row].slice(col, col + length).every(cell => cell === '~');
  } else {
    if (row + length > size) return false;
    return board.slice(row, row + length).every(r => r[col] === '~');
  }
}

function placeShip(board, row, col, length, direction) {
  for (let i = 0; i < length; i++) {
    if (direction === 'horizontal') board[row][col + i] = 'S';
    else board[row + i][col] = 'S';
  }
}

function placeShipRandomly(board, length) {
  let placed = false;
  while (!placed) {
    const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    if (canPlaceShip(board, row, col, length, direction)) {
      placeShip(board, row, col, length, direction);
      placed = true;
    }
  }
}

function startGame() {
  computerBoard = createBoard(size);
  enemyVisibleBoard = createBoard(size);
  for (let len of shipsToPlace) {
    placeShipRandomly(computerBoard, len);
  }
  renderBoard(enemyVisibleBoard, 'enemyBoard', handlePlayerTurn);
  renderBoard(playerBoard, 'playerBoard', null, true);
}

function handlePlayerTurn(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);

  if (enemyVisibleBoard[row][col] !== '~') {
    alert('Ya atacaste esta posición.');
    return;
  }

  if (computerBoard[row][col] === 'S') {
    enemyVisibleBoard[row][col] = 'X';
    computerBoard[row][col] = 'X';
    alert('¡Impacto!');
  } else {
    enemyVisibleBoard[row][col] = 'O';
    alert('Agua.');
  }
  renderBoard(enemyVisibleBoard, 'enemyBoard', handlePlayerTurn);
  if (allShipsSunk(computerBoard)) {
    alert('¡Ganaste!');
  }
}

function allShipsSunk(board) {
  return board.every(row => row.every(cell => cell !== 'S'));
}
