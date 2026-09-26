#!/usr/bin/env node
/**
 * Root predev port check (PORT-REFERENCE.md §Local).
 *
 * Two bugs this replaces:
 *  1. It checked [3000, 3001, 5432, 6379]. 3000/3001 are the PRODUCTION HOST
 *     frontend port, not the local one, and the backend's 3012 was never
 *     checked at all — so the gate passed while the port the backend actually
 *     binds was never inspected.
 *  2. It fired four async `net.listen` probes and let the process fall off the
 *     end. Node exits when the event loop drains, so the "in use" handlers
 *     usually never ran and the script printed nothing and gated nothing.
 *
 * Semantics match the per-app `scripts/validate-port.js` hooks: an occupied
 * port is a WARNING, not a hard failure, because you cannot tell an intentional
 * second dev stack from a stray listener, and blocking `npm run dev` on a
 * re-run would be hostile. Ports outside the allowed set are a hard error.
 */

const net = require('net');

const ALLOWED_PORTS = [3010, 3012, 5432, 6379];
const HOST = '127.0.0.1';

const PORT_ROLES = {
  3010: 'frontend (Next.js)',
  3012: 'backend (NestJS)',
  5432: 'postgres',
  6379: 'redis',
};

/** Resolves to 'free' | 'in-use' | 'error:CODE'. */
function probe(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => resolve(`error:${err.code ?? 'UNKNOWN'}`));
    server.once('listening', () => server.close(() => resolve('free')));
    server.listen(port, HOST);
  });
}

async function main() {
  if (process.env.DOCKER_ENV === 'true' || process.env.CONTAINER_ENV === 'true') {
    console.log('✓ Port validation skipped (Docker mode — ports are mapped by compose)');
    return 0;
  }

  // Ports the project must never bind locally. 3000/3001 are the production
  // host bindings; claiming one locally shadows a real conflict later.
  const disallowed = [3000, 3001];
  const busy = [];

  for (const port of [...ALLOWED_PORTS, ...disallowed]) {
    const result = await probe(port);
    if (result === 'free') {
      console.log(`✓ ${port} free — ${PORT_ROLES[port] ?? 'unused'}`);
      continue;
    }
    if (result === 'error:EADDRINUSE') {
      busy.push(port);
      console.log(`• ${port} in use — ${PORT_ROLES[port] ?? 'not a project port'}`);
    } else {
      console.log(`• ${port} not probed (${result})`);
    }
  }

  const shadowed = busy.filter((p) => disallowed.includes(p));
  if (shadowed.length > 0) {
    console.error(
      `\n❌ Port(s) ${shadowed.join(', ')} are in use. These are the PRODUCTION host\n` +
        `   bindings (3001 → frontend, 3004 → backend is 4004 in prod; see\n` +
        `   PORT-REFERENCE.md). A local listener on them masks a real conflict —\n` +
        `   free them or stop the stray process.\n`
    );
    return 1;
  }

  if (busy.length > 0) {
    console.warn(
      `\n⚠️  Port(s) ${busy.join(', ')} already in use. If the stack is already\n` +
        `   running that is fine; otherwise something else holds the port and\n` +
        `   the app may fail to bind. Check: netstat -ano | findstr :${busy[0]}\n`
    );
  }

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`Port validation failed: ${err.message}`);
    process.exit(1);
  });
