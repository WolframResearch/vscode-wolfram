/*
 *  vscode-wolfram
 *
 *  Created by IDE support team on 10/01/24.
 *  Copyright (c) 2024 Wolfram Research. All rights reserved.
 *
 */

import * as vscode from "vscode";
const fs = require('fs');

export class FindKernel {

  private readonly linuxKernelPath = [

    // ToDo: Add Wolfram app paths

    "/usr/local/Wolfram/Wolfram/14.2/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/14.2/Executables/WolframKernel",

    "/usr/local/Wolfram/Wolfram/14.1/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/14.1/Executables/WolframKernel",

    "/usr/local/Wolfram/Mathematica/14.0/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/14.0/Executables/WolframKernel",

    "/usr/local/Wolfram/Mathematica/13.3/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/13.3/Executables/WolframKernel",

    "/usr/local/Wolfram/Mathematica/13.2/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/13.2/Executables/WolframKernel",

    "/usr/local/Wolfram/Mathematica/13.1/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/13.1/Executables/WolframKernel",

    "/usr/local/Wolfram/Mathematica/13.0/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/13.0/Executables/WolframKernel",

    "/usr/local/Wolfram/Mathematica/12.3/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/12.3/Executables/WolframKernel",

    "/usr/local/Wolfram/Mathematica/12.2/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/12.2/Executables/WolframKernel",

    "/usr/local/Wolfram/Mathematica/12.1/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/12.1/Executables/WolframKernel"

  ];

  private readonly macKernelPath = [

    "/Applications/Wolfram.app/Contents/MacOS/WolframKernel",
    "/Applications/Mathematica.app/Contents/MacOS/WolframKernel",
    "/Applications/Wolfram Engine.app/Contents/MacOS/WolframKernel"

  ];

  private readonly winKernelPath = [

    "C:\\Program Files\\Wolfram Research\\Wolfram\\14.2\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\14.2\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Wolfram\\14.1\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\14.1\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Mathematica\\14.0\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\14.0\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Mathematica\\13.3\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\13.3\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Mathematica\\13.2\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\13.2\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Mathematica\\13.1\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\13.1\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Mathematica\\13.0\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\13.0\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Mathematica\\12.3\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\12.3\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Mathematica\\12.2\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\12.2\\WolframKernel.exe",

    "C:\\Program Files\\Wolfram Research\\Mathematica\\12.1\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\12.1\\WolframKernel.exe"

  ];
  
  constructor() {

  }

  public resolveKernel():string {

    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("wolfram", null);

    let kernel = config.get<string>("systemKernel", "Automatic",);

    // kernel is the default value, so resolve to an actual path
    if (kernel == "Automatic") {
      
      kernel = this.getOSKernelPath();
    }

    return kernel
  }
  
  
  private getOSKernelPath():string {
  
    let possibleKernelPaths: string[];
  
    switch (process.platform) {
      
      case "linux":
        //
        // generally recommend newer versions over older versions
        // and recommend pre-13.0 Wolfram Engine last, because usage messages did not work before 13.0
        //
        possibleKernelPaths = this.linuxKernelPath;
        break;
      case "darwin":
        possibleKernelPaths = this.macKernelPath;
        break;
      case "win32":
        //
        // generally recommend newer versions over older versions
        // and recommend pre-13.0 Wolfram Engine last, because usage messages did not work before 13.0
        //
        possibleKernelPaths = this.winKernelPath;
        break;
      default:
        possibleKernelPaths = [];
        break;
    }
  
    let res = possibleKernelPaths.find(k => fs.existsSync(k));

    if (res === undefined) {
      res = "kernel-not-found"
    }
    
    return res;
  }


  };
  