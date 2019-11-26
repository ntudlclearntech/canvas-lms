#!/bin/bash

# Download canvas-lms
cd ../..
sudo mkdir -p /var/canvas
sudo chown -R $USER:$USER /var/canvas
cp -av . /var/canvas
cd /var/canvas
