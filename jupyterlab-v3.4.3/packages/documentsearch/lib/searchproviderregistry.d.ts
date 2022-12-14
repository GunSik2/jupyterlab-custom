import { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { ISearchProvider, ISearchProviderConstructor } from './interfaces';
import { ISearchProviderRegistry } from './tokens';
export declare class SearchProviderRegistry implements ISearchProviderRegistry {
    /**
     * Add a provider to the registry.
     *
     * @param key - The provider key.
     * @returns A disposable delegate that, when disposed, deregisters the given search provider
     */
    register<T extends Widget = Widget>(key: string, provider: ISearchProviderConstructor<T>): IDisposable;
    /**
     * Returns a matching provider for the widget.
     *
     * @param widget - The widget to search over.
     * @returns the search provider, or undefined if none exists.
     */
    getProviderForWidget<T extends Widget = Widget>(widget: T): ISearchProvider<T> | undefined;
    /**
     * Signal that emits when a new search provider has been registered
     * or removed.
     */
    get changed(): ISignal<this, void>;
    private _findMatchingProvider;
    private _changed;
    private _providerMap;
}
