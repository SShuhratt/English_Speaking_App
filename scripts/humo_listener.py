#!/usr/bin/env python3
"""
ConvoMate - HUMO Payment Interceptor & Webhook Relay Daemon
===========================================================
Listens for real-time incoming transfer notifications from @HUMOcardbot
via Telegram MTProto (Telethon) and dispatches them to ConvoMate's webhook endpoint.

Usage:
  1. Authorize session (one-time interactive login):
     python3 scripts/humo_listener.py --auth

  2. Run daemon:
     python3 scripts/humo_listener.py

  3. Test webhook connection:
     python3 scripts/humo_listener.py --test-webhook
"""

import os
import sys
import argparse
import logging
import asyncio
from pathlib import Path

try:
    import requests
except ImportError:
    print("Error: 'requests' is required. Run: pip install requests", file=sys.stderr)
    sys.exit(1)

# Ensure project root is in path and read .env if present
BASE_DIR = Path(__file__).resolve().parent.parent
SESSION_FILE = Path(__file__).resolve().parent / "convomate_humo"

def load_env(env_path: Path):
    if not env_path.exists():
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k not in os.environ:
                os.environ[k] = v

load_env(BASE_DIR / ".env")

# Configuration
TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
WEBHOOK_URL = os.getenv("HUMO_WEBHOOK_URL", "http://127.0.0.1:8080/api/webhooks/humo-payment")
WEBHOOK_SECRET = os.getenv("HUMO_WEBHOOK_SECRET", "convomate-humo-webhook-secret-key")
TARGET_BOT = os.getenv("HUMO_BOT_USERNAME", "HUMOcardbot").lstrip("@")

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("HumoListener")

def send_to_webhook(text: str) -> dict:
    """Send intercepted notification to ConvoMate Laravel API."""
    headers = {
        "X-Humo-Secret": WEBHOOK_SECRET,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"text": text}
    
    try:
        response = requests.post(WEBHOOK_URL, json=payload, headers=headers, timeout=10)
        logger.info(f"Relayed to ConvoMate: Status {response.status_code} - {response.text}")
        return response.json() if response.status_code == 200 else {}
    except Exception as e:
        logger.error(f"Failed to post to ConvoMate webhook ({WEBHOOK_URL}): {e}")
        return {}

def test_webhook():
    """Verify connectivity to local ConvoMate endpoint."""
    print(f"Testing webhook connectivity to {WEBHOOK_URL}...")
    target_card = os.getenv("HUMO_CARD_LAST_DIGITS", "6751").split(",")[0].strip()
    sample_text = (
        "🎉 To'ldirish\n"
        "➕ 1.000,00 UZS\n"
        "📍 TEST SYSTEM CHECK\n"
        f"💳 HUMOCARD *{target_card}\n"
        "🕓 12:00 12.10.2026"
    )
    result = send_to_webhook(sample_text)
    print("Result:", result)

async def run_listener():
    from telethon import TelegramClient, events

    if not TELEGRAM_API_ID or not TELEGRAM_API_HASH:
        logger.error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH in environment or .env.")
        logger.error("Get them at https://my.telegram.org -> API development tools.")
        sys.exit(1)

    api_id = int(TELEGRAM_API_ID)
    api_hash = str(TELEGRAM_API_HASH)

    client = TelegramClient(str(SESSION_FILE), api_id, api_hash)
    await client.connect()

    if not await client.is_user_authorized():
        logger.error("Client is not authorized. Please run: python3 scripts/humo_listener.py --auth")
        sys.exit(1)

    me = await client.get_me()
    logger.info(f"Connected to Telegram as: {me.first_name} (@{me.username or me.id})")
    logger.info(f"Listening exclusively for notifications from @{TARGET_BOT}...")
    logger.info(f"Target webhook URL: {WEBHOOK_URL}")

    # Resolve target entity
    try:
        target_entity = await client.get_entity(TARGET_BOT)
        target_id = target_entity.id
        logger.info(f"Resolved @{TARGET_BOT} (ID: {target_id}) successfully.")
    except Exception as e:
        logger.warning(f"Could not pre-resolve @{TARGET_BOT}: {e}. Falling back to username matching.")
        target_id = None

    @client.on(events.NewMessage)
    async def handler(event):
        sender = await event.get_sender()
        sender_username = getattr(sender, "username", "") or ""
        sender_id = getattr(sender, "id", None)

        # Match only @HUMOcardbot
        is_target = False
        if target_id and sender_id == target_id:
            is_target = True
        elif sender_username.lower() == TARGET_BOT.lower():
            is_target = True

        if not is_target:
            return

        text = event.message.raw_text or ""
        logger.info(f"⚡ Received message from @{TARGET_BOT}:\n{text}")

        # Send to webhook in thread to avoid blocking async loop
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, send_to_webhook, text)

    await client.run_until_disconnected()

def authorize_client():
    from telethon import TelegramClient

    if not TELEGRAM_API_ID or not TELEGRAM_API_HASH:
        print("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH.")
        api_id_input = input("Enter your Telegram API ID: ").strip()
        api_hash_input = input("Enter your Telegram API Hash: ").strip()
    else:
        api_id_input = TELEGRAM_API_ID
        api_hash_input = TELEGRAM_API_HASH

    client = TelegramClient(str(SESSION_FILE), int(api_id_input), str(api_hash_input))
    client.start()
    print("\n✅ Authorization successful! Session saved to:", SESSION_FILE)
    client.disconnect()

def main():
    parser = argparse.ArgumentParser(description="Humo Telegram notification listener daemon.")
    parser.add_argument("--auth", action="store_true", help="Authorize Telegram user account interactively")
    parser.add_argument("--test-webhook", action="store_true", help="Send a test ping to ConvoMate webhook")

    args = parser.parse_args()

    if args.test_webhook:
        test_webhook()
        return

    if args.auth:
        authorize_client()
        return

    asyncio.run(run_listener())

if __name__ == "__main__":
    main()
