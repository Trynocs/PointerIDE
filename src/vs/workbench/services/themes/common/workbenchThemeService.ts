/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { refineServiceDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Event } from '../../../../base/common/event.js';
import { Color } from '../../../../base/common/color.js';
import { IColorTheme, IThemeService, IFileIconTheme, IProductIconTheme } from '../../../../platform/theme/common/themeService.js';
import { ConfigurationTarget } from '../../../../platform/configuration/common/configuration.js';
import { isBoolean, isString } from '../../../../base/common/types.js';
import { IconContribution, IconDefinition } from '../../../../platform/theme/common/iconRegistry.js';
import { ColorScheme, ThemeTypeSelector } from '../../../../platform/theme/common/theme.js';

export const IWorkbenchThemeService = refineServiceDecorator<IThemeService, IWorkbenchThemeService>(IThemeService);

export const THEME_SCOPE_OPEN_PAREN = '[';
export const THEME_SCOPE_CLOSE_PAREN = ']';
export const THEME_SCOPE_WILDCARD = '*';

export const themeScopeRegex = /\[(.+?)\]/g;

export enum ThemeSettings {
	COLOR_THEME = 'workbench.colorTheme',
	FILE_ICON_THEME = 'workbench.iconTheme',
	PRODUCT_ICON_THEME = 'workbench.productIconTheme',
	COLOR_CUSTOMIZATIONS = 'workbench.colorCustomizations',
	TOKEN_COLOR_CUSTOMIZATIONS = 'editor.tokenColorCustomizations',
	SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS = 'editor.semanticTokenColorCustomizations',

	PREFERRED_DARK_THEME = 'workbench.preferredDarkColorTheme',
	PREFERRED_LIGHT_THEME = 'workbench.preferredLightColorTheme',
	PREFERRED_HC_DARK_THEME = 'workbench.preferredHighContrastColorTheme', /* id kept for compatibility reasons */
	PREFERRED_HC_LIGHT_THEME = 'workbench.preferredHighContrastLightColorTheme',
	DETECT_COLOR_SCHEME = 'window.autoDetectColorScheme',
	DETECT_HC = 'window.autoDetectHighContrast',

	SYSTEM_COLOR_THEME = 'window.systemColorTheme'
}

export namespace ThemeSettingDefaults {
	export const COLOR_THEME_DARK = 'Pointer Dark';
	export const COLOR_THEME_LIGHT = 'Pointer Light';
	export const COLOR_THEME_HC_DARK = 'Default High Contrast';
	export const COLOR_THEME_HC_LIGHT = 'Default High Contrast Light';

	export const FILE_ICON_THEME = 'vs-seti';
	export const PRODUCT_ICON_THEME = 'Default';
}

/**
 * Migrates legacy theme settings IDs to their current equivalents.
 * Theme IDs were simplified: "Default" prefix was removed from built-in themes,
 * and "Experimental" prefix was replaced when Pointer themes became GA.
 */
export function migrateThemeSettingsId(settingsId: string): string {
	switch (settingsId) {
		case 'Default Dark Modern': return 'Dark Modern';
		case 'Default Light Modern': return 'Light Modern';
		case 'Default Dark+': return 'Dark+';
		case 'Default Light+': return 'Light+';
		case 'Experimental Dark':
		case 'Pointer Dark':
			return ThemeSettingDefaults.COLOR_THEME_DARK;
		case 'Experimental Light':
		case 'Pointer Light':
			return ThemeSettingDefaults.COLOR_THEME_LIGHT;
	}
	return settingsId;
}

