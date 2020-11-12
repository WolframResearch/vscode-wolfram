
cmake_minimum_required(VERSION 3.0)

project(vscode-wolframlanguage
	LANGUAGES
		NONE
)

set(CMAKE_MODULE_PATH "${PROJECT_SOURCE_DIR}/cmake" ${CMAKE_MODULE_PATH})
include(WolframKernel)
include(PackageJSON)

set(WOLFRAMKERNEL ${WOLFRAMKERNEL_DEFAULT} CACHE FILEPATH "Path to WolframKernel")
set(LOCAL_BUILD OFF CACHE BOOL "Local build")
# Work-around for bug 349779 is to pause ~1 second
set(BUG349779_PAUSE 1 CACHE STRING "Bug 349779 pause")

# Evidence suggests that when bug 349779 strikes, the kernel does exit after 30 minutes
# So double that and cross fingers.
#
# Related bugs: 349779
# Related issues: RE-514227
#
set(BUG349779_TIMEOUT 3600 CACHE STRING "Bug 349779 timeout")

message(STATUS "CMAKE_VERSION: ${CMAKE_VERSION}")
message(STATUS "WOLFRAMKERNEL: ${WOLFRAMKERNEL}")
message(STATUS "LOCAL_BUILD: ${LOCAL_BUILD}")
message(STATUS "BUG349779_PAUSE: ${BUG349779_PAUSE}")
message(STATUS "BUG349779_TIMEOUT: ${BUG349779_TIMEOUT}")

if(LOCAL_BUILD)
message(FATAL_ERROR "LOCAL_BUILD is not currently supported.")
endif(LOCAL_BUILD)

set(STATIC_VSIX_SOURCES
	${PROJECT_SOURCE_DIR}/src/extension.ts
	${PROJECT_SOURCE_DIR}/syntaxes/wolfram.tmLanguage.json
	${PROJECT_SOURCE_DIR}/wolfram.language-configuration.json
)

set(PACKAGEJSON_SOURCE
	${PROJECT_SOURCE_DIR}/package.json
)



#
# Set VERSION_NUMBER, SYSTEMID, and PACKAGEJSON_VERSION
#
CheckWolframKernel()
CheckPackageJSON()



#
# vsix target
#

set(VSIX_SOURCES
	${PACKAGEJSON_SOURCE}
	${STATIC_VSIX_SOURCES}
)

if(LOCAL_BUILD)
set(VSIX_OUTPUT ${PROJECT_BINARY_DIR}/wolfram-${LOCAL_BUILD_VERSION}.vsix)
else(LOCAL_BUILD)
set(VSIX_OUTPUT ${PROJECT_BINARY_DIR}/wolfram-${PACKAGEJSON_VERSION}.vsix)
endif(LOCAL_BUILD)

add_custom_target(vsix
	DEPENDS
		${VSIX_OUTPUT}
)

add_custom_command(
	OUTPUT
		${VSIX_OUTPUT}
	DEPENDS
		${VSIX_SOURCES}
	COMMAND
		vsce package -o ${PROJECT_BINARY_DIR}
	VERBATIM
	WORKING_DIRECTORY
		${PROJECT_SOURCE_DIR}
)



