/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/languageModelsDialog.css';
import * as DOM from '../../../../../base/browser/dom.js';
import { StandardKeyboardEvent } from '../../../../../base/browser/keyboardEvent.js';
import { Codicon } from '../../../../../base/common/codicons.js';
import { Disposable, DisposableStore, MutableDisposable } from '../../../../../base/common/lifecycle.js';
import { localize } from '../../../../../nls.js';
import { ThemeIcon } from '../../../../../base/common/themables.js';
import { ILanguageModelsService, ILanguageModelProviderDescriptor } from '../../common/languageModels.js';
import { ILanguageModelsConfigurationService, ILanguageModelsProviderGroup } from '../../common/languageModelsConfiguration.js';
import Severity from '../../../../../base/common/severity.js';

type DialogView = 'list' | 'configure' | 'modelDetail';

type ProviderCategory = 'configured' | 'cloud' | 'local' | 'custom';

interface ProviderCatalogEntry {
	vendor: string;
	displayName: string;
	description: string;
	icon: string;
	category: ProviderCategory;
	defaultUrl?: string;
	configuration?: ProviderConfigSchema;
}

interface TestConnectionResult {
	success: boolean;
	models: { name: string; id: string; tokens?: number }[];
	error?: string;
}

interface ProviderConfigSchema {
	properties?: Record<string, {
		type?: string;
		secret?: boolean;
		title?: string;
		description?: string;
		default?: string | number | boolean;
	}>;
	required?: string[];
}

const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
	{ vendor: 'copilot', displayName: 'GitHub Copilot', description: 'GitHub AI models', icon: Codicon.github.id, category: 'configured' },
	{
		vendor: 'anthropic', displayName: 'Anthropic', description: 'Claude models', icon: Codicon.edit.id, category: 'cloud',
		configuration: {
			properties: { apiKey: { type: 'string', secret: true, title: 'API Key', description: 'Anthropic API key' } },
			required: ['apiKey']
		}
	},
	{
		vendor: 'openai', displayName: 'OpenAI', description: 'GPT models', icon: Codicon.sparkle.id, category: 'cloud',
		configuration: {
			properties: { apiKey: { type: 'string', secret: true, title: 'API Key', description: 'OpenAI API key' } },
			required: ['apiKey']
		}
	},
	{
		vendor: 'gemini', displayName: 'Google Gemini', description: 'Gemini models', icon: Codicon.cloud.id, category: 'cloud',
		configuration: {
			properties: { apiKey: { type: 'string', secret: true, title: 'API Key', description: 'Google Gemini API key' } },
			required: ['apiKey']
		}
	},
	{
		vendor: 'openrouter', displayName: 'OpenRouter', description: 'Multi-provider routing', icon: Codicon.server.id, category: 'cloud',
		configuration: {
			properties: { apiKey: { type: 'string', secret: true, title: 'API Key', description: 'OpenRouter API key' } },
			required: ['apiKey']
		}
	},
	{
		vendor: 'xai', displayName: 'xAI (Grok)', description: 'Grok models', icon: Codicon.sparkle.id, category: 'cloud',
		configuration: {
			properties: { apiKey: { type: 'string', secret: true, title: 'API Key', description: 'xAI API key' } },
			required: ['apiKey']
		}
	},
	{
		vendor: 'groq', displayName: 'Groq', description: 'Fast open-source models', icon: Codicon.server.id, category: 'cloud',
		configuration: {
			properties: { apiKey: { type: 'string', secret: true, title: 'API Key', description: 'Groq API key' } },
			required: ['apiKey']
		}
	},
	{
		vendor: 'azure', displayName: 'Azure OpenAI', description: 'Azure OpenAI deployments', icon: Codicon.cloud.id, category: 'cloud',
		configuration: {
			properties: {
				apiKey: { type: 'string', secret: true, title: 'API Key', description: 'Azure OpenAI API key' },
				endpoint: { type: 'string', title: 'Endpoint URL', description: 'Azure OpenAI endpoint (e.g. https://your-resource.openai.azure.com)' },
				deployment: { type: 'string', title: 'Deployment Name', description: 'Model deployment name' }
			},
			required: ['apiKey', 'endpoint']
		}
	},
	{
		vendor: 'ollama', displayName: 'Ollama', description: 'Local LLMs via Ollama', icon: Codicon.serverEnvironment.id, category: 'local',
		configuration: {
			properties: { url: { type: 'string', title: 'URL', description: 'Ollama server endpoint', default: 'http://localhost:11434' } },
			required: ['url']
		}
	},
	{
		vendor: 'lmstudio', displayName: 'LM Studio', description: 'Local models via LM Studio', icon: Codicon.chip.id, category: 'local',
		configuration: {
			properties: { url: { type: 'string', title: 'URL', description: 'LM Studio server endpoint', default: 'http://localhost:1234' } },
			required: ['url']
		}
	},
	{
		vendor: 'customoai', displayName: 'Custom (OpenAI-Compatible)', description: 'Any OpenAI-compatible endpoint', icon: Codicon.wrench.id, category: 'custom',
		configuration: {
			properties: {
				apiKey: { type: 'string', secret: true, title: 'API Key', description: 'API key for the endpoint' },
				url: { type: 'string', title: 'Base URL', description: 'OpenAI-compatible base URL (e.g. https://api.example.com/v1)' }
			},
			required: ['url']
		}
	},
];

const CATEGORY_ORDER: ProviderCategory[] = ['configured', 'cloud', 'local', 'custom'];