export const COLOR_THEME_DARK_INITIAL_COLORS = {
	'actionBar.toggledBackground': '#383838',
	'activityBar.activeBorder': '#F0F0F0',
	'activityBar.background': '#181818',
	'activityBar.border': '#282828',
	'activityBar.foreground': '#F0F0F0',
	'activityBar.inactiveForeground': '#484848',
	'activityBarBadge.background': '#F0F0F0',
	'activityBarBadge.foreground': '#101010',
	'badge.background': '#F0F0F0',
	'badge.foreground': '#101010',
	'button.background': '#F0F0F0',
	'button.border': '#FFFFFF12',
	'button.foreground': '#101010',
	'button.hoverBackground': '#FFFFFF',
	'button.secondaryBackground': '#303030',
	'button.secondaryForeground': '#F0F0F0',
	'button.secondaryHoverBackground': '#383838',
	'chat.slashCommandBackground': '#48484866',
	'chat.slashCommandForeground': '#D8D8D8',
	'chat.editedFileForeground': '#D8D8D8',
	'checkbox.background': '#303030',
	'checkbox.border': '#383838',
	'debugToolBar.background': '#181818',
	'descriptionForeground': '#D8D8D8',
	'dropdown.background': '#303030',
	'dropdown.border': '#383838',
	'dropdown.foreground': '#D8D8D8',
	'dropdown.listBackground': '#202020',
	'editor.background': '#101010',
	'editor.findMatchBackground': '#484848',
	'editor.foreground': '#E8E8E8',
	'editor.inactiveSelectionBackground': '#40404060',
	'editor.selectionHighlightBackground': '#40404060',
	'editorGroup.border': '#FFFFFF17',
	'editorGroupHeader.tabsBackground': '#181818',
	'editorGroupHeader.tabsBorder': '#282828',
	'editorGutter.addedBackground': '#484848',
	'editorGutter.deletedBackground': '#484848',
	'editorGutter.modifiedBackground': '#E0E0E0',
	'editorIndentGuide.activeBackground1': '#484848',
	'editorIndentGuide.background1': '#404040',
	'editorLineNumber.activeForeground': '#FFFFFF',
	'editorLineNumber.foreground': '#D8D8D8',
	'editorOverviewRuler.border': '#101010',
	'editorWidget.background': '#202020',
	'errorForeground': '#484848',
	'focusBorder': '#F0F0F0B3',
	'foreground': '#D8D8D8',
	'icon.foreground': '#D8D8D8',
	'input.background': '#303030',
	'input.border': '#383838',
	'input.foreground': '#D8D8D8',
	'input.placeholderForeground': '#D8D8D8',
	'inputOption.activeBackground': '#48484882',
	'inputOption.activeBorder': '#484848',
	'keybindingLabel.foreground': '#D8D8D8',
	'list.activeSelectionIconForeground': '#FFF',
	'list.dropBackground': '#383838',
	'menu.background': '#202020',
	'menu.border': '#484848',
	'menu.foreground': '#D8D8D8',
	'menu.selectionBackground': '#484848',
	'menu.separatorBackground': '#484848',
	'notificationCenterHeader.background': '#202020',
	'notificationCenterHeader.foreground': '#D8D8D8',
	'notifications.background': '#202020',
	'notifications.border': '#282828',
	'notifications.foreground': '#D8D8D8',
	'panel.background': '#181818',
	'panel.border': '#282828',
	'panelInput.border': '#282828',
	'panelTitle.activeBorder': '#484848',
	'panelTitle.activeForeground': '#D8D8D8',
	'panelTitle.inactiveForeground': '#D8D8D8',
	'peekViewEditor.background': '#202020',
	'peekViewEditor.matchHighlightBackground': '#48484866',
	'peekViewResult.background': '#202020',
	'peekViewResult.matchHighlightBackground': '#48484866',
	'pickerGroup.border': '#383838',
	'ports.iconRunningProcessForeground': '#484848',
	'progressBar.background': '#484848',
	'quickInput.background': '#202020',
	'quickInput.foreground': '#D8D8D8',
	'settings.dropdownBackground': '#303030',
	'settings.dropdownBorder': '#383838',
	'settings.headerForeground': '#FFFFFF',
	'settings.modifiedItemIndicator': '#48484866',
	'sideBar.background': '#181818',
	'sideBar.border': '#303030',
	'sideBar.foreground': '#E8E8E8',
	'sideBarSectionHeader.background': '#181818',
	'sideBarSectionHeader.border': '#282828',
	'sideBarSectionHeader.foreground': '#D8D8D8',
	'sideBarTitle.foreground': '#D8D8D8',
	'statusBar.background': '#181818',
	'statusBar.border': '#282828',
	'statusBar.debuggingBackground': '#484848',
	'statusBar.debuggingForeground': '#FFFFFF',
	'statusBar.focusBorder': '#484848',
	'statusBar.foreground': '#F0F0F0',
	'statusBar.noFolderBackground': '#202020',
	'statusBarItem.focusBorder': '#484848',
	'statusBarItem.prominentBackground': '#48484866',
	'statusBarItem.remoteBackground': '#F0F0F0',
	'statusBarItem.remoteForeground': '#101010',
	'tab.activeBackground': '#202020',
	'tab.activeBorder': '#202020',
	'tab.activeBorderTop': '#484848',
	'tab.activeForeground': '#FFFFFF',
	'tab.border': '#282828',
	'tab.hoverBackground': '#202020',
	'tab.inactiveBackground': '#181818',
	'tab.inactiveForeground': '#D8D8D8',
	'tab.lastPinnedBorder': '#ccc3',
	'tab.selectedBackground': '#202020',
	'tab.selectedBorderTop': '#D8D8D8',
	'tab.selectedForeground': '#FFFFFFA0',
	'tab.unfocusedActiveBorder': '#202020',
	'tab.unfocusedActiveBorderTop': '#282828',
	'tab.unfocusedHoverBackground': '#202020',
	'terminal.foreground': '#D8D8D8',
	'terminal.inactiveSelectionBackground': '#404040',
	'terminal.tab.activeBorder': '#484848',
	'textBlockQuote.background': '#282828',
	'textBlockQuote.border': '#484848',
	'textCodeBlock.background': '#282828',
	'textLink.activeForeground': '#D8D8D8',
	'textLink.foreground': '#D8D8D8',
	'textPreformat.background': '#383838',
	'textPreformat.foreground': '#D8D8D8',
	'textSeparator.foreground': '#282828',
	'titleBar.activeBackground': '#181818',
	'titleBar.activeForeground': '#F0F0F0',
	'titleBar.border': '#282828',
	'titleBar.inactiveBackground': '#181818',
	'titleBar.inactiveForeground': '#D8D8D8',
	'welcomePage.progress.foreground': '#484848',
	'welcomePage.tileBackground': '#282828',
	'widget.border': '#303030'
};

