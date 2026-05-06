/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IConfigurationService } from '../../../platform/configuration/common/configurationService';
import { ILogService } from '../../../platform/log/common/logService';
import { IFetcherService } from '../../../platform/networking/common/fetcherService';
import { IExperimentationService } from '../../../platform/telemetry/common/nullExperimentationService';
import { IInstantiationService } from '../../../util/vs/platform/instantiation/common/instantiation';
import { BYOKKnownModels, BYOKModelCapabilities } from '../common/byokProvider';
import { AbstractOpenAICompatibleLMProvider } from './abstractLanguageModelChatProvider';
import { IBYOKStorageService } from './byokStorageService';

interface ZAIModelData {
	id: string;
	name?: string;
	context_length?: number;
	max_context_length?: number;
}

export class ZAILMProvider extends AbstractOpenAICompatibleLMProvider {

	public static readonly providerId = 'zai';
	public static readonly providerName = 'Z.AI';

	constructor(
		knownModels: BYOKKnownModels,
		byokStorageService: IBYOKStorageService,
		@IFetcherService fetcherService: IFetcherService,
		@ILogService logService: ILogService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IConfigurationService configurationService: IConfigurationService,
		@IExperimentationService expService: IExperimentationService
	) {
		super(
			ZAILMProvider.providerId,
			ZAILMProvider.providerName,
			knownModels,
			byokStorageService,
			fetcherService,
			logService,
			instantiationService,
			configurationService,
			expService
		);
	}

	protected override getModelsBaseUrl(configuration: { baseUrl?: string; url?: string } | undefined): string | undefined {
		return configuration?.baseUrl ?? configuration?.url ?? 'https://api.z.ai/api/coding/paas/v4';
	}

	protected override resolveModelCapabilities(modelData: unknown): BYOKModelCapabilities | undefined {
		const zaiModelData = modelData as ZAIModelData;
		const contextLength = zaiModelData.context_length ?? zaiModelData.max_context_length ?? 128000;
		return {
			name: zaiModelData.name ?? zaiModelData.id,
			toolCalling: true,
			vision: false,
			maxInputTokens: contextLength - 8192,
			maxOutputTokens: 8192
		};
	}
}
