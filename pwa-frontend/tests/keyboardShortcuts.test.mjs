import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Keyboard Month Grid Navigation Calculations', () => {
  function getNextMonthIndex(currentIndex, key) {
    switch (key) {
      case 'ArrowRight':
        return (currentIndex + 1) % 12;
      case 'ArrowLeft':
        return (currentIndex - 1 + 12) % 12;
      case 'ArrowDown':
        return (currentIndex + 3) % 12;
      case 'ArrowUp':
        return (currentIndex - 3 + 12) % 12;
      default:
        return currentIndex;
    }
  }

  it('should navigate horizontally across months correctly', () => {
    // 0 = Jan (1)
    assert.strictEqual(getNextMonthIndex(0, 'ArrowRight'), 1); // Feb
    assert.strictEqual(getNextMonthIndex(11, 'ArrowRight'), 0); // Wrap Dec -> Jan
    assert.strictEqual(getNextMonthIndex(0, 'ArrowLeft'), 11); // Wrap Jan -> Dec
    assert.strictEqual(getNextMonthIndex(7, 'ArrowRight'), 8); // Aug (7) -> Sep (8)
  });

  it('should navigate vertically in 3x4 month grid correctly', () => {
    // 3 columns:
    // [0: Jan] [1: Fev] [2: Mar]
    // [3: Abr] [4: Mai] [5: Jun]
    // [6: Jul] [7: Ago] [8: Set]
    // [9: Out] [10:Nov] [11:Dez]
    assert.strictEqual(getNextMonthIndex(0, 'ArrowDown'), 3); // Jan -> Abr
    assert.strictEqual(getNextMonthIndex(7, 'ArrowDown'), 10); // Ago -> Nov
    assert.strictEqual(getNextMonthIndex(9, 'ArrowDown'), 0); // Out -> Jan (wrap)
    assert.strictEqual(getNextMonthIndex(0, 'ArrowUp'), 9); // Jan -> Out (wrap)
    assert.strictEqual(getNextMonthIndex(11, 'ArrowUp'), 8); // Dez -> Set
  });
});
