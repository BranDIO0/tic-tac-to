<script setup lang="ts">
// Wir bekommen das Board (2D Array) und ob wir gerade am Zug sind
const props = defineProps<{
  board: string[][];
  isMyTurn: boolean;
  winningLine?: number[][] | null;
}>();

// Wir senden ein Event nach oben, wenn geklickt wird
const emit = defineEmits(['cell-click']);

const isWinningCell = (rowIndex: number, colIndex: number) => {
  if (!props.winningLine) return false;
  return props.winningLine.some(([r, c]) => r === rowIndex && c === colIndex);
};

const handleClick = (rowIndex: number, colIndex: number, cellValue: string) => {
  // Nur klicken erlauben, wenn Zelle leer ist UND wir am Zug sind
  if (cellValue === "" && props.isMyTurn) {
    emit('cell-click', rowIndex, colIndex);
  }
};
</script>

<template>
  <div class="board-container">
    <div class="board">
      <div 
        v-for="(row, rowIndex) in board" 
        :key="rowIndex" 
        class="row"
      >
        <div 
          v-for="(cell, colIndex) in row" 
          :key="`${rowIndex}-${colIndex}`"
          class="cell"
          :class="{ 'clickable': cell === '' && isMyTurn, 'winner': isWinningCell(rowIndex, colIndex) }"
          @click="handleClick(rowIndex, colIndex, cell)"
        >
          <span v-if="cell === 'X'" class="symbol x">X</span>
          <span v-else-if="cell === 'O'" class="symbol o">O</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.board-container {
  display: flex;
  justify-content: center;
  margin: 2rem auto;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 8px; /* Das sind die Gitterlinien (der Abstand zwischen den Zellen) */
  background-color: #333333; /* Dunkler Hintergrund macht die Linien sichtbar */
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.row {
  display: flex;
  gap: 8px; /* Abstand horizontal */
}

.cell {
  width: 90px;
  height: 90px;
  background-color: #ffffff; /* Weiße Zellen */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3.5rem;
  font-weight: bold;
  font-family: sans-serif;
  border-radius: 4px;
  cursor: default;
  user-select: none;
  transition: background-color 0.3s;

  &.clickable:hover {
    background-color: #f3f4f6; /* Leichtes Grau beim Drüberfahren */
    cursor: pointer;
  }

  &.winner {
    background-color: #fcd34d;
    border: 2px solid #f59e0b;
  }
}

.symbol.x { color: #2563eb; /* Blau für X */ }
.symbol.o { color: #dc2626; /* Rot für O */ }
</style>