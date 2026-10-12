import { throws } from 'node:assert/strict';

test('the vector adapter checks answers and expected refusals, without accepting either vacuously', () => {
  compare({ answer: 1 }, { answer: 1 });
  compare({ answer: 1 }, { answer: 2 }, { 'expected.ok': false });
  throws(() => compare({ answer: 1 }, { answer: 2 }));
  throws(() => compare({ answer: 1 }, { answer: 1 }, { 'expected.ok': false }));
});
