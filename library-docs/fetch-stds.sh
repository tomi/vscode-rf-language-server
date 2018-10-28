#!/bin/bash

urls=(
  http://robotframework.org/Selenium2Library/Selenium2Library.html
  http://robotframework.org/Selenium2Library/Selenium2Library-1.8.0.html
  http://robotframework.org/SeleniumLibrary/SeleniumLibrary.html
)

for url in "${urls[@]}"
do
  echo "$url"
  npx ts-node src/fetch-library-documentation $url
done

versions=(3.0.4 2.9.2 2.8.7 2.7.7)
libs=(BuiltIn Collections DateTime Dialogs OperatingSystem Process Screenshot String Telnet XML)

for v in "${versions[@]}"
do
  for lib in "${libs[@]}"
  do
    echo "http://robotframework.org/robotframework/$v/libraries/$lib.html"
    npx ts-node src/fetch-library-documentation http://robotframework.org/robotframework/$v/libraries/$lib.html
  done
done
