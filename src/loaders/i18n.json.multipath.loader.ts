import { I18nJsonLoader } from './i18n.json.loader';
import {
  I18nMultiPathLoader,
  I18nMultiPathLoaderOptions,
} from './i18n.multipath.loader';
import * as path from 'path';

export class I18nJsonMultiPathLoader extends I18nMultiPathLoader {
  private delegate: I18nJsonLoader;

  constructor(options: I18nMultiPathLoaderOptions & any) {
    super(options);

    this.delegate = new I18nJsonLoader({
      ...options,
      path: '',
    });
  }

  protected async loadFromPath(p: string) {
    (this.delegate as any).options.path = p;
    return this.delegate.load() as Promise<any>;
  }

  protected async collectLanguages(): Promise<string[]> {
    const sets = await Promise.all(
      this.options.paths.map(async (p) => {
        (this.delegate as any).options.path = path.normalize(p + path.sep);
        return this.delegate.languages() as Promise<string[]>;
      }),
    );

    return [...new Set(sets.flat())];
  }
}
