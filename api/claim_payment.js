import fetch from 'node-fetch';
import { query } from '../../lib/db';

const REWARD_AMOUNT = 300; // KES

async function getStravaToken(userId) {
  const res = await query('select * from strava_tokens where user_id=$1', [userId]);
  return res.rows[0];
}

async function didWorkoutToday(accessToken) {
  const now = new Date();
  const startOfDay = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
  const resp = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${startOfDay}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!resp.ok) return false;
  const activities = await resp.json();
  return activities && activities.length > 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  // 1. check strava token
  const tokenRow = await getStravaToken(userId);
  if (!tokenRow) return res.status(400).json({ error: 'User not connected to Strava' });

  const accessToken = tokenRow.access_token;

  // 2. check if already claimed today
  const today = new Date().toISOString().slice(0,10);
  const already = await query('select * from daily_claims where user_id=$1 and claim_date=$2', [userId, today]);
  if (already.rows.length > 0) return res.status(400).json({ error: 'Already claimed today' });

  // 3. verify workout on Strava
  const did = await didWorkoutToday(accessToken);
  if (!did) return res.status(400).json({ error: 'No workout found for today' });

  // 4. create transaction (pending)
  const tx = await query(
    `INSERT INTO transactions (user_id, type, amount, currency, provider, status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [userId, 'reward', REWARD_AMOUNT, 'KES', null, 'pending']
  );
  const txRow = tx.rows[0];

  // 5. record daily claim (link transaction)
  await query(
    `INSERT INTO daily_claims (user_id, claim_date, transaction_id) VALUES ($1,$2,$3)`,
    [userId, today, txRow.id]
  );

  // 6. Trigger payout (provider-specific) - here we provide stubs. Choose provider in your frontend or server logic
  // e.g., await triggerMpesaPayout(userId, REWARD_AMOUNT, phone); // implement below

  // For now mark completed (simulate success). In real life mark pending, then update based on provider callback.
  await query('UPDATE transactions SET status=$1 WHERE id=$2', ['completed', txRow.id]);

  return res.status(200).json({ success: true, amount: REWARD_AMOUNT, transactionId: txRow.id });
}