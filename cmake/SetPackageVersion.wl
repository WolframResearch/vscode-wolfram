(* Function to set the version in package.json *)

Clear[SetPackageVersion];
SetPackageVersion[packageJsonSource_String, version_String] :=
    Block[{packageJson},
        (* Pause[1]; TODO: Find a way to set this from ${BUG349779_PAUSE} *)
        Print["Importing package.json"];
        packageJson = Import[packageJsonSource];
        packageJson = packageJson /. ("version" -> _) -> ("version" -> version);
        Print["Exporting package.json"];
        Export[
            packageJsonSource,
            (* Correct for some weird Export behavior. *)
            StringReplace[
                ExportString[packageJson, "JSON"],
                {
                    "\\/" -> "/",
                    "\":" -> "\": "
                }
            ],
            "String"
        ];
        Print["Finished updating package.json"];
    ]