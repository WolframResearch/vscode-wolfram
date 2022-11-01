include (GetGitRevisionDescription)

macro(CheckPackageJSON)

  if(NOT EXISTS ${WOLFRAMKERNEL})
  message(FATAL_ERROR "WOLFRAMKERNEL does not exist. WOLFRAMKERNEL: ${WOLFRAMKERNEL}")
  endif()

  execute_process(
    COMMAND
      #
      # specify -run here instead of the usual -runfirst
      # need to use -run to allow Import[JSON] to work
      #
      ${WOLFRAMKERNEL} -noinit -noprompt -nopaclet -nostartuppaclets -run Pause[${KERNEL_PAUSE}]\;Print[OutputForm[StringReplace["version"\ /.\ Import["${PACKAGEJSON_SOURCE}",\ "JSON"],\ version___\ :>\ version]]]\;Exit[]
    OUTPUT_VARIABLE
      PACKAGEJSON_VERSION
    OUTPUT_STRIP_TRAILING_WHITESPACE
    WORKING_DIRECTORY
      ${PROJECT_SOURCE_DIR}
    TIMEOUT
      ${KERNEL_TIMEOUT}
    RESULT_VARIABLE
      PACKAGEJSON_RESULT
  )

  if(NOT ${PACKAGEJSON_RESULT} EQUAL "0")
    message(FATAL_ERROR "Bad exit code from PackageJSON script: ${PACKAGEJSON_RESULT}")
  endif()

  message(STATUS "PACKAGEJSON_VERSION: ${PACKAGEJSON_VERSION}")

endmacro(CheckPackageJSON)
