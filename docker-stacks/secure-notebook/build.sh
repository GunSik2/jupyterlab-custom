#!/bin/bash

[ -e static ] && rm -rf static
cp -r ../../jupyterlab-v3.4.3/dev_mode/static . 

docker build . -t cgshome2/secure-notebook
