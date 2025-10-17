#!/usr/bin/env python3
"""
TLS client script for inspecting server certificates and connection parameters.
Usage:
    python3 tls_client.py <hostname or IP>
"""

import socket
import ssl
import sys
import pprint

def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <hostname or IP>")
        sys.exit(1)

    hostname = sys.argv[1]
    port = 4433
    cadir = './client-certs'  # Use your custom CA folder

    # --- Set up the TLS context ---
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.load_verify_locations(capath=cadir)
    context.verify_mode = ssl.CERT_REQUIRED

    # Important: if connecting via IP, hostname check must be False
    if hostname.replace('.', '').isdigit():
        context.check_hostname = False
    else:
        context.check_hostname = True

    try:
        # --- Create TCP connection ---
        print(f"[*] Connecting to {hostname}:{port} ...")
        with socket.create_connection((hostname, port)) as sock:
            input("[+] TCP connection established. Press ENTER to continue ...")

            # --- Wrap the socket with TLS ---
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                print("[*] Starting TLS handshake ...")
                ssock.do_handshake()

                # --- Display connection details ---
                print(f"\n=== Cipher used: {ssock.cipher()}")
                print(f"=== Server hostname: {ssock.server_hostname}")
                print("=== Server certificate:")
                pprint.pprint(ssock.getpeercert())

                input("\n[+] TLS handshake complete. Press ENTER to close connection ...")

    except ssl.SSLError as e:
        print(f"[!] SSL error: {e}")
    except socket.error as e:
        print(f"[!] Socket error: {e}")
    except Exception as e:
        print(f"[!] Unexpected error: {e}")

if __name__ == "__main__":
    main()
