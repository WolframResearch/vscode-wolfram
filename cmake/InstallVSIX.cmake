
if(NOT EXISTS ${CODE_COMMAND})
message(FATAL_ERROR "CODE_COMMAND does not exist. CODE_COMMAND: ${CODE_COMMAND}")
endif()

#
# why multiple execute_process() calls ?
#
# https://cmake.org/cmake/help/latest/command/execute_process.html
# If a sequential execution of multiple commands is required, use multiple execute_process() calls with a single COMMAND argument.
#

execute_process(
  COMMAND
    ${CMAKE_COMMAND} -E echo "code version:"
)

execute_process(
  COMMAND
    ${CODE_COMMAND} --version
)

#
# Uninstalling first helps with strange problems that arise from using Git SHAs as part of the name of the extension
#
# Deliberately ignoring return of uninstall command.
# The extension may or may not have been previously installed, and the exit code is non-0 if nothing was uninstalled
#
execute_process(
  COMMAND
    ${CODE_COMMAND} --uninstall-extension WolframResearch.wolfram
)

execute_process(
  COMMAND
    ${CODE_COMMAND} --install-extension ${VSIX_OUTPUT}
)
