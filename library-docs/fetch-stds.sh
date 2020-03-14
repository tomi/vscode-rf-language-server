#!/bin/bash

urls=(
  https://robotframework.org/SwingLibrary/SwingLibrary.html
  https://robotframework.org/SSHLibrary/SSHLibrary.html
  https://omenia.github.io/robotframework-whitelibrary/keywords.html
  https://guykisel.github.io/robotframework-faker/
  https://serhatbolsu.github.io/robotframework-appiumlibrary/AppiumLibrary.html
  https://robotframework.org/SeleniumLibrary/SeleniumLibrary.html
  https://rasjani.github.io/robotframework-seleniumtestability/index.html
  https://robotframework-thailand.github.io/robotframework-jsonlibrary/JSONLibrary.html
  https://bulkan.github.io/robotframework-requests/doc/RequestsLibrary.html
  https://asyrjasalo.github.io/RESTinstance/
)

for url in "${urls[@]}"
do
  echo "$url"
  npx ts-node src/fetch-library-documentation $url
done

versions=(3.1.2 3.1 3.0.4)
libs=(BuiltIn Collections DateTime Dialogs OperatingSystem Process Screenshot String Telnet XML)

for v in "${versions[@]}"
do
  for lib in "${libs[@]}"
  do
    echo "http://robotframework.org/robotframework/$v/libraries/$lib.html"
    npx ts-node src/fetch-library-documentation http://robotframework.org/robotframework/$v/libraries/$lib.html
  done
done
