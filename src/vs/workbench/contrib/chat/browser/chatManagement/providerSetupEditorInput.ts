/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../../base/common/themables.js';
import * as nls from '../../../../../nls.js';
import { registerIcon } from '../../../../../platform/theme/common/iconRegistry.js';
import { EditorInputCapabilities, IUntypedEditorInput } from '../../../../common/editor.js';
import { EditorInput } from '../../../../common/editor/editorInput.js';

const providerSetupEditorIcon = registerIcon('provider-setup-editor-label-icon', Codicon.server, nls.localize('providerSetupEditorLabelIcon', 'Icon of the Provider Setup editor label.'));

export class ProviderSetupEditorInput extends EditorInput {

	static readonly ID: string = 'workbench.input.providerSetup';

	readonly resource = undefined;

	override get capabilities(): EditorInputCapabilities {
		return super.capabilities | EditorInputCapabilities.Singleton;
	}

	constructor() {
		super();
	}

	override matches(otherInput: EditorInput | IUntypedEditorInput): boolean {
		return super.matches(otherInput) || otherInput instanceof ProviderSetupEditorInput;
	}

	override get typeId(): string {
		return ProviderSetupEditorInput.ID;
	}

	override getName(): string {
		return nls.localize('providerSetupEditorInputName', "Language Models");
	}

	override getIcon(): ThemeIcon {
		return providerSetupEditorIcon;
	}

	override async resolve(): Promise<null> {
		return null;
	}
}
