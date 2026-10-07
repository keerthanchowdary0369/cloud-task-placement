"""Quick launcher for the Cloud Task Placement Website."""
import http.server
import socketserver
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == "__main__":
    url = f"http://localhost:{PORT}/"
    print(f"Starting server at {url}...")
    webbrowser.open(url)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at {url} (Press Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
