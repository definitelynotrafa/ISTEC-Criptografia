#!/usr/bin/env python3
"""
client.py - Simple TLS client for the SEED lab
Usage:
    python3 client.py --host xerox.lab --cadir ./clientCerts
"""
import socket, ssl, argparse, pprint

def main():
    parser = argparse.ArgumentParser(description="Simple TLS client")
    parser.add_argument("--host", required=True, help="Hostname to connect")
    parser.add_argument("--port", type=int, default=443, help="Port to connect")
    parser.add_argument("--cadir", required=True, help="Directory with trusted CA certificates")
    args = parser.parse_args()

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.load_verify_locations(capath=args.cadir)
    context.verify_mode = ssl.CERT_REQUIRED
    context.check_hostname = True

    # TCP connection
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    print(f"[+] Connecting to {args.host}:{args.port} ...")
    sock.connect((args.host, args.port))

    # TLS handshake
    ssock = context.wrap_socket(sock, server_hostname=args.host)
    print("[+] TLS handshake completed")
    print("[+] Cipher used:", ssock.cipher())
    print("[+] Server certificate:")
    pprint.pprint(ssock.getpeercert())

    # Send HTTP request
    request = f"GET / HTTP/1.0\r\nHost: {args.host}\r\n\r\n".encode('utf-8')
    ssock.sendall(request)

    # Receive response
    print("[+] HTTP response (first 2048 bytes):")
    response = ssock.recv(2048)
    print(response.decode(errors='replace'))

    # Close
    ssock.shutdown(socket.SHUT_RDWR)
    ssock.close()
    print("[+] Connection closed")

if __name__ == "__main__":
    main()
