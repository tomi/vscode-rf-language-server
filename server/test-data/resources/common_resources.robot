*** Settings ***
Documentation   Common variables and keywords
Library         Selenium2Library  0  implicit_wait=10    # Set explicit wait to 0 and implicit 
Library         Collections

*** Variables ***

*** Keywords ***
Open Default Browser
    Open Browser    ${SERVER}    ${BROWSER}
    Select Window    title=Eficode | Eficode: Excellence in software development
    Maximize Browser Window



Navigate To Frontpage
    Go To  ${SERVER}

Navigate To Location
    [Arguments]    ${url}
    Go To    ${url}
    Location Should Be    ${url}


