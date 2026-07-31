import { Inject, OnModuleDestroy } from '@nestjs/common';
import { I18nLoader } from './i18n.loader';
import { I18N_LOADER_OPTIONS } from '../i18n.constants';
import { I18nTranslation } from '../interfaces';
import {
  Observable,
  Subject,
  merge as ObservableMerge,
  of as ObservableOf,
  switchMap,
} from 'rxjs';
import * as chokidar from 'chokidar';
import * as path from 'path';

export interface I18nMultiPathLoaderOptions {
  paths: string[];
  watch?: boolean;
}

export abstract class I18nMultiPathLoader
  extends I18nLoader
  implements OnModuleDestroy
{
  private watcher?: chokidar.FSWatcher;
  private events = new Subject<void>();

  constructor(
    @Inject(I18N_LOADER_OPTIONS)
    protected options: I18nMultiPathLoaderOptions,
  ) {
    super();

    if (this.options.watch) {
      this.watcher = chokidar
        .watch(this.options.paths, { ignoreInitial: true })
        .on('all', () => this.events.next());
    }
  }

  async onModuleDestroy() {
    await this.watcher?.close();
  }

  async load(): Promise<I18nTranslation | Observable<I18nTranslation>> {
    if (this.options.watch) {
      return ObservableMerge(
        ObservableOf(await this.loadAll()),
        this.events.pipe(switchMap(() => this.loadAll())),
      );
    }
    return this.loadAll();
  }

  async languages(): Promise<string[] | Observable<string[]>> {
    const langs = await this.collectLanguages();

    if (this.options.watch) {
      return ObservableMerge(
        ObservableOf(langs),
        this.events.pipe(switchMap(() => this.collectLanguages())),
      );
    }

    return langs;
  }

  protected async loadAll(): Promise<I18nTranslation> {
    const result: I18nTranslation = {};

    for (const p of this.options.paths) {
      const partial = await this.loadFromPath(this.normalizePath(p));
      this.deepMerge(result, partial);
    }

    return result;
  }

  protected normalizePath(p: string): string {
    return path.normalize(p.endsWith(path.sep) ? p : p + path.sep);
  }

  protected deepMerge(target: any, source: any) {
    for (const key of Object.keys(source)) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] ??= {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  protected abstract loadFromPath(path: string): Promise<I18nTranslation>;

  protected abstract collectLanguages(): Promise<string[]>;
}