export const COLOR_THEME_LIGHT_INITIAL_COLORS = {
	'actionBar.toggledBackground': '#E0E0E0',
	'activityBar.activeBorder': '#202020',
	'activityBar.background': '#F8F8F8',
	'activityBar.border': '#E8E8E8',
	'activityBar.foreground': '#202020',
	'activityBar.inactiveForeground': '#484848',
	'activityBarBadge.background': '#202020',
	'activityBarBadge.foreground': '#FFFFFF',
	'badge.background': '#202020',
	'badge.foreground': '#FFFFFF',
	'button.background': '#202020',
	'button.border': '#1010101A',
	'button.foreground': '#FFFFFF',
	'button.hoverBackground': '#303030',
	'button.secondaryBackground': '#E8E8E8',
	'button.secondaryForeground': '#202020',
	'button.secondaryHoverBackground': '#D8D8D8',
	'chat.slashCommandBackground': '#D8D8D87A',
	'chat.slashCommandForeground': '#484848',
	'chat.editedFileForeground': '#484848',
	'checkbox.background': '#F8F8F8',
	'checkbox.border': '#D8D8D8',
	'descriptionForeground': '#383838',
	'diffEditor.unchangedRegionBackground': '#F8F8F8',
	'dropdown.background': '#FFFFFF',
	'dropdown.border': '#D8D8D8',
	'dropdown.foreground': '#383838',
	'dropdown.listBackground': '#FFFFFF',
	'editor.background': '#FFFFFF',
	'editor.foreground': '#202020',
	'editor.inactiveSelectionBackground': '#2020201A',
	'editor.selectionHighlightBackground': '#2020201A',
	'editorGroup.border': '#E8E8E8',
	'editorGroupHeader.tabsBackground': '#F8F8F8',
	'editorGroupHeader.tabsBorder': '#E8E8E8',
	'editorGutter.addedBackground': '#484848',
	'editorGutter.deletedBackground': '#484848',
	'editorGutter.modifiedBackground': '#484848',
	'editorIndentGuide.activeBackground1': '#D8D8D8',
	'editorIndentGuide.background1': '#D8D8D8',
	'editorLineNumber.activeForeground': '#101010',
	'editorLineNumber.foreground': '#484848',
	'editorOverviewRuler.border': '#E8E8E8',
	'editorSuggestWidget.background': '#F8F8F8',
	'editorWidget.background': '#F8F8F8',
	'errorForeground': '#484848',
	'focusBorder': '#202020',
	'foreground': '#202020',
	'icon.foreground': '#383838',
	'input.background': '#FFFFFF',
	'input.border': '#D8D8D8',
	'input.foreground': '#383838',
	'input.placeholderForeground': '#484848',
	'inputOption.activeBackground': '#D8D8D8',
	'inputOption.activeBorder': '#484848',
	'inputOption.activeForeground': '#101010',
	'keybindingLabel.foreground': '#383838',
	'list.activeSelectionBackground': '#2020201A',
	'list.activeSelectionForeground': '#101010',
	'list.activeSelectionIconForeground': '#101010',
	'list.focusAndSelectionOutline': '#484848',
	'list.hoverBackground': '#F0F0F0',
	'menu.border': '#D8D8D8',
	'menu.selectionBackground': '#484848',
	'menu.selectionForeground': '#FFFFFF',
	'notebook.cellBorderColor': '#E8E8E8',
	'notebook.selectedCellBackground': '#D8D8D850',
	'notificationCenterHeader.background': '#FFFFFF',
	'notificationCenterHeader.foreground': '#383838',
	'notifications.background': '#FFFFFF',
	'notifications.border': '#E8E8E8',
	'notifications.foreground': '#383838',
	'panel.background': '#F8F8F8',
	'panel.border': '#E8E8E8',
	'panelInput.border': '#E8E8E8',
	'panelTitle.activeBorder': '#484848',
	'panelTitle.activeForeground': '#383838',
	'panelTitle.inactiveForeground': '#383838',
	'peekViewEditor.matchHighlightBackground': '#48484866',
	'peekViewResult.background': '#FFFFFF',
	'peekViewResult.matchHighlightBackground': '#48484866',
	'pickerGroup.border': '#E8E8E8',
	'pickerGroup.foreground': '#D8D8D8',
	'ports.iconRunningProcessForeground': '#484848',
	'progressBar.background': '#484848',
	'quickInput.background': '#F8F8F8',
	'quickInput.foreground': '#383838',
	'searchEditor.textInputBorder': '#D8D8D8',
	'settings.dropdownBackground': '#FFFFFF',
	'settings.dropdownBorder': '#D8D8D8',
	'settings.headerForeground': '#202020',
	'settings.modifiedItemIndicator': '#48484866',
	'settings.numberInputBorder': '#D8D8D8',
	'settings.textInputBorder': '#D8D8D8',
	'sideBar.background': '#F8F8F8',
	'sideBar.border': '#E0E0E0',
	'sideBar.foreground': '#202020',
	'sideBarSectionHeader.background': '#F8F8F8',
	'sideBarSectionHeader.border': '#E8E8E8',
	'sideBarSectionHeader.foreground': '#383838',
	'sideBarTitle.foreground': '#383838',
	'statusBar.background': '#F8F8F8',
	'statusBar.border': '#E8E8E8',
	'statusBar.debuggingBackground': '#484848',
	'statusBar.debuggingForeground': '#101010',
	'statusBar.focusBorder': '#484848',
	'statusBar.foreground': '#202020',
	'statusBar.noFolderBackground': '#F8F8F8',
	'statusBarItem.compactHoverBackground': '#D8D8D8',
	'statusBarItem.errorBackground': '#484848',
	'statusBarItem.focusBorder': '#484848',
	'statusBarItem.hoverBackground': '#D8D8D850',
	'statusBarItem.prominentBackground': '#48484866',
	'statusBarItem.remoteBackground': '#202020',
	'statusBarItem.remoteForeground': '#FFFFFF',
	'tab.activeBackground': '#FFFFFF',
	'tab.activeBorder': '#F8F8F8',
	'tab.activeBorderTop': '#484848',
	'tab.activeForeground': '#383838',
	'tab.border': '#E8E8E8',
	'tab.hoverBackground': '#FFFFFF',
	'tab.inactiveBackground': '#F8F8F8',
	'tab.inactiveForeground': '#484848',
	'tab.lastPinnedBorder': '#D8D8D8',
	'tab.selectedBackground': '#FFFFFFA5',
	'tab.selectedBorderTop': '#D8D8D8',
	'tab.selectedForeground': '#303030B3',
	'tab.unfocusedActiveBorder': '#F8F8F8',
	'tab.unfocusedActiveBorderTop': '#E8E8E8',
	'tab.unfocusedHoverBackground': '#F8F8F8',
	'terminal.foreground': '#383838',
	'terminal.inactiveSelectionBackground': '#E8E8E8',
	'terminal.tab.activeBorder': '#484848',
	'terminalCursor.foreground': '#484848',
	'textBlockQuote.background': '#F8F8F8',
	'textBlockQuote.border': '#E8E8E8',
	'textCodeBlock.background': '#F8F8F8',
	'textLink.activeForeground': '#484848',
	'textLink.foreground': '#484848',
	'textPreformat.background': '#1010101F',
	'textPreformat.foreground': '#383838',
	'textSeparator.foreground': '#282828',
	'titleBar.activeBackground': '#F8F8F8',
	'titleBar.activeForeground': '#202020',
	'titleBar.border': '#E8E8E8',
	'titleBar.inactiveBackground': '#F8F8F8',
	'titleBar.inactiveForeground': '#484848',
	'welcomePage.tileBackground': '#F0F0F0',
	'widget.border': '#E8E8E8'
};

