const MIN_SIZE = 10;  // Tamaño mínimo del tablero
const MAX_SIZE = 20;  // Tamaño máximo del tablero
let size;  // Tamaño del tablero definido por el jugador
let playerBoard = [];  // Tablero del jugador (con barcos)
let computerBoard = [];  // Tablero de la computadora (con barcos)
let enemyVisibleBoard = [];  // Tablero visible del enemigo para el jugador (oculta barcos no golpeados)
let shipsToPlace = [5, 4, 3, 3, 2, 2]; // Lista de tamaños de barcos a colocar
let currentShip = 0;  // Índice del barco actual que se está colocando
let placingDirection = 'horizontal';  // Dirección por defecto al colocar barcos
let playerShips = [];  // lista de barcos destruidos del jugador
let computerShips = [];  // lista de barcos destruidos de la computadora
let playerScore = 0;  // Puntaje del jugador

const climasPorUbicacion = {
  "Mar Caribe": "🌤️ Soleado con brisa suave, 28°C",
  "Océano Atlántico": "🌧️ Lluvia moderada y oleaje fuerte, 22°C",
  "Océano Pacífico": "🌊 Oleaje intenso y cielo nublado, 19°C",
  "Mar Mediterráneo": "☀️ Soleado y cálido, 25°C",
  "Mar del Norte": "❄️ Niebla y temperaturas bajas, 10°C",
  "Océano Índico": "🌦️ Lluvias dispersas y humedad alta, 27°C"
};


function createBoard(size) {  // crea la matriz para el juego
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

      if (cell === 'X') td.classList.add('hit');  // impacto
      else if (cell === 'O') td.classList.add('miss');  // fallo
      else if (isPlayer && cell === 'S') td.classList.add('ship');  //barco
      else td.classList.add('water');  // cualquier celda no ocupada

      if (clickHandler) {
        td.addEventListener('click', clickHandler);
      }

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  container.appendChild(table);
}

/* 
Se llama al presionar el botón para iniciar el juego:

Lee el tamaño ingresado por el usuario.

Valida que esté entre los límites.

Crea el tablero del jugador.

Llama a renderBoard() para mostrarlo.

Inicia la colocación de barcos.
*/
function setupPlayerBoard() {
  actualizarNombreJugador();
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

/* 
Obtiene la posición clicada.

Revisa si el barco cabe con canPlaceShip().

Si sí, lo coloca con placeShip() y avanza al siguiente barco.

Si ya colocó todos, habilita el botón de empezar el juego.
*/
function handleShipPlacement(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const shipLen = shipsToPlace[currentShip];

  if (canPlaceShip(playerBoard, row, col, shipLen, placingDirection)) {
    placeShip(playerBoard, row, col, shipLen, placingDirection, playerShips);
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

// crea el evento con doble cilc para dar vuelta a los barcos
document.getElementById('playerBoard').addEventListener('dblclick', () => {
  placingDirection = placingDirection === 'horizontal' ? 'vertical' : 'horizontal';
  alert(`Dirección cambiada a: ${placingDirection}`);
});

// Verifica si el barco cabe en la posición y dirección dadas sin chocar con otro ni salirse del tablero.
function canPlaceShip(board, row, col, length, direction) {
  const isHorizontal = direction === 'horizontal';

  for (let i = 0; i < length; i++) {
    const r = isHorizontal ? row : row + i;
    const c = isHorizontal ? col + i : col;

    // Verifica si se sale del tablero
    if (r < 0 || r >= size || c < 0 || c >= size) return false;

    // Verifica si la casilla o las adyacentes ya tienen un barco
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;

        if (
          nr >= 0 && nr < size &&
          nc >= 0 && nc < size &&
          board[nr][nc] === 'S'
        ) {
          return false;
        }
      }
    }
  }

  return true;
}


// Coloca un barco en el tablero reemplazando ~ por 'S' en la dirección dada (horizontal o vertical).
function placeShip(board, row, col, length, direction, shipList) {
  const ship = { positions: [], hits: 0 };

  for (let i = 0; i < length; i++) {
    const r = direction === 'horizontal' ? row : row + i;
    const c = direction === 'horizontal' ? col + i : col;
    board[r][c] = 'S';
    ship.positions.push({ row: r, col: c });
  }
  shipList.push(ship);

}

/*
Coloca un barco de forma aleatoria en el tablero dado (usado para la computadora).

Genera coordenadas y dirección aleatoria.

Usa canPlaceShip() para verificar.

Si se puede, llama a placeShip().
*/
function placeShipRandomly(board, length, shipList) {
  let placed = false;
  while (!placed) {
    const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    if (canPlaceShip(board, row, col, length, direction)) {
      placeShip(board, row, col, length, direction, shipList);
      placed = true;
    }
  }
}

/*
Crea el tablero de la computadora.

Coloca sus barcos aleatoriamente.

Crea un tablero visible del enemigo (oculta los barcos no golpeados).

Muestra ambos tableros.
*/
function startGame() {
  const name = document.getElementById('playerName').value.trim();
  const country = document.getElementById('playerCountry').value;
  const location = document.getElementById('playerLocation').value.trim();

  if (!(name && country && location)) {
    alert('Por favor, completa tu nombre, país y ubicación antes de comenzar.');
    return;
  }
  else{

    const clima = climasPorUbicacion[location] || "🌍 Clima no disponible";
    climaInfo.textContent = `Condiciones climáticas en ${location}: ${clima}`;

    computerBoard = createBoard(size);
    enemyVisibleBoard = createBoard(size);
    for (let len of shipsToPlace) {
       placeShipRandomly(computerBoard, len, computerShips);
  }
  renderBoard(enemyVisibleBoard, 'enemyBoard', handlePlayerTurn);
  renderBoard(playerBoard, 'playerBoard', null, true);
  }
}

/*
Maneja cuando el jugador ataca al tablero enemigo:

Lee la celda seleccionada.

Si ya atacó ahí, lo ignora.

Si hay un barco (S), lo marca como impacto (X).

Si no, lo marca como agua (O).

Actualiza la vista.

Verifica si el jugador ganó.

Si no ha ganado, llama al turno de la computadora con setTimeout
*/
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
    playerScore += 10; // ✅ Acierto = +10 puntos

    if (checkIfShipSunk(computerShips, row, col)) {
      alert('¡Hundiste un barco enemigo!');
    } else {
      alert('¡Impacto!');
    }

  } else {
    // ❌ Fallo: comprobar si fue cerca de un barco
    if (isNearShip(computerBoard, row, col)) {
      playerScore -= 3;
      alert('Casi le das... pero fue un fallo. (-3 puntos)');
    } else {
      playerScore -= 1;
      alert('Agua. (-1 punto)');
    }

    enemyVisibleBoard[row][col] = 'O';
  }

  renderBoard(enemyVisibleBoard, 'enemyBoard', handlePlayerTurn);

  if (allShipsSunk(computerBoard)) {
    alert(`¡Ganaste!\nPuntaje final: ${playerScore}`);
    return;
  }

  setTimeout(() => {
    computerTurn();
  }, 500);
}