const CATEGORY_LABELS: Record<ProviderCategory, string> = {
	configured: localize('lm.category.configured', 'Configured'),
	cloud: localize('lm.category.cloud', 'Cloud Providers'),
	local: localize('lm.category.local', 'Local Providers'),
	custom: localize('lm.category.custom', 'Custom Endpoints'),
};

const CATEGORY_ICONS: Record<ProviderCategory, string> = {
	configured: Codicon.check.id,
	cloud: Codicon.cloud.id,
	local: Codicon.serverEnvironment.id,
	custom: Codicon.wrench.id,
};

const $ = DOM.$;

export class LanguageModelsDialog extends Disposable {

	private _element: HTMLElement;
	private _dialog: HTMLElement | undefined;
	private _currentView: DialogView = 'list';
	private _editingGroup: ILanguageModelsProviderGroup | undefined;
	private _selectedVendor: ProviderCatalogEntry | undefined;
	private _selectedModelId: string | undefined;
	private _searchQuery = '';
	private _expandedProviders = new Set<string>();
	private _testResult: TestConnectionResult | undefined;
	private _isTesting = false;

	private readonly _disposables = this._register(new DisposableStore());
	private readonly _modelRefreshDisposable = this._register(new MutableDisposable());

	constructor(
		@ILanguageModelsService private readonly _languageModelsService: ILanguageModelsService,
		@ILanguageModelsConfigurationService private readonly _configService: ILanguageModelsConfigurationService,
	) {
		super();

		this._element = $('div.lm-dialog-backdrop');
		this._register(DOM.addDisposableListener(this._element, DOM.EventType.CLICK, (e: MouseEvent) => {
			if (e.target === this._element) {
				this.dispose();
			}
		}));
		this._register(DOM.addStandardDisposableListener(this._element, DOM.EventType.KEY_DOWN, (e: StandardKeyboardEvent) => {
			if (e.equals(27)) {
				if (this._currentView === 'list') {
					this.dispose();
				} else {
					this._renderView('list');
				}
			}
		}));
	}

	get element(): HTMLElement {
		return this._element;
	}

	show(): void {
		document.body.appendChild(this._element);
		this._renderView('list');
		this._register(this._languageModelsService.onDidChangeLanguageModels(() => {
			if (this._currentView === 'list') {
				this._renderView('list');
			}
		}));
		this._register(this._languageModelsService.onDidChangeLanguageModelVendors(() => {
			if (this._currentView === 'list') {
				this._renderView('list');
			}
		}));
	}

	private _renderView(view: DialogView): void {
		this._currentView = view;
		this._testResult = undefined;
		this._isTesting = false;
		if (this._dialog) {
			this._dialog.remove();
		}
		this._disposables.clear();

		switch (view) {
			case 'list': this._renderListView(); break;
			case 'configure': this._renderConfigureView(); break;
			case 'modelDetail': this._renderModelDetailView(); break;
		}
	}

	// ===== View 1: Provider List =====

	private _renderListView(): void {
		const groups = this._configService.getLanguageModelsProviderGroups();
		const registeredVendors = this._languageModelsService.getVendors();

		this._dialog = DOM.append(this._element, $('div.lm-dialog'));

		this._renderDialogHeader(localize('lm.dialog.title', 'Language Models'),
			localize('lm.dialog.subtitle', 'Configure AI providers and models'), () => this.dispose());

		this._renderSearchBar(this._dialog);

		const body = DOM.append(this._dialog, $('div.lm-dialog-body'));

		const filteredGroups = this._filterGroups(groups);
		const allVendors = this._getAllVendors();

		if (filteredGroups.length === 0 && this._searchQuery) {
			this._renderEmptyState(body, localize('lm.dialog.noResults', 'No providers match your search'));
		} else if (filteredGroups.length === 0 && groups.length === 0) {
			this._renderEmptyState(body,
				localize('lm.dialog.empty', 'No language models configured yet'),
				localize('lm.dialog.empty.hint', 'Add a provider below to get started'));
		} else {
			const categories = this._buildCategories(allVendors, filteredGroups);
			for (const cat of CATEGORY_ORDER) {
				const catData = categories.get(cat);
				if (!catData || catData.length === 0) {
					continue;
				}
				this._renderCategorySection(body, cat, catData);
			}
		}

		this._renderAddSection(body, allVendors, registeredVendors);

		this._renderDialogFooter(
			() => this._configService.configureLanguageModels(),
			() => this.dispose()
		);
	}

	private _renderDialogHeader(title: string, subtitle?: string, onClose?: () => void, onBack?: () => void): void {
		const header = DOM.append(this._dialog!, $('div.lm-dialog-header'));

		const titleWrap = DOM.append(header, $('div.lm-dialog-header-title'));
		const titleEl = DOM.append(titleWrap, $('div.lm-dialog-title'));

		if (onBack) {
			const backBtn = DOM.append(titleEl, $('span.codicon.codicon-arrow-left'));
			this._disposables.add(DOM.addDisposableListener(backBtn, DOM.EventType.CLICK, onBack));
		}

		DOM.append(titleEl, $('span', undefined, title));

		if (subtitle) {
			DOM.append(titleWrap, $('div.lm-dialog-subtitle', undefined, subtitle));
		}

		const actions = DOM.append(header, $('div.lm-dialog-header-actions'));
		const closeBtn = DOM.append(actions, $('button.lm-icon-btn'));
		closeBtn.className = ThemeIcon.asClassName(Codicon.close);
		this._disposables.add(DOM.addDisposableListener(closeBtn, DOM.EventType.CLICK, () => onClose?.()));
	}

