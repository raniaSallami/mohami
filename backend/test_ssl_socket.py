import socket
import ssl
import sys
import struct

host = "ep-dry-cloud-airaa41g.c-4.us-east-1.aws.neon.tech"
port = 5432

print(f"Testing raw python socket + SSL to {host}:{port}")

try:
    sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    sock.settimeout(30)  # Increased timeout to 30 seconds for cold start
    print("Socket created. Resolving AF_INET6...")
    addr_info = socket.getaddrinfo(host, port, socket.AF_INET6, socket.SOCK_STREAM)
    ipv6_addr = addr_info[0][4]
    
    print("Attempting TCP connection...")
    sock.connect(ipv6_addr)
    print("✅ TCP Connection successful!")
    
    print("Sending SSL request...")
    packet = struct.pack('!II', 8, 80877103)
    sock.sendall(packet)
    
    print("Waiting for SSL response (this may take up to 20s if Neon is cold starting)...")
    response = sock.recv(1)
    print(f"Postgres SSL response: {response}")
    if response == b'S':
        print("✅ Server agreed to SSL. Attempting SSL wrap...")
        context = ssl.create_default_context()
        ssock = context.wrap_socket(sock, server_hostname=host)
        print("✅ SSL handshake successful!")
        print(f"Cipher: {ssock.cipher()}")
        ssock.close()
    else:
        print(f"❌ Server denied SSL. Response: {response}")
        sock.close()
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"❌ Connection failed: {e}")
