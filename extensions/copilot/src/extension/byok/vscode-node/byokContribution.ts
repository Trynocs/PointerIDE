/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { LanguageModelChatInformation, LanguageModelChatProvider, lm } from 'vscode';
import { IAuthenticationService } from '../../../platform/authentication/common/authentication';
import { IVSCodeExtensionContext } from '../../../platform/extContext/common/extensionContext';
import { ILogService } from '../../../platform/log/common/logService';
import { IFetcherService } from '../../../platform/networking/common/fetcherService';
import { Disposable, DisposableStore } from '../../../util/vs/base/common/lifecycle';
import { IInstantiationService } from '../../../util/vs/platform/instantiation/common/instantiation';
import { BYOKKnownModels, inferBYOKModelCapabilities } from '../../byok/common/byokProvider';
import { IExtensionContribution } from '../../common/contributions';
import { AnthropicLMProvider } from './anthropicProvider';
import { AzureBYOKModelProvider } from './azureProvider';
import { BYOKStorageService, IBYOKStorageService } from './byokStorageService';
import { CustomOAIBYOKModelProvider } from './customOAIProvider';
import { GeminiNativeBYOKLMProvider } from './geminiNativeProvider';
import { GroqLMProvider } from './groqProvider';
import { LMStudioLMProvider } from './lmStudioProvider';
import { OllamaLMProvider } from './ollamaProvider';
import { OAIBYOKLMProvider } from './openAIProvider';
import { OpenRouterLMProvider } from './openRouterProvider';
import { XAIBYOKLMProvider } from './xAIProvider';
import { ZAILMProvider } from './zAIProvider';

export class BYOKContrib extends Disposable implements IExtensionContribution {
	public readonly id: string = 'byok-contribution';
	private readonly _byokStorageService: IBYOKStorageService;
	private readonly _providers: Map<string, LanguageModelChatProvider<LanguageModelChatInformation>> = new Map();
	private readonly _byokRegistrations = this._register(new DisposableStore());
	private _byokProvidersRegistered = false;

	constructor(
		@IFetcherService private readonly _fetcherService: IFetcherService,
		@ILogService private readonly _logService: ILogService,
		@IVSCodeExtensionContext extensionContext: IVSCodeExtensionContext,
		@IAuthenticationService _authService: IAuthenticationService,
		@IInstantiationService private readonly _instantiationService: IInstantiationService,
	) {
		super();
		this._byokStorageService = new BYOKStorageService(extensionContext);
		this._registerProviders();
	}

	private async _registerProviders() {
		if (this._byokProvidersRegistered) {
			return;
		}
		this._byokProvidersRegistered = true;
		const knownModels = await this.fetchKnownModelList(this._fetcherService);
		if (this._store.isDisposed) {
			return;
		}
		this._providers.set(OllamaLMProvider.providerName.toLowerCase(), this._instantiationService.createInstance(OllamaLMProvider, this._byokStorageService));
		this._providers.set(AnthropicLMProvider.providerName.toLowerCase(), this._instantiationService.createInstance(AnthropicLMProvider, knownModels[AnthropicLMProvider.providerName], this._byokStorageService));
		this._providers.set(GeminiNativeBYOKLMProvider.providerName.toLowerCase(), this._instantiationService.createInstance(GeminiNativeBYOKLMProvider, knownModels[GeminiNativeBYOKLMProvider.providerName], this._byokStorageService));
		this._providers.set(OAIBYOKLMProvider.providerName.toLowerCase(), this._instantiationService.createInstance(OAIBYOKLMProvider, knownModels[OAIBYOKLMProvider.providerName], this._byokStorageService));
		this._providers.set(OpenRouterLMProvider.providerName.toLowerCase(), this._instantiationService.createInstance(OpenRouterLMProvider, this._byokStorageService));
		this._providers.set(XAIBYOKLMProvider.providerName.toLowerCase(), this._instantiationService.createInstance(XAIBYOKLMProvider, knownModels[XAIBYOKLMProvider.providerName], this._byokStorageService));
		this._providers.set(ZAILMProvider.providerId, this._instantiationService.createInstance(ZAILMProvider, knownModels[ZAILMProvider.providerName], this._byokStorageService));
		this._providers.set(GroqLMProvider.providerName.toLowerCase(), this._instantiationService.createInstance(GroqLMProvider, knownModels[GroqLMProvider.providerName], this._byokStorageService));
		this._providers.set(LMStudioLMProvider.providerName.toLowerCase(), this._instantiationService.createInstance(LMStudioLMProvider, this._byokStorageService));
		this._providers.set(AzureBYOKModelProvider.providerName.toLowerCase(), this._instantiationService.createInstance(AzureBYOKModelProvider, this._byokStorageService));
		this._providers.set(CustomOAIBYOKModelProvider.providerName.toLowerCase(), this._instantiationService.createInstance(CustomOAIBYOKModelProvider, this._byokStorageService));

		for (const [providerName, provider] of this._providers) {
			try {
				this._byokRegistrations.add(lm.registerLanguageModelChatProvider(providerName, provider));
			} catch (error) {
				this._logService.warn(`BYOK: failed to register provider ${providerName}: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}
	private async fetchKnownModelList(fetcherService: IFetcherService): Promise<Record<string, BYOKKnownModels>> {
		try {
			const data = await (await fetcherService.fetch('https://main.vscode-cdn.net/extensions/copilotChat.json', { method: 'GET', callSite: 'byok-known-models', timeout: 15000 })).json();
			if (data.version !== 1) {
				this._logService.warn('BYOK: Copilot Chat known models list is not in the expected format. Using Pointer fallback model metadata.');
				return this._getFallbackKnownModels();
			}
			this._logService.info('BYOK: Copilot Chat known models list fetched successfully.');
			return { ...this._getFallbackKnownModels(), ...data.modelInfo };
		} catch (error) {
			this._logService.warn(`BYOK: failed to fetch Copilot Chat known models list. Using Pointer fallback model metadata. ${error instanceof Error ? error.message : String(error)}`);
			return this._getFallbackKnownModels();
		}
	}

	private _getFallbackKnownModels(): Record<string, BYOKKnownModels> {
		return {
			[OAIBYOKLMProvider.providerName]: this._known(['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini']),
			[AnthropicLMProvider.providerName]: this._known(['claude-sonnet-4', 'claude-opus-4', 'claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest']),
			[GeminiNativeBYOKLMProvider.providerName]: this._known(['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']),
			[OpenRouterLMProvider.providerName]: this._known(['openai/gpt-4.1', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-pro', 'qwen/qwen3-coder', 'deepseek/deepseek-r1']),
			[XAIBYOKLMProvider.providerName]: this._known(['grok-4', 'grok-3', 'grok-3-mini']),
			[ZAILMProvider.providerName]: this._known(['glm-5.1']),
			[GroqLMProvider.providerName]: this._known(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b']),
			[CustomOAIBYOKModelProvider.providerName]: {},
			[LMStudioLMProvider.providerName]: {},
			[OllamaLMProvider.providerName]: {},
			[AzureBYOKModelProvider.providerName]: {}
		};
	}

	private _known(modelIds: readonly string[]): BYOKKnownModels {
		const models: BYOKKnownModels = {};
		for (const modelId of modelIds) {
			models[modelId] = inferBYOKModelCapabilities(modelId);
		}
		return models;
	}
}
