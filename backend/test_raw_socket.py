import socket
import sys

host = "ep-dry-cloud-airaa41g.c-4.us-east-1.aws.neon.tech"
port = 5432

print(f"Testing raw python socket connection to {host}:{port}")

try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    print("Socket created. Attempting to connect...")
    sock.connect((host, port))
    print("✅ Connection successful!")
    sock.close()
except Exception as e:
    print(f"❌ Connection failed (AF_INET): {e}")

try:
    sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    sock.settimeout(5)
    print("Socket created. Attempting to connect... (AF_INET6)")
    # Need to resolve ipv6 first
    addr_info = socket.getaddrinfo(host, port, socket.AF_INET6, socket.SOCK_STREAM)
    ipv6_addr = addr_info[0][4]
    sock.connect(ipv6_addr)
    print("✅ Connection successful! (AF_INET6)")
    sock.close()
except Exception as e:
    print(f"❌ Connection failed (AF_INET6): {e}")