	private _renderSearchBar(container: HTMLElement): void {
		const searchBar = DOM.append(container, $('div.lm-search-bar'));
		const searchContainer = DOM.append(searchBar, $('div.lm-search-container'));
		const searchIcon = DOM.append(searchContainer, $('span.codicon.lm-search-icon'));
		searchIcon.className = ThemeIcon.asClassName(Codicon.search);

		const input = DOM.append(searchContainer, $('input.lm-search-input')) as HTMLInputElement;
		input.placeholder = localize('lm.search.placeholder', 'Search providers...');
		input.value = this._searchQuery;

		this._disposables.add(DOM.addDisposableListener(input, DOM.EventType.INPUT, () => {
			this._searchQuery = input.value.trim().toLowerCase();
			this._renderView('list');
			const newInput = this._dialog?.querySelector('.lm-search-input') as HTMLInputElement;
			if (newInput) {
				newInput.value = this._searchQuery;
				newInput.focus();
			}
		}));

		requestAnimationFrame(() => input.focus());
	}

	private _buildCategories(allVendors: ProviderCatalogEntry[], groups: ILanguageModelsProviderGroup[]): Map<ProviderCategory, ProviderCatalogEntry[]> {
		const categories = new Map<ProviderCategory, ProviderCatalogEntry[]>();
		const configuredVendorIds = new Set(groups.map(g => g.vendor));
		const registeredVendorIds = new Set(this._languageModelsService.getVendors().map(v => v.vendor));

		for (const vendor of allVendors) {
			const isConfigured = configuredVendorIds.has(vendor.vendor) || registeredVendorIds.has(vendor.vendor);
			let cat: ProviderCategory;
			if (isConfigured && (vendor.category === 'configured' || configuredVendorIds.has(vendor.vendor))) {
				cat = 'configured';
			} else {
				cat = vendor.category;
			}
			if (!categories.has(cat)) {
				categories.set(cat, []);
			}
			categories.get(cat)!.push(vendor);
		}

		return categories;
	}

	private _renderCategorySection(container: HTMLElement, category: ProviderCategory, vendors: ProviderCatalogEntry[]): void {
		const section = DOM.append(container, $('div.lm-category'));

		const header = DOM.append(section, $('div.lm-category-header'));
		const icon = DOM.append(header, $('span.codicon'));
		icon.className = ThemeIcon.asClassName(ThemeIcon.fromId(CATEGORY_ICONS[category]));
		DOM.append(header, $('span', undefined, CATEGORY_LABELS[category]));

		DOM.append(header, $('span.lm-category-count', undefined, String(vendors.length)));

		for (const vendor of vendors) {
			const group = this._configService.getLanguageModelsProviderGroups()
				.find(g => g.vendor === vendor.vendor);
			if (group) {
				this._renderConfiguredProviderCard(section, vendor, group);
			} else if (this._languageModelsService.getVendors().some(v => v.vendor === vendor.vendor)) {
				this._renderRegisteredProviderCard(section, vendor);
			}
		}
	}