export interface IWorkbenchTheme {
	readonly id: string;
	readonly label: string;
	readonly extensionData?: ExtensionData;
	readonly description?: string;
	readonly settingsId: string | null;
}

export interface IWorkbenchColorTheme extends IWorkbenchTheme, IColorTheme {
	readonly settingsId: string;
	readonly tokenColors: ITextMateThemingRule[];
}

export interface IColorMap {
	[id: string]: Color;
}

export interface IWorkbenchFileIconTheme extends IWorkbenchTheme, IFileIconTheme {
}

export interface IWorkbenchProductIconTheme extends IWorkbenchTheme, IProductIconTheme {
	readonly settingsId: string;

	getIcon(icon: IconContribution): IconDefinition | undefined;
}

export type ThemeSettingTarget = ConfigurationTarget | undefined | 'auto' | 'preview';


export interface IWorkbenchThemeService extends IThemeService {
	readonly _serviceBrand: undefined;
	setColorTheme(themeId: string | undefined | IWorkbenchColorTheme, settingsTarget: ThemeSettingTarget): Promise<IWorkbenchColorTheme | null>;
	getColorTheme(): IWorkbenchColorTheme;
	getColorThemes(): Promise<IWorkbenchColorTheme[]>;
	getMarketplaceColorThemes(publisher: string, name: string, version: string): Promise<IWorkbenchColorTheme[]>;
	readonly onDidColorThemeChange: Event<IWorkbenchColorTheme>;

