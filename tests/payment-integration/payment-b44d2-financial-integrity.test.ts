import { test } from 'node:test';
import { runAudit } from '../../scripts/payment-b44d2-financial-integrity';

test('B4.4D.2 read-only populated PostgreSQL financial integrity audit', async () => {
  await runAudit();
});
