// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Gettext } from './gettext';
import { TranslatorConnector } from './tokens';
import { normalizeDomain } from './utils';
/**
 * Translation Manager
 */
export class TranslationManager {
    constructor(translationsUrl = '', stringsPrefix, serverSettings) {
        this._domainData = {};
        this._translationBundles = {};
        this._connector = new TranslatorConnector(translationsUrl, serverSettings);
        this._stringsPrefix = stringsPrefix || '';
        this._englishBundle = new Gettext({ stringsPrefix: this._stringsPrefix });
    }
    /**
     * Fetch the localization data from the server.
     *
     * @param locale The language locale to use for translations.
     */
    async fetch(locale) {
        var _a, _b;
        this._currentLocale = locale;
        this._languageData = await this._connector.fetch({ language: locale });
        this._domainData = ((_a = this._languageData) === null || _a === void 0 ? void 0 : _a.data) || {};
        const message = (_b = this._languageData) === null || _b === void 0 ? void 0 : _b.message;
        if (message && locale !== 'en') {
            console.warn(message);
        }
    }
    /**
     * Load translation bundles for a given domain.
     *
     * @param domain The translation domain to use for translations.
     */
    load(domain) {
        if (this._domainData) {
            if (this._currentLocale == 'en') {
                return this._englishBundle;
            }
            else {
                domain = normalizeDomain(domain);
                if (!(domain in this._translationBundles)) {
                    let translationBundle = new Gettext({
                        domain: domain,
                        locale: this._currentLocale,
                        stringsPrefix: this._stringsPrefix
                    });
                    if (domain in this._domainData) {
                        let metadata = this._domainData[domain][''];
                        if ('plural_forms' in metadata) {
                            metadata.pluralForms = metadata.plural_forms;
                            delete metadata.plural_forms;
                            this._domainData[domain][''] = metadata;
                        }
                        translationBundle.loadJSON(this._domainData[domain], domain);
                    }
                    this._translationBundles[domain] = translationBundle;
                }
                return this._translationBundles[domain];
            }
        }
        else {
            return this._englishBundle;
        }
    }
}
//# sourceMappingURL=manager.js.map