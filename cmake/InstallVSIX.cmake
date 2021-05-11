
if(NOT EXISTS ${CODE_COMMAND})
message(FATAL_ERROR "CODE_COMMAND does not exist. CODE_COMMAND: ${CODE_COMMAND}")
endif()

#
# Uninstalling first helps with strange problems that arise from using Git SHAs as part of the name of the extension
#
# Deliberately ignoring return of uninstall command.
# The extension may or may not have been previously installed, and the exit code is non-0 if nothing was uninstalled
#
execute_process(
  COMMAND
    ${CODE_COMMAND} --uninstall-extension brenton.wolfram
)

execute_process(
  COMMAND
    ${CODE_COMMAND} --install-extension ${VSIX_OUTPUT}
)
