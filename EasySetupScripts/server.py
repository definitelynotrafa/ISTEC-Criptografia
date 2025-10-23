#!/usr/bin/env python3
"""
server.py - Simple TLS server for the SEED lab
Distinguishes subdomains:
  - admin.xerox.lab -> "Olá Admin!"
  - xerox.lab       -> "Olá!"
"""
import socket, ssl, argparse, threading

# Template HTML com CSS
HTML_TEMPLATE = """HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: {length}

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>
        body {{
            background-color: #f0f8ff;
            font-family: Arial, sans-serif;
            text-align: center;
            padding-top: 50px;
        }}
        h1 {{
            color: #3333cc;
            font-size: 48px;
        }}
        p {{
            color: #666666;
            font-size: 24px;
        }}
        .box {{
            display: inline-block;
            padding: 20px 40px;
            border: 2px solid #3333cc;
            border-radius: 10px;
            background-color: #ffffff;
        }}
    </style>
</head>
<body>
    <div class="box">
        <h1>{heading}</h1>
        <p>{message}</p>
    </div>
</body>
</html>
"""

def handle_connection(connstream, addr):
    try:
        print(f"[+] Connection from {addr}")
        # lê headers HTTP
        request = b""
        connstream.settimeout(2.0)
        try:
            while True:
                chunk = connstream.recv(2048)
                if not chunk:
                    break
                request += chunk
                if b"\r\n\r\n" in request:
                    break
        except Exception:
            pass

        host_header = b""
        for line in request.split(b"\r\n"):
            if line.lower().startswith(b"host:"):
                host_header = line.split(b":",1)[1].strip()
                break
        host = host_header.decode() if host_header else ""

        # escolhe HTML dependendo do host
        if "admin.xerox.lab" in host:
            title, heading, message = "Admin Page", "Olá Admin!", "Bem-vindo ao admin.xerox.lab"
        else:
            title, heading, message = "Xerox Lab", "Olá!", "Bem-vindo ao xerox.lab"

        body = HTML_TEMPLATE.format(title=title, heading=heading, message=message, length=0)
        body_bytes = body.encode("utf-8")
        # atualiza Content-Length
        body_bytes = body_bytes.replace(b"Content-Length: 0", f"Content-Length: {len(body_bytes)}".encode())

        connstream.sendall(body_bytes)

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
    context.options |= ssl.OP_NO_TLSv1 | ssl.OP_NO_TLSv1_1
    context.load_cert_chain(certfile=args.cert, keyfile=args.key)

    bindsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
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
