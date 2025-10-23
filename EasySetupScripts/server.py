#!/usr/bin/env python3
"""
server.py - Simple TLS server for the SEED lab
Usage:
  python3 server.py --cert ./serverCerts/server.crt --key ./serverCerts/server.key --port 443
Note: Binding to port 443 may requer root. Para testes, usa porta 8443.
"""
import socket, ssl, argparse, threading

html = """
HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Xerox Lab Server</title>
    <style>
        body {
            background-color: #f0f8ff;
            font-family: Arial, sans-serif;
            text-align: center;
            padding-top: 50px;
        }
        h1 {
            color: #3333cc;
            font-size: 48px;
        }
        p {
            color: #666666;
            font-size: 24px;
        }
        .box {
            display: inline-block;
            padding: 20px 40px;
            border: 2px solid #3333cc;
            border-radius: 10px;
            background-color: #ffffff;
        }
    </style>
</head>
<body>
    <div class="box">
        <h1>Hello, Admin!</h1>
        <p>Welcome to admin.xerox.lab</p>
    </div>
</body>
</html>
"""

def handle_connection(connstream, addr):
    try:
        print(f"[+] Connection from {addr}")
        # read request (simple)
        data = b''
        connstream.settimeout(2.0)
        try:
            data = connstream.recv(4096)
        except Exception:
            pass
        if data:
            print(f"--- request (first 1024 bytes) from {addr} ---")
            print(data[:1024].decode(errors='replace'))
        # send response
        body_bytes = BODY.encode('utf-8')
        resp = HTML.format(length=len(body_bytes), body=BODY).encode('utf-8')
        connstream.sendall(resp)
    except Exception as e:
        print(f"[!] Error handling connection {addr}: {e}")
    finally:
        try:
            connstream.shutdown(socket.SHUT_RDWR)
        except Exception:
            pass
        connstream.close()
        print(f"[-] Closed connection {addr}")

def main():
    parser = argparse.ArgumentParser(description="Simple TLS server")
    parser.add_argument("--cert", required=True, help="Server certificate (PEM)")
    parser.add_argument("--key", required=True, help="Server private key (PEM)")
    parser.add_argument("--port", type=int, default=443, help="Port to listen on")
    parser.add_argument("--addr", default="0.0.0.0", help="Address to bind")
    args = parser.parse_args()

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.options |= ssl.OP_NO_TLSv1 | ssl.OP_NO_TLSv1_1  # prefer modern TLS
    context.load_cert_chain(certfile=args.cert, keyfile=args.key)

    bindsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
    bindsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    bindsock.bind((args.addr, args.port))
    bindsock.listen(8)
    print(f"[+] Listening on {args.addr}:{args.port} (TLS)")

    try:
        while True:
            newsock, fromaddr = bindsock.accept()
            try:
                ssock = context.wrap_socket(newsock, server_side=True)
            except ssl.SSLError as e:
                print(f"[!] SSL handshake failed with {fromaddr}: {e}")
                newsock.close()
                continue
            t = threading.Thread(target=handle_connection, args=(ssock, fromaddr), daemon=True)
            t.start()
    except KeyboardInterrupt:
        print("\n[!] Server shutting down")
    finally:
        bindsock.close()

if __name__ == "__main__":
    main()
