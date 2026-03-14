#!/usr/bin/env python3
"""Seed creepy_tech_posts and cyber_awareness_posts tables."""
import json
import urllib.request
import urllib.parse

# Read Supabase config
env_path = "/opt/supabase/docker/.env"
env_vars = {}
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env_vars[k.strip()] = v.strip()

SUPABASE_URL = "http://localhost:8090"
SERVICE_KEY = env_vars.get("SERVICE_ROLE_KEY", "")

def insert_posts(table, posts):
    """Insert posts into the given table via Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Prefer": "resolution=merge-duplicates",
    }

    data = json.dumps(posts).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        resp = urllib.request.urlopen(req)
        print(f"  Inserted {len(posts)} rows into {table} — HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ERROR {e.code}: {body[:500]}")

# ============ CREEPY TECH POSTS ============
creepy_tech = [
    (1, "The Clipboard Spy", "📋", "Smartphone Paranoia"),
    (2, "Hidden Microphone Triggers", "🎙️", "Smartphone Paranoia"),
    (3, 'The "Significant Locations" Map', "📍", "Smartphone Paranoia"),
    (4, "Silent App Tracking", "📡", "Smartphone Paranoia"),
    (5, "The Bluetooth Beacon Trap", "🔵", "Smartphone Paranoia"),
    (6, "Battery Drain Secrets", "🔋", "Smartphone Paranoia"),
    (7, "The Camera LED Trick", "🔴", "Smartphone Paranoia"),
    (8, "Keyboard Keystroke Logging", "⌨️", "Smartphone Paranoia"),
    (9, "Wi-Fi Scanning in the Background", "📶", "Smartphone Paranoia"),
    (10, 'The "Off" State Myth', "⚫", "Smartphone Paranoia"),
    (11, "Mall Wi-Fi Mapping", "🛒", "Everyday Surveillance"),
    (12, "The Grocery Store Price Tag", "🏷️", "Everyday Surveillance"),
    (13, "Ultrasonic Cross-Device Tracking", "📡", "Everyday Surveillance"),
    (14, "Your Smart TV is Watching", "📺", "Everyday Surveillance"),
    (15, "The Car Data Harvest", "🚗", "Everyday Surveillance"),
    (16, "Doorbell Cameras & Police", "🚪", "Everyday Surveillance"),
    (17, "Loyalty Card Psychology", "💳", "Everyday Surveillance"),
    (18, "The Captcha Truth", "🤖", "Everyday Surveillance"),
    (19, "Smart Thermostat Spies", "🌡️", "Everyday Surveillance"),
    (20, "Printer Microdots", "🖨️", "Everyday Surveillance"),
    (21, "The Fake USB Cable", "🔌", "Cybersecurity & Scams"),
    (22, "The Juice Jacking Myth vs Reality", "🔋", "Cybersecurity & Scams"),
    (23, 'The Urgent Boss Text', "💬", "Cybersecurity & Scams"),
    (24, 'The "Wrong Number" Scam Long Game', "📱", "Cybersecurity & Scams"),
    (25, "The Airplane Mode Exploit", "✈️", "Cybersecurity & Scams"),
    (26, "Hotel Keycard Clones", "🏨", "Cybersecurity & Scams"),
    (27, "The Missing Package Phishing", "📦", "Cybersecurity & Scams"),
    (28, 'Public Wi-Fi "Evil Twins"', "👿", "Cybersecurity & Scams"),
    (29, "The Screen Sharing Trap", "🖥️", "Cybersecurity & Scams"),
    (30, "SIM Swapping", "📲", "Cybersecurity & Scams"),
    (31, "The AI Voice Clone", "🗣️", "AI & The Creepy Future"),
    (32, "Reverse Image Search on Steroids", "🔍", "AI & The Creepy Future"),
    (33, "Deepfake Blackmail", "😈", "AI & The Creepy Future"),
    (34, "AI Lie Detectors", "👁️", "AI & The Creepy Future"),
    (35, "The Predictive Policing Algorithm", "🚔", "AI & The Creepy Future"),
    (36, "AI Girlfriend Data Brokers", "💔", "AI & The Creepy Future"),
    (37, "The Dead Bot", "👻", "AI & The Creepy Future"),
    (38, "Algorithmic Price Discrimination", "💰", "AI & The Creepy Future"),
    (39, "The Deep Nostalgia Trap", "📸", "AI & The Creepy Future"),
    (40, "AI Job Interviewers", "🤝", "AI & The Creepy Future"),
    (41, "The Facebook Shadow Profile", "👤", "The Invisible Web"),
    (42, "Google's Audio Vault", "🎧", "The Invisible Web"),
    (43, "The Incognito Mode Lie", "🕶️", "The Invisible Web"),
    (44, "Data Broker Profiles", "📊", "The Invisible Web"),
    (45, "The TikTok Keystroke Tracker", "🔑", "The Invisible Web"),
    (46, "Browser Fingerprinting", "🖐️", "The Invisible Web"),
    (47, "The 23andMe Hack", "🧬", "The Invisible Web"),
    (48, "Amazon's Purchase Prediction", "📦", "The Invisible Web"),
    (49, 'The "Terms of Service" Ghost', "📜", "The Invisible Web"),
    (50, "The Deactivated Account Illusion", "🗑️", "The Invisible Web"),
]

# ============ CYBER AWARENESS POSTS ============
cyber_awareness = [
    (1, "The Grandparent Voice Clone", "🛑", "Real-Life Scam Teardowns"),
    (2, 'The "Wrong Number" Long Con', "🛑", "Real-Life Scam Teardowns"),
    (3, "The Fake Streaming Fix", "🛑", "Real-Life Scam Teardowns"),
    (4, "The Helpful Tech Support Blur", "🛑", "Real-Life Scam Teardowns"),
    (5, "The Zelle/CashApp Reversal Myth", "🛑", "Real-Life Scam Teardowns"),
    (6, "The Geek Squad Invoice Alert", "🛑", "Real-Life Scam Teardowns"),
    (7, "The Facebook Verification Badge Scam", "🛑", "Real-Life Scam Teardowns"),
    (8, "The Fake QR Code Parking Meter", "🛑", "Real-Life Scam Teardowns"),
    (9, "The Delivery Fee Text Message", "🛑", "Real-Life Scam Teardowns"),
    (10, 'The "Look Who Died" Facebook Message', "🛑", "Real-Life Scam Teardowns"),
    (11, 'The "I Use 3 Passwords" Mistake', "🔐", "Password & Account Fallacies"),
    (12, "The Notebook vs. Password Manager Debate", "🔐", "Password & Account Fallacies"),
    (13, 'Why "Pa$$w0rd1!" is Terrible', "🔐", "Password & Account Fallacies"),
    (14, "The Security Question Flaw", "🔐", "Password & Account Fallacies"),
    (15, "The SMS 2-Factor Weakness", "🔐", "Password & Account Fallacies"),
    (16, "Shared Wi-Fi Red Flags", "🔐", "Password & Account Fallacies"),
    (17, "The Danger of Sign in with Facebook/Google", "🔐", "Password & Account Fallacies"),
    (18, "The Password Reset Loophole", "🔐", "Password & Account Fallacies"),
    (19, "Biometrics Aren't Passwords", "🔐", "Password & Account Fallacies"),
    (20, 'The "Save Card For Later" Risk', "🔐", "Password & Account Fallacies"),
    (21, "The Default Router Password Danger", "🏠", "Smart Home & Physical Security"),
    (22, "The Smart Camera Peeping Tom", "🏠", "Smart Home & Physical Security"),
    (23, "The Smart TV Listening Device", "🏠", "Smart Home & Physical Security"),
    (24, "The Digital Door Lock Weakness", "🏠", "Smart Home & Physical Security"),
    (25, "The Car Key Fob Relay Attack", "🏠", "Smart Home & Physical Security"),
    (26, "The AirTag Stalking Reality", "🏠", "Smart Home & Physical Security"),
    (27, "The Danger of Used Smart Tech", "🏠", "Smart Home & Physical Security"),
    (28, "The Rogue USB Drive Drop", "🏠", "Smart Home & Physical Security"),
    (29, "Shoulder Surfing in 2026", "🏠", "Smart Home & Physical Security"),
    (30, "Alexa's Accidental Purchases", "🏠", "Smart Home & Physical Security"),
    (31, 'The "Juice Jacking" Reality', "🧳", "Travel & Public Space Safety"),
    (32, "The Fake Boarding Pass Scam", "🧳", "Travel & Public Space Safety"),
    (33, 'The "Free Hotel Wi-Fi" Pop-up', "🧳", "Travel & Public Space Safety"),
    (34, "The Rideshare Driver Trap", "🧳", "Travel & Public Space Safety"),
    (35, "The Public Charging Cable", "🧳", "Travel & Public Space Safety"),
    (36, "The ATM Skimmer Check", "🧳", "Travel & Public Space Safety"),
    (37, "The Airbnb Hidden Camera Search", "🧳", "Travel & Public Space Safety"),
    (38, "The Passport RFID Skimming Myth vs Reality", "🧳", "Travel & Public Space Safety"),
    (39, "The Out Of Office Reply Danger", "🧳", "Travel & Public Space Safety"),
    (40, "Luggage Tracker vs. Smart Tag", "🧳", "Travel & Public Space Safety"),
    (41, "Freezing Your Credit in 5 Minutes", "🧬", "Identity & Data"),
    (42, 'The "Who Scrapes Your Data" Search', "🧬", "Identity & Data"),
    (43, "The Forgotten Subscriptions Vulnerability", "🧬", "Identity & Data"),
    (44, "The Social Media Quiz Trap", "🧬", "Identity & Data"),
    (45, "The Oversharing Parent (Sharenting)", "🧬", "Identity & Data"),
    (46, "What the Dark Web Actually Is", "🧬", "Identity & Data"),
    (47, "The Difference between Delete and Wipe", "🧬", "Identity & Data"),
    (48, "Medical Identity Theft", "🧬", "Identity & Data"),
    (49, "The Value of an Email Address", "🧬", "Identity & Data"),
    (50, "The Best Cyber Defense is Paranoia", "🧬", "Identity & Data"),
]

print("Seeding creepy_tech_posts...")
creepy_rows = [
    {"number": n, "title": t, "emoji": e, "category": c, "is_published": False}
    for n, t, e, c in creepy_tech
]
insert_posts("creepy_tech_posts", creepy_rows)

print("Seeding cyber_awareness_posts...")
cyber_rows = [
    {"number": n, "title": t, "emoji": e, "category": c, "is_published": False}
    for n, t, e, c in cyber_awareness
]
insert_posts("cyber_awareness_posts", cyber_rows)

print("Done!")
