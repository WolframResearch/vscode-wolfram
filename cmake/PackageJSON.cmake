include (GetGitRevisionDescription)

macro(CheckPackageJSON)

  if(NOT EXISTS ${WOLFRAMKERNEL})
  message(FATAL_ERROR "WOLFRAMKERNEL does not exist. WOLFRAMKERNEL: ${WOLFRAMKERNEL}")
  endif()

  if(LOCAL_BUILD)
    message(STATUS "PackageJSON version ignored in local build")
    get_git_head_revision(GIT_REVSPEC GIT_SHA1)
    message(STATUS "GIT_SHA1: ${GIT_SHA1}")
    if (GIT_SHA1)
    string(SUBSTRING "${GIT_SHA1}" 0 8 GIT_SHA1)
    set(LOCAL_BUILD_VERSION "999.9.9-local+${GIT_SHA1}")
    else()
    set(LOCAL_BUILD_VERSION "999.9.9-local")
    endif()
    message(STATUS "Local build version: ${LOCAL_BUILD_VERSION}")
  else()
    #
    # if not local build, then get version from package.json
    #
    execute_process(
      COMMAND
        #
        # specify -run here instead of the usual -runfirst
        # need to use -run to allow Import[JSON] to work
        #
        ${WOLFRAMKERNEL} -noinit -noprompt -nopaclet -nostartuppaclets -run Pause[${BUG349779_PAUSE}]\;Print[OutputForm[StringReplace["version"\ /.\ Import["${PACKAGEJSON_IN_SOURCE}",\ "JSON"],\ "@"\ ~~\ version___\ ~~\ "@"\ :>\ version]]]\;Exit[]
      OUTPUT_VARIABLE
        PACKAGEJSON_VERSION
      OUTPUT_STRIP_TRAILING_WHITESPACE
      WORKING_DIRECTORY
        ${PROJECT_SOURCE_DIR}
      TIMEOUT
        60
      RESULT_VARIABLE
        PACKAGEJSON_RESULT
    )

    if(NOT ${PACKAGEJSON_RESULT} EQUAL "0")
      message(FATAL_ERROR "Bad exit code from PackageJSON script: ${PACKAGEJSON_RESULT}")
    endif()

  endif(LOCAL_BUILD)

  message(STATUS "PACKAGEJSON_VERSION: ${PACKAGEJSON_VERSION}")

endmacro(CheckPackageJSON)
