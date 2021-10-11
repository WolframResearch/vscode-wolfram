
file(READ ${COPIED_README} filedata)

string(REGEX REPLACE "<!--  filter me START -->.*<!--  filter me END -->" "" filedata ${filedata})

file(WRITE ${COPIED_README} "${filedata}")
