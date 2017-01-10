*** Settings ***
Resource            resources/${ENVIRONMENT}.robot
Resource            resources/smoke_resources.robot
Suite Setup         Open Default Browser
Test Setup          Navigate To Frontpage
Suite Teardown      Close Browser

*** Variables ****
${robot_blog_name}=    Automatic testing with Robot Framework pt. 3: Setting up a continuous integration system
${robot_blog_url}=    ${SERVER}/blogi/setting-up-a-ci-system/



*** Test Cases ***

Blog about robotframework should exist
    Choose Blog    ${robot_blog_name}
    Verify Blog    ${robot_blog_name}    ${robot_blog_url}

Changing language should change website language
    Verify English Locale
    Verify Chinese Locale

Software pages should be reachable
    @{valid_pages}=    Get Software Pages
    Verify urls are valid    @{valid_pages}

