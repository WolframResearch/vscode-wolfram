(* ::Package:: *)
(* 

  /*
  *  vscode-wolfram
  *
  *  Created by IDE support team on 10/01/24.
  *  Copyright (c) 2024 Wolfram Research. All rights reserved.
  *
  */



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

*)

(* ::Section:: *)
(*Import*)
BeginPackage["VsCodeWolfram`"]

(* ::Section:: *)
(*Initialization*)

Begin["`Private`"]



timeString[] := DateString[{"Hour24", "-", "Minute", "-", "Second", " "}]

SetAttributes[logWrite,HoldAllComplete];
logWrite[message_]:=WriteString[Streams["stdout"],message];

logWriteFile[message_] := WriteString[$file, timeString[] //OutputForm, message];
logError[message_]:=(WriteString[Streams["stdout"],"<ERROR> "<>message];Exit[];)
$lineNumber = 0;

(* TODO: better WL server side logging when user chooses  *)

$file = FileNameJoin[{$TemporaryDirectory, "Wolfram", "Log", "WL-NB-server-Log-" <> timeString[] <> ".txt"}];

If[FileExistsQ[$file], DeleteFile[$file]];
$file = CreateFile[$file];

logWrite["< INITIALIZATION STARTS >"];
logWrite[TemplateApply["Available kernel processes = ``", ToExpression["$MaxLicenseProcesses - $LicenseProcesses"]]];
logWriteFile[ "< INITIALIZATION STARTS >\n"];
logWriteFile[ "< Test STARTS > " <> timeString[] <> " - \n"];


displayMessage[Hold[Message[m : MessageName[p_, t_], args___], True]] := Block[{msgs, $messagefile},
  UpdateOutputQueue[MessageHeader @@ {ToString[Unevaluated[p]], t}]; handleOutput[];

  msgs = ToString[StringForm[ToString[Unevaluated[p]] <> "::" <> t <> ": " <> If[StringQ[m], m, ReplacePart[m, 1 -> General]], args]];

  UpdateOutputQueue[TextHeader[msgs]]; handleOutput[]; 

];

messageHandler = If[Last[#], displayMessage[#]]&;
Internal`AddHandler["Message", messageHandler];

$hasZeroMQ = (Quiet@Needs["ZeroMQLink`"]=!=$Failed);
$hasCodeParser = (Quiet@Needs["CodeParser`"]=!=$Failed);


If[$VersionNumber<12.0,
  logError["Version 12.0 or higher is required."];Exit[];
];


If[!$hasZeroMQ,
  logError["Failed to load ZeroMQLink` package."];Exit[];
];


(* ::Section:: *)
(* Config *)


If[Head[zmqPort]===Integer&&0<zmqPort<65536,Null,zmqPort=Null];


$config=<|
  "imageScalingFactor" -> <|"value"-> 0.6,"requires"->((Head[#]=== Real|| Head[#] === Integer) && #>0&)|>, (* Value determined by trial and error or what looks good in screen *)
  "storeOutputExpressions"-> <|"value"->True,"requires"->(#===True||#===False&)|>,
  "outputSizeLimit"-> <|"value"->5000(*KB*),"requires"->(Head[#]===Integer&&#>0&)|>,
  "boxesTimeLimit"-><|"value"->5000(*ms*),"requires"->(Head[#]===Integer&&#>0&)|>,
  "htmlTimeLimit"-><|"value"->10000(*ms*),"requires"->(Head[#]===Integer&&#>0&)|>,
  "htmlMemoryLimit"-><|"value"->200(*MB*),"requires"->(Head[#]===Integer&&#>0&)|>,
  "imageWithTransparency"-><|"value"-> False,"requires"->(#===True||#===False&)|>,
  "renderAsImages"-><|"value"->True,"requires"->(#===True||#===False&)|>,
  "invertBrightnessInDarkThemes"-><|"value"->True,"requires"->(#===True||#===False&)|>
|>;


$setKernelConfig[name_,value_]:=Module[{entry=$config[name]},
  If[MissingQ[entry],
    logWrite[ToString[name]<>" is not a valid config name to be set."];,
    If[!TrueQ[entry["requires"][value]],
      logWrite[ToString[value]<>" is not a valid value of "<>ToString[name]<>"."];Return[];,
      $config[name]["value"]=value;
    ];
  ];
];


$getKernelConfig[name_]:=If[MissingQ[$config[name]],
  logWrite[ToString[name]<>" is not a valid config name to be read"];0,
  $config[name]["value"]
];


(* ::Section:: *)
(* Message handling functions *)

$evaluating=Null;

$evaluationQueue=<||>;
$outputQueue=<||>;

$currentOutputMessage="";
$previousOutputMessage="";

$inputName="Null";
$outputName="Null";

$messagedebug=Null;




ClearAll[queuePush,queuePop,stackPush,stackPop,stackClear];
SetAttributes[{queuePush, queuePop,stackPush,stackPop,stackClear}, HoldFirst];
queuePush[q_, value_]:=Module[{},AssociateTo[q, $ModuleNumber->value]];
queuePop[q_]:=If[Length[q]>0,With[{first=Take[q,1]},KeyDropFrom[q, Keys@first];first[[1]]],Null];
stackPush[q_, value_]:=Module[{},AssociateTo[q, $ModuleNumber->value]];
stackPop[q_]:=If[Length[q]>0,With[{last=Take[q,-1]},KeyDropFrom[q, Keys@last];last[[1]]],Null];
stackClear[q_]:=Module[{},q=<||>];


ClearAll[sendMessage,readMessage];
sendMessage[message_ByteArray]:=ZeroMQLink`ZMQSocketWriteMessage[$zmqserver,message];
sendMessage[message_Association]:=sendMessage[StringToByteArray@Developer`WriteRawJSONString[message,"Compact"->True]];
sendMessage[message_]:=sendMessage[StringToByteArray[ToString[message],"UTF-8"]];
readMessage[timeout_:1.0]:=Module[{ready=SocketReadyQ[$zmqserver,timeout]},If[ready,ByteArrayToString[SocketReadMessage[$zmqserver],"UTF-8"],$Failed]];





(* ::Section:: *)
(* Output Handler *)


	(* check if a string contains any private use area characters *)
	containsPUAQ[str_] :=
		AnyTrue[
			ToCharacterCode[str, "Unicode"],
			(57344 <= #1 <= 63743 || 983040 <= #1 <= 1048575 || 1048576 <= #1 <= 1114111) &
		];

(************************************
	utility for determining if a
		result should be displayed
		as text or an image
*************************************)

	(* determine if a result does not depend on any Wolfram Language frontend functionality,
		such that it should be displayed as text *)
	textQ[ExpressionHeader[expr_]] := Module[
		{
			(* the head of expr *)
			exprHead,

			(* pattern objects *)
			pObjects
		}, 

		(* if we cannot use the frontend, use text *)
		If[
			!$canUseFrontEnd,
			Return[True];
		];

		(* save the head of the expression *)
		exprHead = Head[expr];

		(* if the expression is wrapped with InputForm or OutputForm,
			automatically format as text *)
		If[exprHead === InputForm || exprHead === OutputForm,
			Return[True]
		];

		(* if the FormatType of $Output is set to TeXForm, or if the expression is wrapped with TeXForm,
			and the expression has an acceptable textual form, format as text *)
		If[(exprHead == TeXForm) && !containsPUAQ[ToString[expr]],
			Return[True];
		];

		(* if the FormatType of $Output is set to TraditionalForm,
			or if the expression is wrapped with TraditionalForm,
			do not use text *)
		If[exprHead === TraditionalForm,
			Return[False]
		];

		(* breakdown expr into atomic objects organized by their Head *)
		pObjects = 
			GroupBy[
				Complement[
					Quiet[Cases[
						expr, 
						elem_ /; (Depth[Unevaluated[elem]] == 1) :> Hold[elem], 
						{0, Infinity}, 
						Heads -> True
					]],
					(* these symbols are fine *)
					{Hold[List], Hold[Association]}
				],
				(
					Replace[
						#1,
						Hold[elem_] :> Head[Unevaluated[elem]]
					]
				) &
			];

	   	(* if expr just contains atomic objects of the types listed above, return True *)
		If[
			ContainsOnly[Keys[pObjects], {Integer, Real}],
			Return[True];
	   	];

	   	(* if expr just contains atomic objects of the types listed above, along with some symbols,
	   		return True only if the symbols have no attached rules *)
		If[
			ContainsOnly[Keys[pObjects], {Integer, Real, String, Symbol}],
	   		Return[
				AllTrue[
						Lookup[pObjects, String, {}], 
						(!containsPUAQ[ReleaseHold[#1]]) &
					] &&
		   			AllTrue[
		   				Lookup[pObjects, Symbol, {}], 
		   				(
							Replace[
								#1,
								Hold[elem_] :> ToString[Definition[elem]]
							] === "Null"
		   				) &
		   			]
	   		];
	   	];

	   	(* otherwise, no, the result should not be displayed as text *)
	   	Return[False];
	];


UpdateOutputQueue[outExpr_] := 
Switch[Head[outExpr],

  InputHeader,
    If[
      $evaluating["progress"]==="complete",
      queuePush[$outputQueue,<|
        "uuid" -> $evaluating["uuid"],
        "type" -> InputHeader
      |>];
    ];
    $inputName = outExpr[[1]];

    If[$evaluating["progress"]==="complete",
      sendMessage[<|
        "type" -> "show-input-name",
        "uuid" -> $evaluating["uuid"],
        "name" -> $inputName
      |>];
      $inputName="Null";
    ];
    $evaluating = Null;,

  OutputHeader,
    $outputName = outExpr[[1]];,

  ExpressionHeader,
    queuePush[$outputQueue,<|
      "uuid" -> $evaluating["uuid"],
      "name" -> $outputName,
      "type" -> Head[outExpr],
      "outputExpr" -> outExpr
    |>];
    $outputName="Null";,

  TextHeader|MessageHeader,
    queuePush[$outputQueue,<|
      "uuid" -> $evaluating["uuid"],
      "type" -> Head[outExpr],
      "outputExpr" -> outExpr
    |>];,
  _,
    logWrite["Unexpected output; output = "<>ToString[outExpr]];
];


handleOutput[]:= 
  Module[
        {
            output = queuePop[$outputQueue], boxes, exceedsExprSize, 
            isTraditionalForm=False, isTeXForm=False, shouldStoreText=True, text, html
        },

    $previousOutputMessage = $currentOutputMessage;
    $currentOutputMessage = "";
    Switch[output["type"],

      InputHeader,
        sendMessage[<|
          "type" -> "evaluation-done",
          "uuid" -> output["uuid"]
        |>];,

      ExpressionHeader,
        TimeConstrained[
          exceedsExprSize=!TrueQ[ByteCount[output["outputExpr"]]<=$getKernelConfig["outputSizeLimit"]*2^10];
          If[exceedsExprSize,
            output["outputExpr"]=Replace[output["outputExpr"],ExpressionHeader[expr_]:>ExpressionHeader[Short[expr,5]]]
          ];
          boxes=If[(isTraditionalForm=MatchQ[#,ExpressionHeader[BoxData[_,TraditionalForm]]]),
            FormBox[#[[1,1]],TraditionalForm],
            MakeBoxes@@#
          ]&[output["outputExpr"]];
          shouldStoreText=(isTeXForm=StringMatchQ[output["name"],RegularExpression["^Out\\[.+\\]//TeXForm=.*"]])
            ||(!exceedsExprSize&&TrueQ@$getKernelConfig["storeOutputExpressions"]);
          text=If[shouldStoreText,Replace[output["outputExpr"],ExpressionHeader[expr_]:>ToString[Unevaluated[expr],InputForm]],""];
          If[isTeXForm,text=ExportString[text,"RawJSON"];];
          ,
          $getKernelConfig["boxesTimeLimit"]/1000.0,
          boxes=renderingFailed["The conversion to the box representation took too much time."];
          text="$Failed";
        ];

        text = 
        If[
          textQ[output["outputExpr"]], 
          Replace[output["outputExpr"],ExpressionHeader[expr_]:>ToString[Unevaluated[expr], OutputForm]], 
          (* else *)
          "None"
        ];
        
        html=TimeConstrained[
          MemoryConstrained[
            If[$getKernelConfig["renderAsImages"],renderImage,renderHTML][boxes],
            $getKernelConfig["htmlMemoryLimit"]*2^20,
            renderHTML@renderingFailed["Rendering to HTML took much memory."]
          ],
          $getKernelConfig["htmlTimeLimit"]/1000.0,
          renderHTML@renderingFailed["Rendering to HTML took much time."]
        ];
        logWriteFile["Expression html: " <> html <> "\n"];
        sendMessage[<|
          "type"->"show-output",
          "uuid"->output["uuid"],
          "name"->output["name"],
          (* "text"->If[shouldStoreText,text,Null], *)
          "text"-> text,
          "isBoxData"->(TrueQ[isTraditionalForm]&&shouldStoreText),
          "html"->html
        |>];,
      MessageHeader,
        $currentOutputMessage=TemplateApply["``::``", List@@output["outputExpr"]];,
        logWriteFile[logWriteFile[ "handleOutput-- MessageHeader :> " <> ToString[InputForm[output]] <> "\n"]];
      TextHeader,
        logWriteFile[logWriteFile[ "handleOutput-- TextHeader :> " <> ToString[InputForm[output]] <> "\n"]];
        If[StringContainsQ[$previousOutputMessage,"::"]&&StringContainsQ[output["outputExpr"][[1]],$previousOutputMessage],
          sendMessage[<|
            "type"->"show-message",
            "uuid"->output["uuid"],
            "text"->"None",
            "html"->StringJoin["<pre>",StringReplace[
              output["outputExpr"][[1]],
              $previousOutputMessage->("<span class=\"wl-message\">"<>$previousOutputMessage<>"</span>")
            ],"</pre>"]

          |>];
          ,
          sendMessage[<|
            "type"->"show-text",
            "uuid"->output["uuid"],
            "text"-> "None",
            "html"->StringJoin["<pre>",ToString[output["outputExpr"][[1]]],"</pre>"]
          |>];
        ],
      _,
        logWrite["Unknown output type; output="<>ToString[output]];
    ];
  ];

(* ::Section:: *)
(* Message Handler*)

handleMessage[] := Module[ {},

  $message = Quiet @ Developer`ReadRawJSONString[$messagetext];

  If[$message===$Failed,
    logError["Error occured in parsing the previous message.\n$messagetext = "<>ToString[$messagetext]];
    Return[];
  ];

  Module[{uuid,match,syntaxErrors},
    Switch[$message["type"],

      "test",
          sendMessage[<|"type"->"test","text"->$message["text"],"version"->$Version|>];,

      "evaluate-cell",
          If[SyntaxQ[$message["text"]],

            logWriteFile[ "handleMessage-- $message (evaluate-cell) :> " <> ToString[InputForm[$message]] <> "\n"];

          ,(* else *)

            If[$hasCodeParser,
              syntaxErrors=Cases[CodeParser`CodeParse[$message["text"]],(ErrorNode|AbstractSyntaxErrorNode|UnterminatedGroupNode|UnterminatedCallNode)[___],Infinity];
              logWriteFile["The expression has the following syntax errors: "<>ToString[syntaxErrors]];
              ,
              syntaxErrors={};
              logWriteFile["The expression has syntax errors (CodeParser` is unavailable)"];
            ];

            queuePush[$outputQueue,<|
              "uuid" -> $message["uuid"],
              "type" -> TextHeader,
              "outputExpr" -> TextHeader[#]
            |> &@ StringRiffle[
              If[Length[syntaxErrors]==0,{"Syntax error at character "<>ToString@SyntaxLength[$message["text"]]},
                TemplateApply["Syntax error `` at line `` column ``",{ToString[#1],Sequence@@#3[CodeParser`Source][[1]]}]&@@@syntaxErrors
              ],"\n"
            ]];
            
            queuePush[$outputQueue,<|
              "uuid"->$message["uuid"],
              "type"->InputHeader
            |>];

          ];
          
          queuePush[$evaluationQueue,<|
            "uuid" -> $message["uuid"],
            "text" -> $message["text"],
            "type" -> "evaluate-cell",
            "progress"-> "complete"
          |>];

          logWriteFile[ "handleMessage-- $evaluationQueue :> " <> ToString[InputForm[$evaluationQueue]] <> "\n"];
        ,
      "set-config",
          KeyValueMap[$setKernelConfig,$message["config"]];,

      "evaluate-front-end",
          If[SyntaxQ@$message["text"],
            Quiet@If[$message["aync"]===True,
              With[{expr=$message["text"]},LocalSubmit[ToExpression[expr]];];,
              ToExpression[$message["text"]]
            ];
          ,(* else *)
            
            logWrite["Syntax error in the previous front end evaluation: " <> $message["text"]];
          ],
      _,
          logWrite["Unknown message type; message="<>ToString[$message]];
    ];
  ];
];




(* ::Section:: *)
(* Evaluation Handler*)

Unprotect[Print];

Print[args___] := Block[{$inPatch = True, printStrm, printfile},
        printStrm = OpenWrite[FileNameJoin[{$TemporaryDirectory, "testfile.txt"}], FormatType -> OutputForm];
        AppendTo[$Output, printStrm];
        Print[args];
        $Output = DeleteCases[$Output, printStrm];
        printfile = Close[printStrm];
        UpdateOutputQueue[TextHeader[Read[printfile, Record, RecordSeparators -> {}]]];
        Close[printfile];

        DeleteFile[printfile];
        handleOutput[];
        
        ]/;Not[TrueQ[$inPatch]];

Protect[Print];



handleEvaluation[]:=Module[{eval, res, strm, input, inputString, fullEval, printfile},

  (* 
    Message for evaluation:
    <|3358 -> <|"uuid" -> "...", "text" -> "2+2\n2+3\n2+4\n", "type" -> "evaluate-cell", "progress" -> "complete"|>|> 
  *)

  logWriteFile[ "handleEvaluation: Entry $evaluationQueue :> " <> ToString[InputForm[$evaluationQueue]] <> "\n"];

  $evaluating = queuePop[$evaluationQueue];

  (* 
    <|"uuid" -> "...", "text" -> "2+2\n2+3\n2+4\n", "type" -> "evaluate-cell", "progress" -> "complete"|> 
  *)

  If[$evaluating["type"] === "evaluate-cell",
    strm = StringToStream[$evaluating["text"]];
    evalRes = 0; 
    fullEval = {};

    While[evalRes =!= EndOfFile,

      input = Read[strm, Hold[Expression]];

      logWriteFile[ "handleEvaluation: input :> \n" <> ToString[InputForm[input]] <> "\n"];
      
      evalRes =  ReleaseHold[input];
      
      
      If[evalRes =!= EndOfFile,
        
        $lineNumber = $lineNumber + 1;

        Unprotect[In, Out, $Line];
				$Line = $lineNumber + 1;
        With[{in = input}, In[$lineNumber] := ReleaseHold[in]];
        Out[$lineNumber] = evalRes;
        Protect[In, Out, $Line];

        inputString = "In[" <> ToString[$lineNumber] <> "]:= ";

        UpdateOutputQueue[OutputHeader["Out[" <> ToString[$lineNumber] <> "]= "]];
        If[evalRes =!= Null, UpdateOutputQueue[ExpressionHeader[evalRes]]];

        handleOutput[]
      ];

    ];
  ];

  UpdateOutputQueue[InputHeader[inputString]];
  handleOutput[];
   
];


(* ::Section:: *)
(* Communication settings *)

$zmqserver=SocketOpen[{"127.0.0.1",zmqPort},"ZMQ"];
If[Head[$zmqserver]=!=SocketObject,logError["Failed to create a ZeroMQ local server on port "<>ToString[zmqPort]<>"."];Exit[];];
logWrite[TemplateApply["[address tcp://127.0.0.1:``]\n",$zmqserver["DestinationPort"]]];


logWrite["<INITIALIZATION ENDS>"];
logWriteFile[ "<INITIALIZATION ENDS>\n"];


(* ::Section:: *)
(* Main message loop *)

While[True,

  $messagetext=readMessage[0.03];

  If[Not[FailureQ[$messagetext]],

    logWriteFile[ "================================ Message cycle starts ========================================\n"];
    logWriteFile[ "MesageLoop:> $messagetext :> " <> StringTake[ToString[InputForm[$messagetext]], UpTo[100]] <> "\n"];
  ];

  If[Head[$messagetext]===String,
    handleMessage[];
  ];

  If[Length[$evaluationQueue] > 0,
    logWriteFile[ "MesageLoop:>  $evaluationQueue :> " <> ToString[InputForm[$evaluationQueue]] <> "\n"];
    handleEvaluation[];
  ];

  If[Length[$outputQueue] > 0,
    logWriteFile[ "MesageLoop:>  $outputQueue :> " <> ToString[InputForm[$outputQueue]] <> "\n"];
    handleOutput[];
  ];

];


End[]

EndPackage[]

(* ::Section:: *)
(*End*)
