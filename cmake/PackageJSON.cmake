include (GetGitRevisionDescription)

macro(CheckPackageJSON)

  if(NOT EXISTS ${WOLFRAMKERNEL})
  message(FATAL_ERROR "WOLFRAMKERNEL does not exist. WOLFRAMKERNEL: ${WOLFRAMKERNEL}")
  endif()

  if(LOCAL_BUILD)
    message(STATUS "PackageJSON Version ignored in local build")
    set(LOCAL_BUILD_VERSION 999.9.9)
    get_git_head_revision(GIT_REVSPEC GIT_SHA1)
    string(SUBSTRING "${GIT_SHA1}" 0 8 GIT_SHA1)
    message(STATUS "Local build version: ${LOCAL_BUILD_VERSION}-${GIT_SHA1}")
    execute_process(
      COMMAND
        ${WOLFRAMKERNEL}
        -noinit
        -noprompt
        -nopaclet
        -run
        "
          Pause[${BUG349779_PAUSE}];
          Get[\"${PROJECT_SOURCE_DIR}/cmake/SetPackageVersion.wl\"];
          SetPackageVersion[\"${PACKAGEJSON_SOURCE}\", \"${LOCAL_BUILD_VERSION}-${GIT_SHA1}\"];
          Exit[]
        "
    )
  else()
    #
    # if not local build, then get Version from package.json
    #
    execute_process(
      COMMAND
        #
        # specify -run here instead of the usual -runfirst
        # need to use -run to allow Import[JSON] to work
        #
        ${WOLFRAMKERNEL} -noinit -noprompt -nopaclet -run Pause[${BUG349779_PAUSE}]\;Print[OutputForm["version"\ /.\ Import["${PACKAGEJSON_SOURCE}",\ "JSON"]]]\;Exit[]
      OUTPUT_VARIABLE
        PACKAGEJSON_VERSION
      OUTPUT_STRIP_TRAILING_WHITESPACE
      WORKING_DIRECTORY
        ${PROJECT_SOURCE_DIR}
      TIMEOUT
        10
      RESULT_VARIABLE
        PACKAGEJSON_RESULT
    )

    if(NOT ${PACKAGEJSON_RESULT} EQUAL "0")
      message(WARNING "Bad exit code from PackageJSON script: ${PACKAGEJSON_RESULT}; Continuing")
    endif()

  endif(LOCAL_BUILD)

  message(STATUS "PACKAGEJSON_VERSION: ${PACKAGEJSON_VERSION}")

endmacro(CheckPackageJSON)
