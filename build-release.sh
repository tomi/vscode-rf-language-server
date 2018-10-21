#!/bin/bash

cd server
echo "Building server"
npm run clean
npm run compile

echo "Building client"
cd ../client
vsce package