	private _renderConfiguredProviderCard(container: HTMLElement, vendor: ProviderCatalogEntry, group: ILanguageModelsProviderGroup): void {
		const modelIds = this._languageModelsService.getLanguageModelIds()
			.filter(id => id.startsWith(`${vendor.vendor}/`));
		const groups = this._languageModelsService.getLanguageModelGroups(vendor.vendor);
		const errorGroup = groups.find(g => g.status?.severity === Severity.Error);

		const card = DOM.append(container, $('div.lm-provider-card'));

		const iconClass = errorGroup ? 'lm-provider-icon-error' : (modelIds.length > 0 ? 'lm-provider-icon-active' : 'lm-provider-icon-pending');
		const iconEl = DOM.append(card, $('div.lm-provider-icon'));
		iconEl.classList.add(iconClass);
		iconEl.classList.add(...ThemeIcon.asClassNameArray(ThemeIcon.fromId(vendor.icon)));

		const info = DOM.append(card, $('div.lm-provider-info'));
		const nameEl = DOM.append(info, $('div.lm-provider-name'));
		DOM.append(nameEl, $('span', undefined, group.name));

		if (modelIds.length > 0) {
			DOM.append(nameEl, $('span.lm-badge.lm-badge-models', undefined,
				localize('lm.models.count', '{0} models', modelIds.length)));
		}

		const desc = DOM.append(info, $('div.lm-provider-desc'));
		const descParts: string[] = [vendor.description];
		if (errorGroup) {
			descParts[0] = errorGroup.status!.message;
			desc.style.color = 'var(--vscode-errorForeground)';
		}
		desc.textContent = descParts.join(' \u00B7 ');

		const badges = DOM.append(card, $('div.lm-provider-badges'));
		if (errorGroup) {
			DOM.append(badges, $('span.lm-badge.lm-badge-error', undefined,
				localize('lm.status.error', 'Error')));
		} else if (modelIds.length > 0) {
			DOM.append(badges, $('span.lm-badge.lm-badge-success', undefined,
				localize('lm.status.active', 'Active')));
		} else {
			DOM.append(badges, $('span.lm-badge.lm-badge-warning', undefined,
				localize('lm.status.pending', 'Pending')));
		}

		const actions = DOM.append(card, $('div.lm-provider-actions'));

		const editBtn = DOM.append(actions, $('button.lm-icon-btn'));
		editBtn.className = ThemeIcon.asClassName(Codicon.edit);
		editBtn.title = localize('lm.action.edit', 'Edit');
		this._disposables.add(DOM.addDisposableListener(editBtn, DOM.EventType.CLICK, (e) => {
			e.stopPropagation();
			this._editingGroup = group;
			this._selectedVendor = vendor;
			this._renderView('configure');
		}));

		if (group.vendor !== 'copilot') {
			const deleteBtn = DOM.append(actions, $('button.lm-icon-btn.codicon-trash'));
			deleteBtn.className = ThemeIcon.asClassName(Codicon.trash);
			deleteBtn.title = localize('lm.action.remove', 'Remove');
			this._disposables.add(DOM.addDisposableListener(deleteBtn, DOM.EventType.CLICK, (e) => {
				e.stopPropagation();
				this._removeGroup(group);
			}));
		}

		if (modelIds.length > 0) {
			const isExpanded = this._expandedProviders.has(group.name);
			const toggle = DOM.append(container, $('div.lm-provider-models-toggle'));
			toggle.setAttribute('role', 'button');
			toggle.setAttribute('tabindex', '0');
			const chevron = DOM.append(toggle, $('span.codicon.codicon-chevron-right'));
			if (isExpanded) {
				chevron.classList.add('expanded');
			}
			DOM.append(toggle, $('span', undefined, isExpanded
				? localize('lm.models.hide', 'Hide models')
				: localize('lm.models.show', 'Show models')));

			this._disposables.add(DOM.addDisposableListener(toggle, DOM.EventType.CLICK, () => {
				if (this._expandedProviders.has(group.name)) {
					this._expandedProviders.delete(group.name);
				} else {
					this._expandedProviders.add(group.name);
				}
				this._renderView('list');
			}));

			if (isExpanded) {
				const sublist = DOM.append(container, $('div.lm-models-sublist'));
				const maxShow = 15;
				for (let i = 0; i < Math.min(modelIds.length, maxShow); i++) {
					const model = this._languageModelsService.lookupLanguageModel(modelIds[i]);
					if (!model) { continue; }
					const chip = DOM.append(sublist, $('div.lm-model-chip'));
					chip.classList.add(...ThemeIcon.asClassNameArray(ThemeIcon.fromId(Codicon.symbolFile.id)));
					DOM.append(chip, $('span', undefined, model.name));
					const totalTokens = (model.maxInputTokens ?? 0) + (model.maxOutputTokens ?? 0);
					if (totalTokens > 0) {
						const tokenStr = totalTokens >= 1000000
							? `${(totalTokens / 1000000).toFixed(1)}M`
							: `${Math.round(totalTokens / 1000)}K`;
						DOM.append(chip, $('span.lm-model-chip-tokens', undefined, tokenStr));
					}

					this._disposables.add(DOM.addDisposableListener(chip, DOM.EventType.CLICK, () => {
						this._selectedModelId = modelIds[i];
						this._renderView('modelDetail');
					}));
				}
				if (modelIds.length > maxShow) {
					const more = DOM.append(sublist, $('div.lm-model-chip'));
					DOM.append(more, $('span', undefined, `+${modelIds.length - maxShow} more...`));
				}
			}
		}
	}

	private _renderRegisteredProviderCard(container: HTMLElement, vendor: ProviderCatalogEntry): void {
		const descriptor = this._languageModelsService.getVendors().find(v => v.vendor === vendor.vendor);
		if (!descriptor) { return; }

		const card = DOM.append(container, $('div.lm-provider-card'));

		const iconEl = DOM.append(card, $('div.lm-provider-icon'));
		iconEl.classList.add('lm-provider-icon-pending');
		iconEl.classList.add(...ThemeIcon.asClassNameArray(ThemeIcon.fromId(vendor.icon)));

		const info = DOM.append(card, $('div.lm-provider-info'));
		DOM.append(info, $('div.lm-provider-name', undefined, descriptor.displayName));
		DOM.append(info, $('div.lm-provider-desc', undefined, vendor.description));

		if (!descriptor.configuration) {
			DOM.append(info, $('div.lm-provider-desc', undefined,
				localize('lm.provider.noConfig', 'No additional configuration required')));
		}
	}

	private _renderAddSection(container: HTMLElement, allVendors: ProviderCatalogEntry[], registeredVendors: ILanguageModelProviderDescriptor[]): void {
		const configuredVendorIds = new Set([
			...this._configService.getLanguageModelsProviderGroups().map(g => g.vendor),
			...registeredVendors.map(v => v.vendor)
		]);

		const available = allVendors.filter(v => !configuredVendorIds.has(v.vendor));
		if (available.length === 0 && configuredVendorIds.size > 0) {
			return;
		}

		DOM.append(container, $('div.lm-separator'));

		const section = DOM.append(container, $('div.lm-add-section'));
		DOM.append(section, $('div.lm-add-section-title', undefined,
			configuredVendorIds.size > 0
				? localize('lm.add.more', 'Add More Providers')
				: localize('lm.add.title', 'Add a Provider')));

		const grid = DOM.append(section, $('div.lm-add-grid'));
		const toShow = available.length > 0 ? available : allVendors;
		for (const vendor of toShow) {
			this._renderAddCard(grid, vendor, configuredVendorIds.has(vendor.vendor));
		}
	}

