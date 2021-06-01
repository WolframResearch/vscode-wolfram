
file(READ ${GENERATED_PACKAGEJSON} filedata)

if(LOCAL_BUILD)

string(REGEX REPLACE "\"version\": \"@([0-9]+\\.[0-9]+\\.[0-9]+)@\"" "\"version\": \"${LOCAL_BUILD_VERSION}\"" filedata ${filedata})

else()

string(REGEX REPLACE "\"version\": \"@([0-9]+\\.[0-9]+\\.[0-9]+)@\"" "\"version\": \"\\1\"" filedata ${filedata})

endif()

file(WRITE ${GENERATED_PACKAGEJSON} "${filedata}")



file(READ ${GENERATED_PACKAGELOCKJSON} filedata)

if(LOCAL_BUILD)

string(REGEX REPLACE "\"version\": \"@([0-9]+\\.[0-9]+\\.[0-9]+)@\"" "\"version\": \"${LOCAL_BUILD_VERSION}\"" filedata ${filedata})

else()

string(REGEX REPLACE "\"version\": \"@([0-9]+\\.[0-9]+\\.[0-9]+)@\"" "\"version\": \"\\1\"" filedata ${filedata})

endif()

file(WRITE ${GENERATED_PACKAGELOCKJSON} "${filedata}")
