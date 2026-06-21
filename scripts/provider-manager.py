#!/usr/bin/env python3
"""
WalletBench Provider Rotation Manager
Monitors ZAI rate limits and rotates providers every 5 hours.
Run by wb-lead as part of the standup cadence.
"""
import os
import sys
import yaml
import subprocess
import json
from datetime import datetime, timedelta

ZAI_STATUS_FILE = "/tmp/wb_zai_status.json"
PROFILE_DIR = "/home/ops/.hermes/profiles"
PROFILES = ["wb-engine", "wb-surface", "wb-reviewer", "wb-producer"]

def log(msg):
    print(f"[{datetime.now().isoformat()}] {msg}")

def check_zai_status():
    """Test ZAI with a cheap prompt."""
    try:
        result = subprocess.run(
            ["hermes", "chat", "-q", "echo OK", "--profile", "wb-lead", "--yolo"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return {"available": True, "last_check": datetime.now().isoformat()}
        else:
            return {"available": False, "error": result.stderr[:200], "last_check": datetime.now().isoformat()}
    except Exception as e:
        return {"available": False, "error": str(e), "last_check": datetime.now().isoformat()}

def load_status():
    if os.path.exists(ZAI_STATUS_FILE):
        with open(ZAI_STATUS_FILE) as f:
            return json.load(f)
    return {"available": True, "switched_at": None, "history": []}

def save_status(status):
    with open(ZAI_STATUS_FILE, "w") as f:
        json.dump(status, f, indent=2)

def set_provider(profile, provider, model, base_url):
    """Update a profile's primary provider."""
    config_path = f"{PROFILE_DIR}/{profile}/config.yaml"
    with open(config_path) as f:
        config = yaml.safe_load(f)
    
    config["model"]["provider"] = provider
    config["model"]["default"] = model
    config["model"]["base_url"] = base_url
    
    with open(config_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)
    
    log(f"Set {profile} -> {provider}/{model}")

def switch_to_fallback():
    """Switch all coding profiles to OpenCode Go fallback."""
    log("ZAI rate limited. Switching to fallback providers...")
    for profile in PROFILES:
        if profile == "wb-engine":
            set_provider(profile, "opencode-go", "kimi-k2.6", "https://opencode.ai/zen/go/v1")
        elif profile == "wb-surface":
            set_provider(profile, "opencode-go", "kimi-k2.6", "https://opencode.ai/zen/go/v1")
    
    status = load_status()
    status["available"] = False
    status["switched_at"] = datetime.now().isoformat()
    status["history"].append({"action": "switch_to_fallback", "time": datetime.now().isoformat()})
    save_status(status)
    log("Fallback switch complete.")

def switch_to_zai():
    """Switch coding profiles back to ZAI."""
    log("ZAI available again. Switching back to ZAI...")
    for profile in PROFILES:
        if profile in ["wb-engine", "wb-surface"]:
            set_provider(profile, "z.ai", "glm-5.2", "https://api.z.ai/api/paas/v4")
    
    status = load_status()
    status["available"] = True
    status["switched_at"] = None
    status["history"].append({"action": "switch_to_zai", "time": datetime.now().isoformat()})
    save_status(status)
    log("ZAI switch-back complete.")

def main():
    log("Starting provider rotation check...")
    
    current_status = load_status()
    zai_check = check_zai_status()
    
    log(f"ZAI status: available={zai_check['available']}")
    
    if zai_check["available"] and not current_status.get("available", True):
        switch_to_zai()
    elif not zai_check["available"] and current_status.get("available", True):
        switch_to_fallback()
    else:
        log("No provider switch needed.")
    
    # Update status
    current_status.update(zai_check)
    save_status(current_status)
    
    log("Provider rotation check complete.")

if __name__ == "__main__":
    main()