	private _renderAddCard(container: HTMLElement, vendor: ProviderCatalogEntry, alreadyConfigured: boolean): void {
		const card = DOM.append(container, $('div.lm-add-card'));
		const iconEl = DOM.append(card, $('div.lm-add-card-icon'));
		iconEl.classList.add(...ThemeIcon.asClassNameArray(ThemeIcon.fromId(vendor.icon)));
		DOM.append(card, $('div.lm-add-card-label', undefined, vendor.displayName));
		DOM.append(card, $('div.lm-add-card-desc', undefined, vendor.description));

		this._disposables.add(DOM.addDisposableListener(card, DOM.EventType.CLICK, () => {
			this._editingGroup = undefined;
			this._selectedVendor = vendor;
			this._renderView('configure');
		}));
	}

	private _renderEmptyState(container: HTMLElement, title: string, hint?: string): void {
		const empty = DOM.append(container, $('div.lm-empty-state'));
		const icon = DOM.append(empty, $('span.codicon'));
		icon.className = ThemeIcon.asClassName(Codicon.serverEnvironment);
		DOM.append(empty, $('div.lm-empty-state-title', undefined, title));
		if (hint) {
			DOM.append(empty, $('div.lm-empty-state-text', undefined, hint));
		}
	}

	private _renderDialogFooter(onAdvanced: () => void, onClose: () => void): void {
		const footer = DOM.append(this._dialog!, $('div.lm-dialog-footer'));
		const left = DOM.append(footer, $('div.lm-dialog-footer-left'));
		const advancedBtn = DOM.append(left, $('button.lm-btn.lm-btn-ghost'));
		advancedBtn.textContent = localize('lm.action.advanced', 'Advanced Settings (JSON)');
		this._disposables.add(DOM.addDisposableListener(advancedBtn, DOM.EventType.CLICK, onAdvanced));

		const right = DOM.append(footer, $('div.lm-dialog-footer-right'));
		const closeBtn = DOM.append(right, $('button.lm-btn.lm-btn-secondary', undefined, localize('lm.action.close', 'Close')));
		this._disposables.add(DOM.addDisposableListener(closeBtn, DOM.EventType.CLICK, onClose));
	}

	// ===== View 2: Configuration Form =====

	private _renderConfigureView(): void {
		if (!this._selectedVendor) {
			this._renderView('list');
			return;
		}

		const vendor = this._selectedVendor;
		const isEdit = !!this._editingGroup;
		const group = this._editingGroup;
		const registeredVendor = this._languageModelsService.getVendors().find(v => v.vendor === vendor.vendor);
		const configSchema = (vendor.configuration ?? registeredVendor?.configuration) as ProviderConfigSchema | undefined;

		this._dialog = DOM.append(this._element, $('div.lm-dialog'));

		this._renderDialogHeader(
			isEdit ? localize('lm.configure.edit', 'Edit Provider') : localize('lm.configure.add', 'Add Provider'),
			isEdit ? group!.name : vendor.displayName,
			() => this.dispose(),
			() => this._renderView('list')
		);

		const body = DOM.append(this._dialog, $('div.lm-dialog-body'));
		const form = DOM.append(body, $('div.lm-form'));

		const nameInput = this._renderFormField(form,
			localize('lm.form.name', 'Display Name'),
			isEdit ? group!.name : vendor.displayName,
			localize('lm.form.name.hint', 'A friendly name for this provider instance'),
			false,
			true
		);

		const inputs: { key: string; input: HTMLInputElement; secret: boolean }[] = [];

		if (configSchema?.properties) {
			for (const [key, propSchema] of Object.entries(configSchema.properties)) {
				if (typeof propSchema === 'boolean') { continue; }
				const defaultVal = propSchema.default !== undefined ? String(propSchema.default) : '';
				const existingVal = isEdit && group ? String((group as Record<string, unknown>)[key] ?? '') : '';
				const val = existingVal || defaultVal;
				const isSecret = !!propSchema.secret;

				const input = this._renderFormField(form,
					propSchema.title ?? key,
					val,
					propSchema.description ?? '',
					isSecret,
					!!configSchema.required?.includes(key)
				);
				inputs.push({ key, input, secret: isSecret });
			}
		}

		this._testResult = undefined;
		this._renderTestConnectionSection(form, inputs, registeredVendor, nameInput);

		const footer = DOM.append(this._dialog, $('div.lm-dialog-footer'));
		const left = DOM.append(footer, $('div.lm-dialog-footer-left'));

		const cancelBtn = DOM.append(left, $('button.lm-btn.lm-btn-secondary', undefined, localize('lm.action.cancel', 'Cancel')));
		this._disposables.add(DOM.addDisposableListener(cancelBtn, DOM.EventType.CLICK, () => this._renderView('list')));

		const right = DOM.append(footer, $('div.lm-dialog-footer-right'));
		const saveBtn = DOM.append(right, $('button.lm-btn.lm-btn-primary', undefined,
			isEdit ? localize('lm.action.save', 'Save Changes') : localize('lm.action.connect', 'Connect')));
		this._disposables.add(DOM.addDisposableListener(saveBtn, DOM.EventType.CLICK, () => {
			this._saveProvider(nameInput.value, inputs, isEdit ? group : undefined, vendor);
		}));

		requestAnimationFrame(() => nameInput.focus());
	}

