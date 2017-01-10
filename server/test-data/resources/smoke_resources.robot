 *** Variables ***

${english_link}=    English
${chinese_link}=    简体中文

*** Keywords ***

Get Software Pages
    [Documentation]    Returns 2 dimensional list containing url and title for webpages
    @{software_finnish}=    Set Variable    ${SERVER}/palvelut/ohjelmistokehitys/    Eficode | Ohjelmistokehitys
    @{software_english}=    Set Variable    ${SERVER}/en/services/software-development/    Eficode | Software
    @{software_chinese}=    Set Variable    ${SERVER}/zh-hans/software-development/    Eficode | Software Development
    [Return]    ${software_finnish}    ${software_english}    ${software_chinese}


Verify urls are valid
    [Documentation]    Loop 2 dimensional list and check that url is valid and has correct title
    [Arguments]    @{valid_pages}
    :FOR    ${page}    IN    @{valid_pages}
    \    Navigate To Location    ${page[0]}
    \    Title Should Be    ${page[1]}

Choose Blog
    [Arguments]    ${blog_name}
    Navigate To Location    ${SERVER}/blogi/
    Title Should Be    Eficode | Blogi
    Click Link    ${blog_name}

Verify Blog
    [Arguments]    ${blog_name}    ${url}
    ${blog_title}=    Generate Title For Blog From Blog Name  ${blog_name}
    Title Should Be    ${blog_title}
    Location Should Be    ${url}

Generate Title For Blog From Blog Name
    [Arguments]    ${blog_name}
    ${blog_title}    Set Variable    Eficode | ${blog_name}
    [Return]    ${blog_title}

Verify English Locale
    Click Link    ${english_link}
    Location Should Be    ${SERVER}/en/

Verify Chinese Locale
    Click Link    ${chinese_link}
    Location Should Be    ${SERVER}/zh-hans/
