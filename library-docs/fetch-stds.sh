#!/bin/bash

urls=(
  https://robotframework.org/SwingLibrary/SwingLibrary-1.9.9.html
  http://robotframework.org/SSHLibrary/SSHLibrary.html
  http://omenia.github.io/robotframework-whitelibrary/keywords.html
  https://guykisel.github.io/robotframework-faker/
  http://serhatbolsu.github.io/robotframework-appiumlibrary/AppiumLibrary.html
  http://robotframework.org/SeleniumLibrary/SeleniumLibrary.html
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