	private _renderTestConnectionSection(form: HTMLElement, inputs: { key: string; input: HTMLInputElement; secret: boolean }[], vendor: ILanguageModelProviderDescriptor | undefined, nameInput: HTMLInputElement): void {
		const section = DOM.append(form, $('div.lm-test-section'));

		const header = DOM.append(section, $('div'));
		header.style.display = 'flex';
		header.style.alignItems = 'center';
		header.style.justifyContent = 'space-between';

		DOM.append(header, $('span', undefined,
			localize('lm.test.title', 'Verify Connection')));

		const testBtn = DOM.append(header, $('button.lm-btn.lm-btn-secondary')) as HTMLButtonElement;
		testBtn.style.fontSize = '11px';
		testBtn.style.padding = '3px 10px';
		DOM.append(testBtn, $('span', undefined, localize('lm.test.button', 'Test Connection')));
		const testIcon = DOM.append(testBtn, $('span.codicon'));
		testIcon.className = ThemeIcon.asClassName(Codicon.debugStart);

		this._disposables.add(DOM.addDisposableListener(testBtn, DOM.EventType.CLICK, async () => {
			if (this._isTesting) { return; }
			await this._runTestConnection(section, inputs, vendor, nameInput, testBtn);
		}));
	}

	private async _runTestConnection(
		section: HTMLElement,
		inputs: { key: string; input: HTMLInputElement; secret: boolean }[],
		vendor: ILanguageModelProviderDescriptor | undefined,
		nameInput: HTMLInputElement,
		testBtn: HTMLButtonElement
	): Promise<void> {
		this._isTesting = true;
		this._testResult = undefined;

		const config = this._collectFormValues(inputs);

		if (!nameInput.value.trim()) {
			this._showTestResult(section, {
				success: false,
				models: [],
				error: localize('lm.error.nameRequired', 'Display name is required')
			});
			this._isTesting = false;
			return;
		}

		if (!vendor) {
			this._showTestResult(section, {
				success: false,
				models: [],
				error: localize('lm.test.vendorNotFound', 'Provider not registered. Install the corresponding extension first.')
			});
			this._isTesting = false;
			return;
		}

		testBtn.disabled = true;
		const loadingEl = DOM.append(section, $('div.lm-test-loading'));
		DOM.append(loadingEl, $('div.lm-spinner'));
		DOM.append(loadingEl, $('span', undefined, localize('lm.test.connecting', 'Connecting to {0}...', nameInput.value.trim())));

		try {
			const result = await this._languageModelsService.testProviderConnection(vendor.vendor, config);
			this._testResult = result;
			loadingEl.remove();

			if (result.success) {
				this._showTestResult(section, {
					success: true,
					models: result.models,
					error: result.models.length === 0
						? localize('lm.test.noModels', 'Connection successful, but no models were returned')
						: undefined
				});
			} else {
				this._showTestResult(section, result);
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			this._testResult = { success: false, models: [], error: msg };
			loadingEl.remove();
			this._showTestResult(section, this._testResult);
		}

		testBtn.disabled = false;
		this._isTesting = false;
	}

	private _showTestResult(container: HTMLElement, result: TestConnectionResult): void {
		const existing = container.querySelector('.lm-test-result');
		if (existing) { existing.remove(); }

		const el = DOM.append(container, $('div.lm-test-result'));
		el.classList.add(result.success ? 'lm-test-success' : 'lm-test-error');

		const icon = DOM.append(el, $('span.codicon'));
		icon.className = ThemeIcon.asClassName(result.success ? Codicon.check : Codicon.error);

		if (result.error) {
			DOM.append(el, $('span', undefined, result.error));
		} else if (result.models.length > 0) {
			DOM.append(el, $('span', undefined,
				localize('lm.test.success', 'Connected! Found {0} models:', result.models.length)));
			const modelList = DOM.append(el, $('div.lm-test-models-list'));
			for (const model of result.models) {
				const chip = DOM.append(modelList, $('div.lm-model-chip'));
				DOM.append(chip, $('span', undefined, model.name));
				if (model.tokens) {
					DOM.append(chip, $('span.lm-model-chip-tokens', undefined,
						model.tokens >= 1000000 ? `${(model.tokens / 1000000).toFixed(1)}M` : `${Math.round(model.tokens / 1000)}K`));
				}
			}
		}
	}

	private _renderFormField(
		form: HTMLElement,
		label: string,
		value: string,
		hint: string,
		password: boolean,
		required: boolean
	): HTMLInputElement {
		const group = DOM.append(form, $('div.lm-form-group'));
		const labelEl = DOM.append(group, $('label.lm-form-label', undefined, label));
		if (required) {
			DOM.append(labelEl, $('span.lm-form-label-required', undefined, '*'));
		}

		const input = DOM.append(group, $('input.lm-form-input')) as HTMLInputElement;
		input.type = password ? 'password' : 'text';
		input.value = value;

		if (password && value && value.startsWith('${input:')) {
			input.value = '';
			(input as any).dataset.hasSecret = 'true';
			input.placeholder = localize('lm.form.secret.saved', 'Stored securely. Type to replace.');
			input.title = localize('lm.form.secret.stored', 'Secret is stored securely. Leave empty to keep it, type to replace it.');
		}
		if (password && !value) {
			input.placeholder = localize('lm.form.secret.placeholder', 'Enter a value...');
		}
		if (hint) {
			DOM.append(group, $('div.lm-form-hint', undefined, hint));
		}

		this._disposables.add(DOM.addDisposableListener(input, DOM.EventType.INPUT, () => {
			input.classList.remove('lm-form-input-error');
			const errEl = input.parentElement?.querySelector('.lm-form-error') as HTMLElement | undefined;
			errEl?.remove();
		}));

		return input;
	}

	private _collectFormValues(inputs: { key: string; input: HTMLInputElement; secret: boolean }[]): Record<string, unknown> {
		const config: Record<string, unknown> = {};
		for (const { key, input } of inputs) {
			if ((input as any).dataset.hasSecret === 'true') {
				const existingValue = this._editingGroup ? (this._editingGroup as Record<string, unknown>)[key] : undefined;
				if (typeof existingValue === 'string') {
					config[key] = existingValue;
				}
				continue;
			}
			if (!input.value && input.type === 'password') {
				continue;
			}
			config[key] = input.value;
		}
		return config;
	}

	// ===== View 3: Model Detail =====

	private _renderModelDetailView(): void {
		if (!this._selectedModelId) {
			this._renderView('list');
			return;
		}

		const model = this._languageModelsService.lookupLanguageModel(this._selectedModelId);
		if (!model) {
			this._renderView('list');
			return;
		}

		this._dialog = DOM.append(this._element, $('div.lm-dialog'));

		const vendor = this._languageModelsService.getVendors().find(v => v.vendor === model.vendor);
		const vendorEntry = PROVIDER_CATALOG.find(p => p.vendor === model.vendor);
		const vendorDisplayName = vendor?.displayName ?? model.vendor;

		this._renderDialogHeader(
			model.name,
			localize('lm.detail.subtitle', 'Model Details'),
			() => this.dispose(),
			() => this._renderView('list')
		);

		const body = DOM.append(this._dialog, $('div.lm-dialog-body'));
		const detail = DOM.append(body, $('div.lm-model-detail'));

		const headerEl = DOM.append(detail, $('div.lm-model-detail-header'));
		const iconEl = DOM.append(headerEl, $('div.lm-model-detail-icon'));
		iconEl.classList.add(...ThemeIcon.asClassNameArray(ThemeIcon.fromId(vendorEntry?.icon ?? Codicon.server.id)));

		const infoEl = DOM.append(headerEl, $('div'));
		DOM.append(infoEl, $('div.lm-model-detail-name', undefined, model.name));
		DOM.append(infoEl, $('div.lm-model-detail-id', undefined, this._selectedModelId));
		DOM.append(infoEl, $('div.lm-model-detail-vendor', undefined, vendorDisplayName));

		if (model.family || model.version) {
			DOM.append(infoEl, $('div.lm-model-detail-vendor', undefined,
				[model.family, model.version].filter(Boolean).join(' \u00B7 ')));
		}

		if (model.maxInputTokens || model.maxOutputTokens) {
			const section = DOM.append(detail, $('div.lm-model-detail-section'));
			DOM.append(section, $('div.lm-model-detail-section-title', undefined, localize('lm.detail.tokens', 'Token Limits')));
			const grid = DOM.append(section, $('div.lm-model-detail-grid'));

			if (model.maxInputTokens) {
				const item = DOM.append(grid, $('div.lm-model-detail-item'));
				DOM.append(item, $('div.lm-model-detail-item-label', undefined, localize('lm.detail.inputTokens', 'Input')));
				DOM.append(item, $('div.lm-model-detail-item-value', undefined, this._formatTokens(model.maxInputTokens)));
			}
			if (model.maxOutputTokens) {
				const item = DOM.append(grid, $('div.lm-model-detail-item'));
				DOM.append(item, $('div.lm-model-detail-item-label', undefined, localize('lm.detail.outputTokens', 'Output')));
				DOM.append(item, $('div.lm-model-detail-item-value', undefined, this._formatTokens(model.maxOutputTokens)));
			}
			const totalTokens = (model.maxInputTokens ?? 0) + (model.maxOutputTokens ?? 0);
			const item = DOM.append(grid, $('div.lm-model-detail-item'));
			DOM.append(item, $('div.lm-model-detail-item-label', undefined, localize('lm.detail.totalTokens', 'Total')));
			DOM.append(item, $('div.lm-model-detail-item-value', undefined, this._formatTokens(totalTokens)));
		}

		if (model.capabilities) {
			const section = DOM.append(detail, $('div.lm-model-detail-section'));
			DOM.append(section, $('div.lm-model-detail-section-title', undefined, localize('lm.detail.capabilities', 'Capabilities')));
			const caps = DOM.append(section, $('div.lm-model-detail-capabilities'));

			if (model.capabilities.toolCalling) {
				this._renderCapabilityBadge(caps, Codicon.tools, localize('lm.cap.toolCalling', 'Tool Calling'));
			}
			if (model.capabilities.vision) {
				this._renderCapabilityBadge(caps, Codicon.eye, localize('lm.cap.vision', 'Vision'));
			}
			if (model.capabilities.agentMode) {
				this._renderCapabilityBadge(caps, Codicon.robot, localize('lm.cap.agentMode', 'Agent Mode'));
			}
			for (const editTool of model.capabilities.editTools ?? []) {
				this._renderCapabilityBadge(caps, Codicon.edit, editTool);
			}
		}

		const section = DOM.append(detail, $('div.lm-model-detail-section'));
		DOM.append(section, $('div.lm-model-detail-section-title', undefined, localize('lm.detail.visibility', 'Visibility')));
		const isVisible = model.isUserSelectable !== false;

		const toggle = DOM.append(section, $('div.lm-visibility-toggle'));
		toggle.setAttribute('role', 'button');
		toggle.setAttribute('tabindex', '0');
		toggle.setAttribute('aria-checked', String(isVisible));

		const toggleLabel = DOM.append(toggle, $('div.lm-visibility-toggle-label'));
		const labelIcon = DOM.append(toggleLabel, $('span.codicon'));
		labelIcon.className = ThemeIcon.asClassName(isVisible ? Codicon.eye : Codicon.eyeClosed);
		DOM.append(toggleLabel, $('span', undefined, isVisible
			? localize('lm.visibility.visible', 'Visible in Model Picker')
			: localize('lm.visibility.hidden', 'Hidden from Model Picker')));

		const switchEl = DOM.append(toggle, $('div.lm-visibility-toggle-switch'));
		if (isVisible) {
			switchEl.classList.add('active');
		}

		const toggleHandler = () => {
			const newValue = !isVisible;
			this._languageModelsService.updateModelPickerPreference(this._selectedModelId!, newValue);
			this._renderView('modelDetail');
		};
		this._disposables.add(DOM.addDisposableListener(toggle, DOM.EventType.CLICK, toggleHandler));
		this._disposables.add(DOM.addStandardDisposableListener(toggle, 'keydown', (e) => {
			if (e.equals(3) || e.equals(10)) { toggleHandler(); }
		}));

		const footer = DOM.append(this._dialog, $('div.lm-dialog-footer'));
		DOM.append(footer, $('div.lm-dialog-footer-left'));
		const right = DOM.append(footer, $('div.lm-dialog-footer-right'));
		const doneBtn = DOM.append(right, $('button.lm-btn.lm-btn-secondary', undefined, localize('lm.action.done', 'Done')));
		this._disposables.add(DOM.addDisposableListener(doneBtn, DOM.EventType.CLICK, () => this._renderView('list')));
	}

	private _renderCapabilityBadge(container: HTMLElement, icon: ThemeIcon, label: string): void {
		const badge = DOM.append(container, $('div.lm-capability-badge'));
		const iconEl = DOM.append(badge, $('span.codicon'));
		iconEl.className = ThemeIcon.asClassName(icon);
		DOM.append(badge, $('span', undefined, label));
	}

	// ===== Actions =====

	private async _saveProvider(
		name: string,
		inputs: { key: string; input: HTMLInputElement; secret: boolean }[],
		existing: ILanguageModelsProviderGroup | undefined,
		vendor: ProviderCatalogEntry
	): Promise<void> {
		if (!name.trim()) {
			return;
		}

		const config = this._collectFormValues(inputs);

		try {
			if (existing && existing.vendor !== 'copilot') {
				await this._languageModelsService.removeLanguageModelsProviderGroup(vendor.vendor, existing.name);
			}
			await this._languageModelsService.addLanguageModelsProviderGroup(name.trim(), vendor.vendor, config);

			this._modelRefreshDisposable.value = this._languageModelsService.onDidChangeLanguageModels(() => {
				this._modelRefreshDisposable.clear();
				this._renderView('list');
			});

			await this._languageModelsService.selectLanguageModels({});

			setTimeout(() => {
				if (!this._store.isDisposed) {
					this._renderView('list');
				}
			}, 2000);
		} catch {
			this._renderView('list');
		}
	}

	private async _removeGroup(group: ILanguageModelsProviderGroup): Promise<void> {
		try {
			await this._configService.removeLanguageModelsProviderGroup(group);
			this._expandedProviders.delete(group.name);
			this._renderView('list');
		} catch {
			// ignore
		}
	}

	// ===== Helpers =====

	private _getAllVendors(): ProviderCatalogEntry[] {
		const registeredVendors = this._languageModelsService.getVendors();
		const allVendors = [...PROVIDER_CATALOG];

		for (const rv of registeredVendors) {
			if (!allVendors.some(p => p.vendor === rv.vendor)) {
				allVendors.unshift({
					vendor: rv.vendor,
					displayName: rv.displayName,
					description: rv.configuration ? localize('lm.provider.extended', 'Extended provider') : '',
					icon: PROVIDER_ICONS[rv.vendor] || Codicon.server.id,
					category: 'configured'
				});
			}
		}

		return allVendors;
	}

	private _filterGroups(groups: readonly ILanguageModelsProviderGroup[]): ILanguageModelsProviderGroup[] {
		if (!this._searchQuery) { return [...groups]; }
		return groups.filter(g => {
			const name = g.name.toLowerCase();
			const vendor = g.vendor.toLowerCase();
			return name.includes(this._searchQuery) || vendor.includes(this._searchQuery);
		});
	}

	private _formatTokens(count: number): string {
		if (count >= 1000000) {
			return `${(count / 1000000).toFixed(1)}M`;
		} else if (count >= 1000) {
			return `${(count / 1000).toFixed(0)}K`;
		}
		return String(count);
	}

	override dispose(): void {
		this._disposables.dispose();
		this._modelRefreshDisposable.dispose();
		this._element.remove();
		super.dispose();
	}
}

const PROVIDER_ICONS: Record<string, string> = {
	'ollama': Codicon.serverEnvironment.id,
	'anthropic': Codicon.edit.id,
	'openai': Codicon.sparkle.id,
	'gemini': Codicon.cloud.id,
	'openrouter': Codicon.server.id,
	'xai': Codicon.sparkle.id,
	'groq': Codicon.server.id,
	'azure': Codicon.cloud.id,
	'customoai': Codicon.wrench.id,
	'copilot': Codicon.github.id,
	'lmstudio': Codicon.chip.id,
};

interface ProviderConfigSchema {
	properties?: Record<string, {
		type?: string;
		secret?: boolean;
		title?: string;
		description?: string;
		default?: string | number | boolean;
	}>;
	required?: string[];
}
