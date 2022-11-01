
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

find_program(VSCE_COMMAND
	NAMES
		vsce.cmd vsce
)

set(WOLFRAMKERNEL ${WOLFRAMKERNEL_DEFAULT} CACHE FILEPATH "Path to WolframKernel")
set(LOCAL_BUILD OFF CACHE BOOL "Local build")
#
# Time to pause when starting kernel
#
# Work-around for bug 349779 is to pause ~1 second
# bug 349779 was fixed in version 12.0
# 
# Related bugs: 349779
#
set(KERNEL_PAUSE 0 CACHE STRING "Kernel startup pause")
#
# Timeout for starting a kernel and getting a result
#
# RE machines can be very slow when starting a kernel, so we need to be very generous with this timeout
#
# Should be at least 10 minutes = 600 seconds
#
# Evidence suggests that when bug 349779 strikes, the kernel does exit after 30 minutes = 1800 seconds
# bug 349779 was fixed in version 12.0
#
# Related bugs: 349779
# Related issues: RE-514227
#
set(KERNEL_TIMEOUT 600 CACHE STRING "Kernel startup timeout")

message(STATUS "CMAKE_VERSION: ${CMAKE_VERSION}")
message(STATUS "WOLFRAMKERNEL: ${WOLFRAMKERNEL}")
message(STATUS "LOCAL_BUILD: ${LOCAL_BUILD}")
if(LOCAL_BUILD)
message(STATUS "Configuring for local build")
endif()
message(STATUS "KERNEL_PAUSE: ${KERNEL_PAUSE}")
message(STATUS "KERNEL_TIMEOUT: ${KERNEL_TIMEOUT}")
message(STATUS "NPM_COMMAND: ${NPM_COMMAND}")
message(STATUS "CODE_COMMAND: ${CODE_COMMAND}")
message(STATUS "VSCE_COMMAND: ${VSCE_COMMAND}")

set(STATIC_VSIX_SOURCES
	#
	# .png files in docs do not need to be included in build
	#
	# the extension works by referencing the .png files relative to the repo URL
	#
	#${PROJECT_SOURCE_DIR}/docs/error-report.png
	#${PROJECT_SOURCE_DIR}/docs/highlighting.png
	${PROJECT_SOURCE_DIR}/extension/images/icon.png
	${PROJECT_SOURCE_DIR}/extension/src/extension.ts
	${PROJECT_SOURCE_DIR}/extension/syntaxes/wolfram.tmLanguage.json
	${PROJECT_SOURCE_DIR}/extension/themes/brenton-wl-color-theme.json
	${PROJECT_SOURCE_DIR}/extension/themes/brenton-wl-light-color-theme.json
	${PROJECT_SOURCE_DIR}/extension/.vscodeignore
	${PROJECT_SOURCE_DIR}/extension/tsconfig.json
	${PROJECT_SOURCE_DIR}/extension/wolfram.language-configuration.json
)

set(STATIC_ROOT_SOURCES
	${PROJECT_SOURCE_DIR}/CHANGELOG.md
	${PROJECT_SOURCE_DIR}/LICENSE
)

set(README_SOURCE
	${PROJECT_SOURCE_DIR}/README.md
)

set(PACKAGEJSON_IN_SOURCE
	${PROJECT_SOURCE_DIR}/extension/package.json.in
)

set(PACKAGELOCKJSON_IN_SOURCE
	${PROJECT_SOURCE_DIR}/extension/package-lock.json.in
)


#
# Set VERSION_NUMBER, SYSTEMID, and PACKAGEJSON_VERSION
#
CheckWolframKernel()
CheckPackageJSON()

#
# Force re-configure if package.json.in changes, e.g. extension version is changed and name of .vsix has changed
#
set_property(
	DIRECTORY
	APPEND
	PROPERTY
		CMAKE_CONFIGURE_DEPENDS
	${PACKAGEJSON_IN_SOURCE}
	${PACKAGELOCKJSON_IN_SOURCE}
)


file(MAKE_DIRECTORY
	${PROJECT_BINARY_DIR}/extension
)


#
# Copy WL source files
#

