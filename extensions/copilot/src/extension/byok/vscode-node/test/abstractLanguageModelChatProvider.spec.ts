/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { AbstractOpenAICompatibleLMProvider, type LanguageModelChatConfiguration } from '../abstractLanguageModelChatProvider';
import type { IBYOKStorageService } from '../byokStorageService';

class TestOpenAICompatibleProvider extends AbstractOpenAICompatibleLMProvider<LanguageModelChatConfiguration> {
	constructor(fetchImpl: (url: string, options?: unknown) => Promise<{ ok: boolean; status?: number; statusText?: string; json: () => Promise<unknown> }>) {
		super(
			'test-provider',
			'Test Provider',
			undefined,
			createStorageService(),
			{ fetch: vi.fn(fetchImpl) } as any,
			createLogService(),
			{ createInstance: vi.fn(() => ({ provideLanguageModelResponse: vi.fn(), provideTokenCount: vi.fn() })) } as any,
			{} as any,
			{} as any
		);
	}

	protected override getModelsBaseUrl(configuration: LanguageModelChatConfiguration | undefined): string | undefined {
		return configuration?.baseUrl ?? configuration?.url;
	}

	public exposeDiscoveryUrl(baseUrl: string): string {
		return this.getModelsDiscoveryUrl(baseUrl);
	}

	public exposeConfiguredDiscoveryUrl(configuration: LanguageModelChatConfiguration | undefined, baseUrl: string): string {
		return this.getModelDiscoveryUrl(configuration, baseUrl);
	}

	public exposeExtractModelList(data: unknown): unknown[] | undefined {
		return this.extractModelList(data);
	}
}

function createStorageService(): IBYOKStorageService {
	return {
		getAPIKey: vi.fn().mockResolvedValue(undefined),
		storeAPIKey: vi.fn().mockResolvedValue(undefined),
		deleteAPIKey: vi.fn().mockResolvedValue(undefined),
		getStoredModelConfigs: vi.fn().mockResolvedValue({}),
		saveModelConfig: vi.fn().mockResolvedValue(undefined),
		removeModelConfig: vi.fn().mockResolvedValue(undefined),
	};
}

function createLogService() {
	const logService = {
		_serviceBrand: undefined,
		trace: vi.fn(),
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		show: vi.fn(),
		createSubLogger: vi.fn(),
		withExtraTarget: vi.fn(),
	};
	logService.createSubLogger.mockReturnValue(logService);
	logService.withExtraTarget.mockReturnValue(logService);
	return logService;
}

describe('AbstractOpenAICompatibleLMProvider', () => {
	it('normalizes discovery endpoints and respects explicit model URLs', () => {
		const provider = new TestOpenAICompatibleProvider(async () => ({
			ok: true,
			json: async () => ({ data: [] }),
		}));

		expect(provider.exposeDiscoveryUrl('https://example.com/v1')).toBe('https://example.com/v1/models');
		expect(provider.exposeDiscoveryUrl('https://example.com/v1/chat/completions')).toBe('https://example.com/v1/models');
		expect(provider.exposeDiscoveryUrl('https://example.com/api/v1/models')).toBe('https://example.com/api/v1/models');
		expect(provider.exposeConfiguredDiscoveryUrl({ modelsFetchUrl: ' https://example.com/custom-models/ ' }, 'https://example.com/v1')).toBe('https://example.com/custom-models');
	});

	it('parses root arrays, items arrays, and nested model arrays from discovery responses', () => {
		const provider = new TestOpenAICompatibleProvider(async () => ({
			ok: true,
			json: async () => ({ data: [] }),
		}));

		expect(provider.exposeExtractModelList([{ id: 'one' }])).toEqual([{ id: 'one' }]);
		expect(provider.exposeExtractModelList({ items: [{ name: 'two' }] })).toEqual([{ name: 'two' }]);
		expect(provider.exposeExtractModelList({ data: { models: [{ id: 'three' }] } })).toEqual([{ id: 'three' }]);
	});

	it('accepts name-only models and falls back to cached/manual models on discovery failure', async () => {
		const tokenSource = new vscode.CancellationTokenSource();

		const nameOnlyProvider = new TestOpenAICompatibleProvider(async () => ({
			ok: true,
			json: async () => ({ items: [{ name: 'name-only-model' }] }),
		}));

		const discovered = await nameOnlyProvider.provideLanguageModelChatInformation({
			silent: false,
			configuration: {
				baseUrl: 'https://example.com/v1',
				authType: 'none'
			}
		}, tokenSource.token);

		expect(discovered.map(model => model.id)).toEqual(['name-only-model']);

		const cachedFallbackProvider = new TestOpenAICompatibleProvider(async () => {
			throw new Error('boom');
		});

		const fallbackModels = await cachedFallbackProvider.provideLanguageModelChatInformation({
			silent: false,
			configuration: {
				baseUrl: 'https://example.com/v1',
				authType: 'none',
				cachedModels: [{ id: 'cached-model', name: 'Cached Model' }],
				manualModels: ['manual-model'],
				defaultChatModel: 'cached-model',
				defaultCodingModel: 'manual-model'
			}
		}, tokenSource.token);

		expect(fallbackModels.map(model => model.id)).toEqual(['cached-model', 'manual-model']);
		expect(fallbackModels[0].isDefault?.[vscode.ChatLocation.Panel]).toBe(true);
		expect(fallbackModels[1].isDefault?.[vscode.ChatLocation.Editor]).toBe(true);
	});
});