	getPreferredColorScheme(): ColorScheme | undefined;

	setFileIconTheme(iconThemeId: string | undefined | IWorkbenchFileIconTheme, settingsTarget: ThemeSettingTarget): Promise<IWorkbenchFileIconTheme>;
	getFileIconTheme(): IWorkbenchFileIconTheme;
	getFileIconThemes(): Promise<IWorkbenchFileIconTheme[]>;
	getMarketplaceFileIconThemes(publisher: string, name: string, version: string): Promise<IWorkbenchFileIconTheme[]>;
	readonly onDidFileIconThemeChange: Event<IWorkbenchFileIconTheme>;

	setProductIconTheme(iconThemeId: string | undefined | IWorkbenchProductIconTheme, settingsTarget: ThemeSettingTarget): Promise<IWorkbenchProductIconTheme>;
	getProductIconTheme(): IWorkbenchProductIconTheme;
	getProductIconThemes(): Promise<IWorkbenchProductIconTheme[]>;
	getMarketplaceProductIconThemes(publisher: string, name: string, version: string): Promise<IWorkbenchProductIconTheme[]>;
	readonly onDidProductIconThemeChange: Event<IWorkbenchProductIconTheme>;
}

export interface IThemeScopedColorCustomizations {
	[colorId: string]: string;
}

export interface IColorCustomizations {
	[colorIdOrThemeScope: string]: IThemeScopedColorCustomizations | string;
}

export interface IThemeScopedTokenColorCustomizations {
	[groupId: string]: ITextMateThemingRule[] | ITokenColorizationSetting | boolean | string | undefined;
	comments?: string | ITokenColorizationSetting;
	strings?: string | ITokenColorizationSetting;
	numbers?: string | ITokenColorizationSetting;
	keywords?: string | ITokenColorizationSetting;
	types?: string | ITokenColorizationSetting;
	functions?: string | ITokenColorizationSetting;
	variables?: string | ITokenColorizationSetting;
	textMateRules?: ITextMateThemingRule[];
	semanticHighlighting?: boolean; // deprecated, use ISemanticTokenColorCustomizations.enabled instead
}

