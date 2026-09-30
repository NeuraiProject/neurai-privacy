import privacy = require('@neuraiproject/neurai-privacy');

const digest: Uint8Array = privacy.poseidonBytes(new Uint8Array());
const backend: typeof privacy.CliTestBackend = privacy.CliTestBackend;
void [digest, backend];
