import { HEX32, FORMS, satoshiText, noteCmText, nonempty, unit, descriptor } from './shared.js';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { NEURAI_PYTHON_CLI_MODULE, NEURAI_PYTHON_PROGRESS_PREFIX } from './protocol-constants.js';

function resultObject(text, command) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0 || !lines.at(-1)) {
    throw new Error('wallet CLI returned no JSON result');
  }
  const result = JSON.parse(lines.at(-1));
  if (!result || typeof result !== 'object' ||
      (command !== 'recipient' && result.test_only !== true)) {
    throw new Error('wallet CLI returned an invalid TEST result');
  }
  return result;
}

/**
 * Adapter to the Neurai Python TEST wallet. It never puts a wallet
 * password on argv or in environment variables. The prover and transparent
 * node wallet remain separate from the shielded encrypted vault.
 */
export class CliTestBackend {
  constructor(options) {
    if (!options || typeof options.getPassword !== 'function') {
      throw new TypeError('getPassword callback is required');
    }
    this.python = nonempty(options.python ?? 'python3', 'python');
    this.requiresBlockVerification = true;
    this.profile = options.profile ?? 'rwax';
    if (!['rwax', 'xna'].includes(this.profile)) throw new TypeError('invalid TEST profile');
    this.manifestSha256 = options.manifestSha256;
    if (this.profile === 'xna' && !HEX32.test(this.manifestSha256)) {
      throw new TypeError('XNA profile requires pinned manifestSha256');
    }
    this.repository = resolve(nonempty(options.repository, 'repository'));
    this.wallet = resolve(nonempty(options.wallet, 'wallet'));
    this.artifacts = resolve(nonempty(options.artifacts, 'artifacts'));
    this.node = nonempty(options.node, 'node');
    this.source = options.source ? resolve(options.source) : undefined;
    this.proverCode = options.proverCode ? resolve(options.proverCode) : undefined;
    this.getPassword = options.getPassword;
    this.environment = { ...options.environment };
    this.timeoutMs = options.timeoutMs ?? 3_600_000;
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new RangeError('invalid timeoutMs');
    }
  }

  async #run(command, arguments_, onProgress) {
    const supplied = await this.getPassword();
    if (!(typeof supplied === 'string' || Buffer.isBuffer(supplied))) {
      throw new TypeError('getPassword must return a string or Buffer');
    }
    const password = Buffer.from(supplied);
    if (password.length < 12 || password.length > 4096 ||
        password.includes(10) || password.includes(13)) {
      password.fill(0);
      throw new RangeError('wallet password must contain 12-4096 bytes, without newline');
    }
    const input = Buffer.concat([password, Buffer.from('\n')]);
    password.fill(0);
    const argv = ['-m', NEURAI_PYTHON_CLI_MODULE, command,
      '--wallet', this.wallet, '--password-fd', '0',
      '--profile', this.profile,
      ...(this.profile === 'xna' && !['init', 'backup', 'restore'].includes(command)
        ? ['--manifest-sha256', this.manifestSha256] : []),
      ...arguments_];
    try {
      return await new Promise((resolveResult, rejectResult) => {
        const child = spawn(this.python, argv, {
          cwd: this.repository,
          env: { ...process.env, ...this.environment },
          stdio: ['pipe', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        let progressBuffer = '';
        let settled = false;
        const fail = (error) => {
          if (!settled) {
            settled = true;
            rejectResult(error);
          }
        };
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          fail(new Error('wallet CLI timed out'));
        }, this.timeoutMs);
        child.stdout.on('data', (chunk) => {
          stdout += chunk.toString();
          if (stdout.length > 1_000_000) {
            child.kill('SIGKILL');
            fail(new Error('wallet CLI output limit exceeded'));
          }
        });
        child.stderr.on('data', (chunk) => {
          const value = chunk.toString();
          stderr += value;
          progressBuffer += value;
          let end;
          while ((end = progressBuffer.indexOf('\n')) !== -1) {
            const line = progressBuffer.slice(0, end).trim();
            progressBuffer = progressBuffer.slice(end + 1);
            if (line.startsWith(NEURAI_PYTHON_PROGRESS_PREFIX) && typeof onProgress === 'function') {
              try { onProgress({ stage: line.slice(NEURAI_PYTHON_PROGRESS_PREFIX.length) }); } catch { /* observer only */ }
            }
          }
          if (stderr.length > 1_000_000) {
            child.kill('SIGKILL');
            fail(new Error('wallet CLI error output limit exceeded'));
          }
        });
        child.on('error', fail);
        child.on('close', (code) => {
          clearTimeout(timer);
          if (settled) return;
          if (code !== 0) {
            fail(new Error('wallet CLI failed: ' + stderr.trim().slice(-1200)));
            return;
          }
          try {
            const parsed = resultObject(stdout, command);
            settled = true;
            resolveResult(parsed);
          } catch (error) {
            fail(error);
          }
        });
        child.stdin.on('error', fail);
        child.stdin.end(input, () => input.fill(0));
      });
    } finally {
      input.fill(0);
    }
  }

  init() {
    return this.#run('init', []);
  }

  backup(file) {
    return this.#run('backup', ['--file', resolve(nonempty(file, 'backup file'))]);
  }

  restore(file) {
    return this.#run('restore', ['--file', resolve(nonempty(file, 'backup file'))]);
  }

  funding({ amountSats, feeSats = 10_000_000, create = false } = {}) {
    if (this.profile !== 'xna') throw new Error('funding helper is for XNA TEST only');
    if (!Number.isSafeInteger(feeSats) || feeSats < 1 || feeSats > 10_000_000) {
      throw new RangeError('invalid TEST feeSats');
    }
    return this.#run('funding', [
      '--artifacts', this.artifacts, '--node', this.node,
      '--amount-sats', satoshiText(amountSats, 'amountSats'),
      '--fee-sats', String(feeSats), ...(create ? ['--create'] : [])
    ]);
  }

  recipient() {
    return this.#run('recipient', [
      '--artifacts', this.artifacts, '--node', this.node
    ]).then(descriptor);
  }

  scan({ fromHeight = 1, toHeight } = {}) {
    if (!Number.isSafeInteger(fromHeight) || fromHeight < 1) {
      throw new RangeError('fromHeight must be a positive safe integer');
    }
    if (toHeight !== undefined &&
        (!Number.isSafeInteger(toHeight) || toHeight < fromHeight)) {
      throw new RangeError('invalid toHeight');
    }
    const args = ['--artifacts', this.artifacts, '--node', this.node,
      '--from-height', String(fromHeight)];
    if (toHeight !== undefined) args.push('--to-height', String(toHeight));
    return this.#run('scan', args);
  }

  async transact({ kind, amountUnits, amountSats, splitSats, noteCm,
                   recipients = [], recipient, broadcast = false, mine = false, feeSats, onProgress } = {}) {
    if (!['deposit', 'transfer', 'withdraw'].includes(kind)) {
      throw new TypeError('kind must be deposit, transfer or withdraw');
    }
    if (mine && !broadcast) {
      throw new RangeError('mine requires broadcast');
    }
    if (!this.source || !this.proverCode) {
      throw new Error('source and proverCode are needed for proof generation');
    }
    if (feeSats !== undefined &&
        (!Number.isSafeInteger(feeSats) || feeSats < 1 || feeSats > 10_000_000)) {
      throw new RangeError('feeSats must be between 1 and 10000000');
    }
    if (kind === 'deposit') {
      if (this.profile === 'xna') {
        if (amountUnits !== undefined) throw new TypeError('XNA uses amountSats');
        satoshiText(amountSats, 'amountSats');
      } else {
        if (amountSats !== undefined) throw new TypeError('RWAX uses amountUnits');
        unit(amountUnits);
      }
    } else if (amountUnits !== undefined || amountSats !== undefined) {
      throw new TypeError('amount is only for deposit');
    }
    if (kind === 'transfer' &&
        (!Array.isArray(recipients) || ![1, 2].includes(recipients.length))) {
      throw new RangeError('TEST transfer needs one or two shielded recipients');
    }
    if (this.profile === 'xna' && kind === 'transfer' &&
        (!Array.isArray(splitSats) || splitSats.length !== recipients.length)) {
      throw new RangeError('XNA transfer needs one splitSats value per recipient');
    }
    if (this.profile === 'rwax' && splitSats !== undefined) {
      throw new TypeError('splitSats only applies to XNA');
    }
    if (kind !== 'transfer' && splitSats !== undefined) {
      throw new TypeError('splitSats only applies to transfer');
    }
    if (kind !== 'transfer' && recipients.length !== 0) {
      throw new TypeError('recipients are only for transfer');
    }
    if (kind !== 'withdraw' && recipient !== undefined) {
      throw new TypeError('transparent recipient is only for withdraw');
    }
    const args = ['--artifacts', this.artifacts, '--node', this.node,
      '--source', this.source, '--prover-code', this.proverCode,
      '--kind', kind];
    if (kind === 'deposit') {
      if (this.profile === 'xna') args.push('--amount-sats', satoshiText(amountSats, 'amountSats'));
      else args.push('--amount-units', String(amountUnits));
    }
    if (kind === 'transfer' && this.profile === 'xna') {
      for (const amount of splitSats) args.push('--split-sats', satoshiText(amount, 'splitSats'));
    }
    if (noteCm !== undefined) args.push('--note-cm', noteCmText(noteCm));
    if (recipient !== undefined) args.push('--recipient', nonempty(recipient, 'recipient'));
    if (feeSats !== undefined) args.push('--fee-sats', String(feeSats));
    if (broadcast) args.push('--broadcast');
    if (mine) args.push('--mine');

    let folder;
    try {
      if (kind === 'transfer') {
        folder = await mkdtemp(join(tmpdir(), 'neurai-privacy-'));
        for (let i = 0; i < recipients.length; i++) {
          const path = join(folder, 'recipient-' + i + '.json');
          await writeFile(path, JSON.stringify(descriptor(recipients[i])), { mode: 0o600 });
          args.push('--shield-recipient', path);
        }
      }
      const result = await this.#run('transact', args, onProgress);
      if (!FORMS.has(result.form) || !HEX32.test(result.txid)) {
        throw new Error('wallet CLI returned an invalid transaction result');
      }
      return result;
    } finally {
      if (folder) await rm(folder, { recursive: true, force: true });
    }
  }
}