/*
La computadora ataca:

Genera coordenadas aleatorias que no haya atacado antes.

Marca 'X' si acierta, 'O' si falla.

Muestra el resultado con un alert.

Actualiza el tablero del jugador.

Revisa si la computadora ganó.
*/
function computerTurn() {
  let row, col;
  do {
    row = Math.floor(Math.random() * size);
    col = Math.floor(Math.random() * size);
  } while (playerBoard[row][col] === 'X' || playerBoard[row][col] === 'O');

  if (playerBoard[row][col] === 'S') {
    playerBoard[row][col] = 'X';

    if (checkIfShipSunk(playerShips, row, col)) {
      alert('¡La computadora hundió uno de tus barcos!');
    } else {
      alert('¡La computadora acertó en uno de tus barcos!');
    }
  } else {
    playerBoard[row][col] = 'O';
    alert('La computadora falló.');
  }

  renderBoard(playerBoard, 'playerBoard', null, true);

  if (allShipsSunk(playerBoard)) {
    alert(`¡Perdiste! La computadora hundió todos tus barcos.\nTu puntaje final fue: ${playerScore}`);
  }
  
  if (playerBoard[row][col] === 'S') {
    playerBoard[row][col] = 'X';
  
    if (checkIfShipSunk(playerBoard, playerShips, row, col)) {
      alert('¡La computadora hundió uno de tus barcos!');
    } else {
      alert('¡La computadora acertó en uno de tus barcos!');
    }
  }
  
}

// verifica si se ha destruido un barco
function checkIfShipSunk(shipList, row, col) {
  for (let ship of shipList) {
    if (ship.positions.some(pos => pos.row === row && pos.col === col)) {
      ship.hits++;
      if (ship.hits === ship.positions.length) {
        return true;
      }
    }
  }
  return false;
}

// combierte el tablero a matrix
function boardToTextMatrix(board) {
  return board.map(row =>
    row.map(cell => (cell === 'S' ? '1' : '0')).join(' ')
  ).join('\n');
}

// funcion para descarga un archivo
function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// funcion para exportar mapa del jugador
function exportPlayerBoard() {
  const matrixText = boardToTextMatrix(playerBoard);
  downloadTextFile(matrixText, 'player_board.txt');
}

// funcion para exportar mapa de la maquina
function exportComputerBoard() {
  const matrixText = boardToTextMatrix(computerBoard);
  downloadTextFile(matrixText, 'computer_board.txt');
}

// nombre del jugador
function actualizarNombreJugador() {
  const nombre = document.getElementById('playerName').value.trim();
  const titulo = document.getElementById('playerBoardTitle');

  if (nombre) {
    titulo.textContent = `Tablero de ${nombre}`;
  } else {
    titulo.textContent = 'Tu Tablero';
  }
}

// cargar los paises de la api
async function cargarPaises() {
  const select = document.getElementById('playerCountry');
  try {
    const response = await fetch('/src/data/paises.json');
    if (!response.ok) throw new Error('Error en la respuesta');

    const data = await response.json();
    const countries = Object.values(data).map(c => c.name).sort();

    select.innerHTML = '<option selected disabled>Selecciona un país</option>';
    countries.forEach(pais => {
      const option = document.createElement('option');
      option.value = pais;
      option.textContent = pais;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar países:', error);
    select.innerHTML = '<option selected disabled>Error al cargar países</option>';
  }
}

// abyacencia de disparos
function isNearShip(board, row, col) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;  // ignorar la misma celda
      const nr = row + dr;
      const nc = col + dc;
      if (
        nr >= 0 && nr < size &&
        nc >= 0 && nc < size &&
        board[nr][nc] === 'S'
      ) {
        return true;
      }
    }
  }
  return false;
}


/*
Verifica si todos los barcos de un tablero han sido hundidos (ya no quedan 'S').
*/
function allShipsSunk(board) {
  return board.every(row => row.every(cell => cell !== 'S'));
}

document.addEventListener('DOMContentLoaded', () => {
  cargarPaises();
});