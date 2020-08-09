if ( Test-Path '.\windows_env' -PathType Container ) {
    "Activating venv"
    ./windows_env/Scripts/activate.ps1
} else {
    "Initializing venv"
    pythonpytho -m venv windows_env
    ./windows_env/Scripts/activate.ps1

    "Installing requirements"
    python -m pip install -r requirements.txt
}

"Starting application"

python app.py

deactivate