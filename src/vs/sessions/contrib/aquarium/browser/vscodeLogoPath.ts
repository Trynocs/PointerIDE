/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Pointer logo silhouette path, extracted from sessions/contrib/chat/browser/media/vscode-icon.svg.
// The aquarium cannot use that SVG file directly because each fish renders the
// logo as live, same-document SVG geometry: fish.ts stores this path in a
// shared <symbol>, then renders clipped <use> slices with staggered CSS
// animations. That keeps the swimming-strip effect, currentColor species
// tinting, and auxiliary-window support while avoiding duplicate path parsing
// per fish.
export const POINTER_LOGO_PATH = 'M14.9 49.1c-4.6-1.9-4.7-8.2-.1-10.1l61.3-24.9c4.7-1.9 9.3 2.7 7.4 7.4L58.6 82.8c-1.9 4.6-8.2 4.5-10.1-.1L38.2 57.3 14.9 49.1Z';
