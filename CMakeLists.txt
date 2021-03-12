
#
# https://cmake.org/cmake/help/latest/release/3.15.html
# The cmake(1) command gained a new --install option. This may be used after building a project to run installation without using the generated build system or the native build tool.
#
cmake_minimum_required(VERSION 3.15)

project(vscode-wolframlanguage
	LANGUAGES
		NONE
)

set(CMAKE_MODULE_PATH "${PROJECT_SOURCE_DIR}/cmake" ${CMAKE_MODULE_PATH})
include(WolframKernel)
include(PackageJSON)

#
# Related issues: CODETOOLS-77
#
find_program(NPM_COMMAND
	NAMES
		npm.cmd npm
)

find_program(CODE_COMMAND
	NAMES
		code.cmd code
)

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
if(LOCAL_BUILD)
message(STATUS "Configuring for local build")
endif()
message(STATUS "BUG349779_PAUSE: ${BUG349779_PAUSE}")
message(STATUS "BUG349779_TIMEOUT: ${BUG349779_TIMEOUT}")
message(STATUS "NPM_COMMAND: ${NPM_COMMAND}")
message(STATUS "CODE_COMMAND: ${CODE_COMMAND}")

set(STATIC_VSIX_SOURCES
	${PROJECT_SOURCE_DIR}/themes/brenton-wl-theme.json
	${PROJECT_SOURCE_DIR}/src/extension.ts
	${PROJECT_SOURCE_DIR}/syntaxes/wolfram.tmLanguage.json
	${PROJECT_SOURCE_DIR}/wolfram.language-configuration.json
)

set(PACKAGEJSON_IN_SOURCE
	${PROJECT_SOURCE_DIR}/package.json.in
)


#
# Set VERSION_NUMBER, SYSTEMID, and PACKAGEJSON_VERSION
#
CheckWolframKernel()
CheckPackageJSON()


set(GENERATED_PACKAGEJSON ${PROJECT_SOURCE_DIR}/package.json)

add_custom_command(
	OUTPUT
		${GENERATED_PACKAGEJSON}
	COMMAND
		${CMAKE_COMMAND} -E copy ${PACKAGEJSON_IN_SOURCE} ${GENERATED_PACKAGEJSON}
	COMMAND
		${CMAKE_COMMAND} -DLOCAL_BUILD=${LOCAL_BUILD} -DLOCAL_BUILD_VERSION=${LOCAL_BUILD_VERSION} -DGENERATED_PACKAGEJSON=${GENERATED_PACKAGEJSON} -P ${PROJECT_SOURCE_DIR}/cmake/ReplacePackageJSON.cmake
	COMMAND
		${NPM_COMMAND} --no-fund install --no-save
	DEPENDS
		${PACKAGEJSON_IN_SOURCE}
		${PROJECT_SOURCE_DIR}/cmake/ReplacePackageJSON.cmake
)


#
# vsix target
#

set(VSIX_SOURCES
	${PACKAGEJSON_IN_SOURCE}
	${STATIC_VSIX_SOURCES}
)

if(LOCAL_BUILD)
set(VSIX_OUTPUT ${PROJECT_BINARY_DIR}/wolfram-${LOCAL_BUILD_VERSION}.vsix)
else(LOCAL_BUILD)
set(VSIX_OUTPUT ${PROJECT_BINARY_DIR}/wolfram-${PACKAGEJSON_VERSION}.vsix)
endif(LOCAL_BUILD)

add_custom_target(vsix
	ALL
	DEPENDS
		${VSIX_OUTPUT}
)

add_custom_command(
	OUTPUT
		${VSIX_OUTPUT}
	COMMAND
		vsce package -o ${PROJECT_BINARY_DIR}
	DEPENDS
		${VSIX_SOURCES}
		${GENERATED_PACKAGEJSON}
	VERBATIM
	WORKING_DIRECTORY
		${PROJECT_SOURCE_DIR}
)

install(
	CODE
		"execute_process(COMMAND ${CODE_COMMAND} --install-extension ${VSIX_OUTPUT} --force)"
	COMPONENT
		vsix
)
