/*
 *  vscode-wolfram
 *
 *  Created by IDE support team on 10/01/24.
 *  Copyright (c) 2024 Wolfram Research. All rights reserved.
 *
 */

import * as vscode from "vscode";
const fs = require('fs');
const os = require('os');
const path = require('path');

export function getUserBaseDirectoryPath(): string {
  if (process.platform === "win32") {
    return path.join(os.homedir(), "AppData", "Roaming", "Wolfram");
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Wolfram");
  }

  return path.join(os.homedir(), ".Wolfram");
}

export class FindKernel {

  private readonly linuxKernelPath = [

    "/usr/local/Wolfram/Wolfram/14.3/Executables/WolframKernel",
    "/usr/local/Wolfram/WolframEngine/14.3/Executables/WolframKernel",

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

    "C:\\Program Files\\Wolfram Research\\Wolfram\\14.3\\WolframKernel.exe",
    "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\14.3\\WolframKernel.exe",

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

    let kernel = config.get<string>("systemPath", "Automatic");

    // kernel is the default value, so resolve to an actual path
    if (kernel == "Automatic") {
      
      kernel = this.getOSKernelPath();
    } else if (!this.isKernelExecutable(kernel)) {

      kernel = this.kernelPathFromInstallPath(kernel);

    }

    return kernel
  }

  private isKernelExecutable(p: string): boolean {
    return p.endsWith("WolframKernel") || p.endsWith("WolframKernel.exe");
  }

  /**
   * Detect whether a given install path is a Wolfram Engine installation.
   *
   * Engine install paths contain "Wolfram Engine" or "WolframEngine" on all platforms:
   *   macOS:   /Applications/Wolfram Engine 14.3.app
   *   Linux:   /usr/local/Wolfram/WolframEngine/14.3
   *   Windows: C:\Program Files\Wolfram Research\Wolfram Engine\14.3
   */
  private isWolframEngine(installPath: string): boolean {
    return /Wolfram\s*Engine/i.test(installPath);
  }

  /**
   * Resolve the path to the `wolfram` (non-kernel) executable.
   *
   * Used for MCP server launches which require `wolfram` rather than `WolframKernel`.
   * On Windows, replaces the kernel filename directly. On macOS/Linux, verifies
   * the sibling `wolfram` executable exists (it may not in Engine installs where
   * executables live in a nested Wolfram Player.app) and falls back to the kernel path.
   */
  public resolveMCPWolframExecutable(): string {
    const kernelPath = this.resolveKernel();
    if (process.platform === "win32") {
      return kernelPath.replace("WolframKernel.exe", "wolfram.exe");
    }
    const wolframPath = kernelPath.replace("WolframKernel", "wolfram");
    if (fs.existsSync(wolframPath)) {
      return wolframPath;
    }
    return kernelPath;
  }

  private kernelPathFromInstallPath(installPath: string): string {
    switch (process.platform) {
      case "darwin":
        if (this.isWolframEngine(installPath)) {
          return path.join(installPath, "Contents", "Resources", "Wolfram Player.app", "Contents", "MacOS", "WolframKernel");
        }
        return path.join(installPath, "Contents", "MacOS", "WolframKernel");
      case "win32":
        return path.join(installPath, "WolframKernel.exe");
      case "linux":
        return path.join(installPath, "Executables", "WolframKernel");
      default:
        return installPath;
    }
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
        possibleKernelPaths = [
          ...this.macKernelPath,
          ...this.findVersionedMacEngineKernels()
        ];
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

  /**
   * Scan /Applications for versioned Wolfram Engine installs (e.g. "Wolfram Engine 14.3.app")
   * and return their kernel paths sorted newest-first.
   *
   * Versioned Engine apps use a nested layout where the actual kernel lives inside
   *   Contents/Resources/Wolfram Player.app/Contents/MacOS/WolframKernel
   * rather than the usual Contents/MacOS/WolframKernel. We check for the nested
   * path first and fall back to the direct one.
   */
  private findVersionedMacEngineKernels(): string[] {
    const appsDir = "/Applications";
    try {
      const entries = fs.readdirSync(appsDir);
      const engineApps = entries
        .filter((name: string) => /^Wolfram Engine \d+\.\d+\.app$/.test(name))
        .sort((a: string, b: string) => {
          const vA = a.match(/(\d+\.\d+)/)?.[1] || "0";
          const vB = b.match(/(\d+\.\d+)/)?.[1] || "0";
          return parseFloat(vB) - parseFloat(vA);
        });
      
      const kernels: string[] = [];
      for (const app of engineApps) {
        const appPath = path.join(appsDir, app);
        kernels.push(this.kernelPathFromInstallPath(appPath));
      }
      return kernels;
    } catch {
      return [];
    }
  }


  };
  