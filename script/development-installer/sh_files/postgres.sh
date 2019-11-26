#!/bin/bash

# Install and Configuring Postgres
sudo apt -y update && sudo apt -y install postgresql-9.5

#it will pop up to ask for setup password
sudo -u postgres createuser canvas --no-createdb --no-superuser --no-createrole --pwprompt
sudo -u postgres createdb canvas_development --owner=canvas

# Change Postgres superuser
sudo -u postgres createuser $USER
sudo -u postgres psql -c "alter user $USER with superuser" postgres
