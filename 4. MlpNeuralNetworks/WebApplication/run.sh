#!/bin/bash

if test -d linux_env; then
    echo "Activating venv"
    source linux_env/bin/activate
else
    echo "Initializing venv"
    python3 -m venv linux_env
    source linux_env/bin/activate

    echo "Installing requirements"
    python3 -m pip install -r requirements.txt
fi

echo "Starting application"

python3 app.py

deactivate