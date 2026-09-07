#!/usr/bin/env node
/** Codemagic: ensure REMOTE_URL is unset so capacitor.config.ts omits server.url */
delete process.env.REMOTE_URL;
console.log('REMOTE_URL cleared — load capacitor.config.ts with server.url omitted (bundled www/)');
console.log('www/ should already contain a sync of preview/brain-kit/.');
