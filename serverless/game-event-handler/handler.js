// =============================================================================
// Game Event Handler — Knative Serverless Function
// =============================================================================
// Processes CloudEvents for game-related events:
//   - game.bet.placed    → Log and validate bet
//   - game.result        → Process game outcome
//   - game.payout        → Handle payout event
//
// This function scales to zero when idle and auto-scales under load.
// =============================================================================

import http from 'node:http';
import { HTTP } from 'cloudevents';

const PORT = parseInt(process.env.PORT || '8080', 10);

/**
 * Route CloudEvent to the appropriate handler based on event type.
 */
function handleCloudEvent(event) {
  const type = event.type;
  const data = event.data || {};

  console.log(`[${new Date().toISOString()}] Received event: type=${type}, id=${event.id}`);

  switch (type) {
    case 'game.bet.placed':
      return handleBetPlaced(data, event);
    case 'game.result':
      return handleGameResult(data, event);
    case 'game.payout':
      return handlePayout(data, event);
    default:
      console.warn(`Unknown event type: ${type}`);
      return {
        status: 'ignored',
        reason: `Unrecognized event type: ${type}`,
      };
  }
}

/**
 * Handle a new bet placement event.
 */
function handleBetPlaced(data, event) {
  const { userId, gameType, amount, currency, timestamp } = data;

  // Validate required fields
  if (!userId || !gameType || !amount) {
    return { status: 'error', reason: 'Missing required fields: userId, gameType, amount' };
  }

  // Validate bet amount
  if (typeof amount !== 'number' || amount <= 0) {
    return { status: 'error', reason: 'Invalid bet amount' };
  }

  // Validate game type
  const validGames = ['crash', 'plinko', 'dino', 'mines'];
  if (!validGames.includes(gameType)) {
    return { status: 'error', reason: `Invalid game type: ${gameType}` };
  }

  console.log(`Bet placed: user=${userId}, game=${gameType}, amount=${amount} ${currency || 'USD'}`);

  return {
    status: 'accepted',
    betId: `bet_${event.id}`,
    userId,
    gameType,
    amount,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Handle a game result event.
 */
function handleGameResult(data, event) {
  const { betId, userId, gameType, outcome, multiplier } = data;

  console.log(`Game result: bet=${betId}, game=${gameType}, outcome=${outcome}, multiplier=${multiplier}`);

  const winAmount = outcome === 'win' ? (data.betAmount || 0) * (multiplier || 1) : 0;

  return {
    status: 'processed',
    betId,
    userId,
    gameType,
    outcome,
    multiplier: multiplier || 0,
    winAmount,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Handle a payout event.
 */
function handlePayout(data, event) {
  const { userId, amount, currency, betId } = data;

  console.log(`Payout: user=${userId}, amount=${amount} ${currency || 'USD'}, bet=${betId}`);

  return {
    status: 'payout_processed',
    userId,
    amount,
    currency: currency || 'USD',
    betId,
    transactionId: `txn_${event.id}`,
    processedAt: new Date().toISOString(),
  };
}

// =============================================================================
// HTTP Server
// =============================================================================
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }

  // Only accept POST for CloudEvents
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try {
      // Parse CloudEvent from HTTP request
      const event = HTTP.toEvent({ headers: req.headers, body });

      // Process the event
      const result = handleCloudEvent(event);

      const statusCode = result.status === 'error' ? 400 : 200;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('Error processing event:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid CloudEvent', details: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Game Event Handler listening on port ${PORT}`);
});
