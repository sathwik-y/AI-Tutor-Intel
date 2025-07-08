import os
import sys
import subprocess
import platform

def run_command(command, cwd=None):
    """Run a command and handle errors."""
    try:
        print(f"Running: {command}")
        result = subprocess.run(command, shell=True, cwd=cwd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e}")
        return False

def check_python():
    """Check if Python is available."""
    try:
        result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
        print(f"Python version: {result.stdout.strip()}")
        return True
    except:
        print("Python not found!")
        return False

def check_node():
    """Check if Node.js is available."""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        print(f"Node.js version: {result.stdout.strip()}")
        return True
    except:
        print("Node.js not found! Please install Node.js from https://nodejs.org/")
        return False

def install_backend():
    """Install backend dependencies."""
    print("\nInstalling Backend Dependencies")
    backend_path = os.path.join(os.getcwd(), "sage-backend")
    if not os.path.exists(backend_path):
        print("Backend folder not found!")
        return False
    
    requirements_path = os.path.join(backend_path, "requirements.txt")
    if os.path.exists(requirements_path):
        return run_command(f"{sys.executable} -m pip install -r requirements.txt", cwd=backend_path)
    else:
        print("requirements.txt not found in backend folder!")
        return False

def install_frontend():
    """Install frontend dependencies."""
    print("\nInstalling Frontend Dependencies")
    frontend_path = os.path.join(os.getcwd(), "sage-frontend")
    if not os.path.exists(frontend_path):
        print("Frontend folder not found!")
        return False
    
    return run_command("npm install", cwd=frontend_path)

def start_backend():
    """Start the backend server."""
    print("\nStarting Backend Server")
    backend_path = os.path.join(os.getcwd(), "sage-backend")
    if platform.system() == "Windows":
        subprocess.Popen([sys.executable, "run.py"], cwd=backend_path, shell=True)
    else:
        subprocess.Popen([sys.executable, "run.py"], cwd=backend_path)

def start_frontend():
    """Start the frontend development server."""
    print("\nStarting Frontend Development Server")
    frontend_path = os.path.join(os.getcwd(), "sage-frontend")
    if platform.system() == "Windows":
        subprocess.Popen(["npm", "run", "dev"], cwd=frontend_path, shell=True)
    else:
        subprocess.Popen(["npm", "run", "dev"], cwd=frontend_path)

def main():
    print("SAGE Project Setup")
    print("This script will install dependencies and start both backend and frontend servers.")
    
    # Check prerequisites
    if not check_python():
        sys.exit(1)
    
    if not check_node():
        sys.exit(1)
    
    # Install dependencies
    print("\nInstalling Dependencies")
    backend_success = install_backend()
    frontend_success = install_frontend()
    
    if not backend_success or not frontend_success:
        print("\nDependency installation failed!")
        sys.exit(1)
    
    print("\nAll dependencies installed successfully!")
    
    # Start servers
    print("\nStarting Servers")
    start_backend()
    print("Backend server starting...")
    
    import time
    time.sleep(3)  # Wait a bit before starting frontend
    
    start_frontend()
    print("Frontend server starting...")
    
    print("\nSetup complete!")
    print("Backend server: http://localhost:8000")
    print("Frontend server: http://localhost:3000")
    print("\nPress Ctrl+C to stop the servers.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nShutting down servers...")

if __name__ == "__main__":
    main()
