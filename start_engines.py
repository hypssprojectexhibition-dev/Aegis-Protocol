import subprocess
import time
import sys
import os

# Define the engines and their paths relative to the project root
engines = [
    {
        "name": "StegaStamp (Port 8000)",
        "path": "backend/stega",
        "cmd": [sys.executable, "aegis_api.py"]
    },
    {
        "name": "VisualCrypto (Port 5000)",
        "path": "backend/crypto",
        "cmd": [sys.executable, "app.py"]
    },
    {
        "name": "RedactionPro (Port 8001)",
        "path": "backend/redaction",
        "cmd": [sys.executable, "redaction_api.py"]
    }
]

processes = []

def start_engines():
    print("\n" + "="*50)
    print("🛡️  AEGIS PROTOCOL — Engine Launch Sequence")
    print("="*50 + "\n")
    
    root_dir = os.getcwd()
    
    for engine in engines:
        print(f"🚀 Initializing {engine['name']}...")
        try:
            # Change to the engine directory and start the process
            os.chdir(os.path.join(root_dir, engine['path']))
            p = subprocess.Popen(
                engine['cmd'],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            processes.append((engine['name'], p))
            os.chdir(root_dir)
            time.sleep(1) # Brief pause to allow port binding
        except Exception as e:
            print(f"❌ Failed to start {engine['name']}: {e}")
            os.chdir(root_dir)

    print("\n" + "="*50)
    print("✅ All engines are warming up!")
    print("👉 Keep this terminal open to maintain background services.")
    print("👉 Close this terminal to stop all engines.")
    print("="*50 + "\n")

    try:
        while True:
            for name, p in processes:
                if p.poll() is not None:
                    print(f"⚠️  Engine '{name}' has stopped unexpectedly!")
                    processes.remove((name, p))
            time.sleep(2)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down all Aegis engines...")
        for name, p in processes:
            p.terminate()
        print("Done. Goodbye!")

if __name__ == "__main__":
    start_engines()
