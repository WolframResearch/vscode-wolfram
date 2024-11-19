// Copyright 2021 Tianhuan Lu
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import errorOverlay from "vscode-notebook-error-overlay";
import type { ActivationFunction } from "vscode-notebook-renderer";
import "../media/reset.css";
import "../media/render.css";

// Fix the public path so that any async import()'s work as expected.
declare const __webpack_relative_entrypoint_to_root__: string;
declare const scriptUrl: string;

__webpack_public_path__ = new URL(scriptUrl.replace(/[^/]+$/, '') + __webpack_relative_entrypoint_to_root__).toString();

export const activate: ActivationFunction = context => {
  
  let mutationObservers: { [key: string]: MutationObserver | undefined } = {};

  return {
    renderOutputItem(data, element) {

      element.innerHTML=data.text();


    },
    disposeOutputItem(outputId) {
      if (typeof outputId === "string") {
        let observer = mutationObservers[outputId];
        observer?.disconnect();
        delete mutationObservers[outputId];
      } else {
        Object.values(mutationObservers).forEach((observer) =>
          observer?.disconnect()
        );
        mutationObservers = {};
      }
    },
  };
};


