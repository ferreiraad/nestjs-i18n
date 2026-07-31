import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { I18nJsonMultiPathLoader } from '../src';

describe('I18nJsonMultiPathLoader', () => {
  let fixtureRoot: string;

  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nestjs-i18n-'));
  });

  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it('merges translations and lets later paths override earlier values', async () => {
    const commonPath = path.join(fixtureRoot, 'common');
    const servicePath = path.join(fixtureRoot, 'service');

    fs.mkdirSync(path.join(commonPath, 'en'), { recursive: true });
    fs.mkdirSync(path.join(servicePath, 'en'), { recursive: true });
    fs.mkdirSync(path.join(servicePath, 'pt'), { recursive: true });
    fs.writeFileSync(
      path.join(commonPath, 'en', 'messages.json'),
      JSON.stringify({ greeting: 'Hello', shared: 'common' }),
    );
    fs.writeFileSync(
      path.join(servicePath, 'en', 'messages.json'),
      JSON.stringify({ shared: 'service' }),
    );
    fs.writeFileSync(
      path.join(servicePath, 'pt', 'messages.json'),
      JSON.stringify({ greeting: 'Olá' }),
    );

    const loader = new I18nJsonMultiPathLoader({
      paths: [commonPath, servicePath],
    });

    await expect(loader.languages()).resolves.toEqual(['en', 'pt']);
    await expect(loader.load()).resolves.toEqual({
      en: { messages: { greeting: 'Hello', shared: 'service' } },
      pt: { messages: { greeting: 'Olá' } },
    });
  });
});
