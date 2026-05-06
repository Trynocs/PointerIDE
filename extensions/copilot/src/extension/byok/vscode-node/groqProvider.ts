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

interface GroqModelData {
	id: string;
	object: string;
	owned_by: string;
	context_length?: number;
}

export class GroqLMProvider extends AbstractOpenAICompatibleLMProvider {

	public static readonly providerName = 'Groq';

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
			GroqLMProvider.providerName.toLowerCase(),
			GroqLMProvider.providerName,
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
		return configuration?.baseUrl ?? configuration?.url ?? 'https://api.groq.com/openai/v1';
	}

	protected override resolveModelCapabilities(modelData: unknown): BYOKModelCapabilities | undefined {
		const groqModelData = modelData as GroqModelData;
		const contextLength = groqModelData.context_length ?? 131072;
		return {
			name: groqModelData.id,
			toolCalling: true,
			vision: false,
			maxInputTokens: contextLength - 8192,
			maxOutputTokens: 8192
		};
	}
}