export interface ITokenColorCustomizations {
	[groupIdOrThemeScope: string]: IThemeScopedTokenColorCustomizations | ITextMateThemingRule[] | ITokenColorizationSetting | boolean | string | undefined;
	comments?: string | ITokenColorizationSetting;
	strings?: string | ITokenColorizationSetting;
	numbers?: string | ITokenColorizationSetting;
	keywords?: string | ITokenColorizationSetting;
	types?: string | ITokenColorizationSetting;
	functions?: string | ITokenColorizationSetting;
	variables?: string | ITokenColorizationSetting;
	textMateRules?: ITextMateThemingRule[];
	semanticHighlighting?: boolean; // deprecated, use ISemanticTokenColorCustomizations.enabled instead
}

export interface IThemeScopedSemanticTokenColorCustomizations {
	[styleRule: string]: ISemanticTokenRules | boolean | undefined;
	enabled?: boolean;
	rules?: ISemanticTokenRules;
}

export interface ISemanticTokenColorCustomizations {
	[styleRuleOrThemeScope: string]: IThemeScopedSemanticTokenColorCustomizations | ISemanticTokenRules | boolean | undefined;
	enabled?: boolean;
	rules?: ISemanticTokenRules;
}

export interface IThemeScopedExperimentalSemanticTokenColorCustomizations {
	[themeScope: string]: ISemanticTokenRules | undefined;
}

export interface IExperimentalSemanticTokenColorCustomizations {
	[styleRuleOrThemeScope: string]: IThemeScopedExperimentalSemanticTokenColorCustomizations | ISemanticTokenRules | undefined;
}

export type IThemeScopedCustomizations =
	IThemeScopedColorCustomizations
	| IThemeScopedTokenColorCustomizations
	| IThemeScopedExperimentalSemanticTokenColorCustomizations
	| IThemeScopedSemanticTokenColorCustomizations;

export type IThemeScopableCustomizations =
	IColorCustomizations
	| ITokenColorCustomizations
	| IExperimentalSemanticTokenColorCustomizations
	| ISemanticTokenColorCustomizations;

export interface ISemanticTokenRules {
	[selector: string]: string | ISemanticTokenColorizationSetting | undefined;
}

export interface ITextMateThemingRule {
	name?: string;
	scope?: string | string[];
	settings: ITokenColorizationSetting;
}

export interface ITokenColorizationSetting {
	foreground?: string;
	background?: string;
	fontStyle?: string; /* [italic|bold|underline|strikethrough] */
	fontFamily?: string;
	fontSize?: number;
	lineHeight?: number;
}

export interface ISemanticTokenColorizationSetting {
	foreground?: string;
	fontStyle?: string; /* [italic|bold|underline|strikethrough] */
	bold?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	italic?: boolean;
}

export interface ExtensionData {
	extensionId: string;
	extensionPublisher: string;
	extensionName: string;
	extensionIsBuiltin: boolean;
}

export namespace ExtensionData {
	export function toJSONObject(d: ExtensionData | undefined): any {
		return d && { _extensionId: d.extensionId, _extensionIsBuiltin: d.extensionIsBuiltin, _extensionName: d.extensionName, _extensionPublisher: d.extensionPublisher };
	}
	export function fromJSONObject(o: any): ExtensionData | undefined {
		if (o && isString(o._extensionId) && isBoolean(o._extensionIsBuiltin) && isString(o._extensionName) && isString(o._extensionPublisher)) {
			return { extensionId: o._extensionId, extensionIsBuiltin: o._extensionIsBuiltin, extensionName: o._extensionName, extensionPublisher: o._extensionPublisher };
		}
		return undefined;
	}
	export function fromName(publisher: string, name: string, isBuiltin = false): ExtensionData {
		return { extensionPublisher: publisher, extensionId: `${publisher}.${name}`, extensionName: name, extensionIsBuiltin: isBuiltin };
	}
}

export interface IThemeExtensionPoint {
	id: string;
	label?: string;
	description?: string;
	path: string;
	uiTheme?: ThemeTypeSelector;
	_watch: boolean; // unsupported options to watch location
}
