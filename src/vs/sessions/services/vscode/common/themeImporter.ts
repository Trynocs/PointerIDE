/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

/** The Pointer configuration key for the active color theme. */
export const COLOR_THEME_SETTINGS_ID = 'workbench.colorTheme';

export const IThemeImporterService = createDecorator<IThemeImporterService>('IThemeImporterService');

/**
 * Service that reads the parent Pointer installation's active color theme
 * and can import it into the Agents app — using the providing extension
 * from the parent Pointer installation if necessary.
 */
export interface IThemeImporterService {

	readonly _serviceBrand: undefined;

	/**
	 * Resolves the parent Pointer's active color theme. Returns `undefined`
	 * when the parent settings cannot be read or the theme is already one of
	 * the onboarding themes displayed in the theme picker.
	 */
	getVSCodeTheme(): Promise<string | undefined>;

	/**
	 * Temporarily installs the providing extension from the host's extensions
	 * directory and applies the Pointer theme. Returns an `IDisposable` that
	 * uninstalls the extension on dispose. Returns `undefined` if the theme
	 * is already available or cannot be resolved.
	 */
	previewVSCodeTheme(): Promise<IDisposable>;

	/**
	 * Permanently imports the Pointer theme into the Agents app by copying
	 * the providing extension into the Agents app's extensions directory
	 * and installing it from there.
	 */
	importVSCodeTheme(): Promise<void>;
}