#
# static VSIX sources
#
foreach(SRC ${STATIC_VSIX_SOURCES})
	file(RELATIVE_PATH REL ${PROJECT_SOURCE_DIR}/extension/ ${SRC})
	add_custom_command(
		OUTPUT
			${PROJECT_BINARY_DIR}/extension/${REL}
		COMMAND
			${CMAKE_COMMAND} -E copy ${SRC} ${PROJECT_BINARY_DIR}/extension/${REL}
		DEPENDS
			${SRC}
	)
	list(APPEND COPIED_VSIX_SOURCES ${PROJECT_BINARY_DIR}/extension/${REL})
endforeach()

#
# static root sources
#
foreach(SRC ${STATIC_ROOT_SOURCES})
	file(RELATIVE_PATH REL ${PROJECT_SOURCE_DIR}/ ${SRC})
	add_custom_command(
		OUTPUT
			${PROJECT_BINARY_DIR}/extension/${REL}
		COMMAND
			${CMAKE_COMMAND} -E copy ${SRC} ${PROJECT_BINARY_DIR}/extension/${REL}
		DEPENDS
			${SRC}
	)
	list(APPEND COPIED_VSIX_SOURCES ${PROJECT_BINARY_DIR}/extension/${REL})
endforeach()

#
# README
#

set(COPIED_README ${PROJECT_BINARY_DIR}/extension/README.md)

add_custom_command(
	OUTPUT
		${COPIED_README}
	COMMAND
		${CMAKE_COMMAND} -E copy ${README_SOURCE} ${COPIED_README}
	COMMAND
		${CMAKE_COMMAND} -DCOPIED_README=${COPIED_README} -P ${PROJECT_SOURCE_DIR}/cmake/ReplaceREADME.cmake
	DEPENDS
		${README_SOURCE}
)
list(APPEND COPIED_VSIX_SOURCES ${COPIED_README})


#
# vsix target
#

set(VSIX_SOURCES
	${PACKAGEJSON_IN_SOURCE}
	${PACKAGELOCKJSON_IN_SOURCE}
	${COPIED_VSIX_SOURCES}
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


set(GENERATED_PACKAGEJSON ${PROJECT_BINARY_DIR}/extension/package.json)

set(GENERATED_PACKAGELOCKJSON ${PROJECT_BINARY_DIR}/extension/package-lock.json)

add_custom_command(
	OUTPUT
		${VSIX_OUTPUT}
	COMMAND
		${CMAKE_COMMAND} -E echo "NPM version:"
	COMMAND
		#
		# npm --version is not documented
		#
		${NPM_COMMAND} version
	COMMAND
		${CMAKE_COMMAND} -E echo "VSCE version:"
	COMMAND
		${VSCE_COMMAND} --version
	COMMAND
		#
		# copy for every build because this is simple and deterministic
		#
		${CMAKE_COMMAND} -E copy ${PACKAGEJSON_IN_SOURCE} ${GENERATED_PACKAGEJSON}
	COMMAND
		${CMAKE_COMMAND} -E copy ${PACKAGELOCKJSON_IN_SOURCE} ${GENERATED_PACKAGELOCKJSON}
	COMMAND
		${CMAKE_COMMAND} -DLOCAL_BUILD=${LOCAL_BUILD} -DLOCAL_BUILD_VERSION=${LOCAL_BUILD_VERSION} -DGENERATED_PACKAGEJSON=${GENERATED_PACKAGEJSON} -DGENERATED_PACKAGELOCKJSON=${GENERATED_PACKAGELOCKJSON} -P ${PROJECT_SOURCE_DIR}/cmake/ReplacePackageJSON.cmake
	COMMAND
		${NPM_COMMAND} --no-fund install --no-save
	COMMAND
		${VSCE_COMMAND} package -o ${PROJECT_BINARY_DIR}
	DEPENDS
		${VSIX_SOURCES}
		${PROJECT_SOURCE_DIR}/cmake/ReplacePackageJSON.cmake
	VERBATIM
	WORKING_DIRECTORY
		${PROJECT_BINARY_DIR}/extension
)

install(
	CODE
		"execute_process(COMMAND ${CMAKE_COMMAND} -DVSIX_OUTPUT=${VSIX_OUTPUT} \"-DCODE_COMMAND=${CODE_COMMAND}\" -P ${PROJECT_SOURCE_DIR}/cmake/InstallVSIX.cmake)"
	COMPONENT
		vsix
)
