/**
 * enumerate the scripts which this app uses
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2017 akahuku, akahuku@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

loadScripts(
	'SimilarityComputer.js',
	'RuntimeOverwriteSettings.js',
	'ContextMenu.js',
	'Memorandum.js',
	'SyncStorage.js',
	typeof window.Promise == 'undefined' ? 'es6-promise.min.js' : null,
	'marked.js',
	'main.js'
);
