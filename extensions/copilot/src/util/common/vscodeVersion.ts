/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sanitizes the version of Pointer to remove the minor version bump and -insider suffix
 * @param vsCodeVersion The version of Pointer to sanitize i.e. 1.77.0-insider
 * @returns The sanitized version of Pointer i.e. 1.77
 */
export function sanitizeVSCodeVersion(vsCodeVersion: string): string {
	const splitVersion = vsCodeVersion.split('.');
	return `${splitVersion[0]}.${splitVersion[1]}`;
}