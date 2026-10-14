"""Local-only speech recognition endpoint for call-demo.html.

Install: python3 -m pip install faster-whisper
Run:     python3 demo/callkit/asr-server.py
"""

import json
import os
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from faster_whisper import WhisperModel


HOST = "127.0.0.1"
PORT = 8765
MAX_AUDIO_BYTES = 10 * 1024 * 1024
MODEL_NAME = os.environ.get("CALLKIT_ASR_MODEL", "base")
ALLOWED_ORIGINS = {
    "http://127.0.0.1:5174",
    "http://localhost:5174",
    "http://127.0.0.1:5175",
    "http://localhost:5175",
}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(encoded)

    def do_OPTIONS(self):
        self.send_json(200, {})

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {"ok": True, "model": MODEL_NAME})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/transcribe":
            self.send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json(400, {"error": "invalid content length"})
            return
        if length < 44 or length > MAX_AUDIO_BYTES:
            self.send_json(400, {"error": "expected a WAV file smaller than 10 MB"})
            return
        audio = self.rfile.read(length)
        if audio[:4] != b"RIFF" or audio[8:12] != b"WAVE":
            self.send_json(400, {"error": "expected a WAV file"})
            return
        path = ""
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as output:
                output.write(audio)
                path = output.name
            segments, _ = self.server.model.transcribe(
                path,
                language="zh",
                beam_size=5,
                vad_filter=False,
                initial_prompt="以下内容使用简体中文。",
            )
            text = "".join(segment.text for segment in segments).strip()
            self.send_json(200, {"text": text})
        except Exception as error:
            self.send_json(500, {"error": str(error)})
        finally:
            if path:
                os.unlink(path)


def main():
    print(f"Loading faster-whisper model {MODEL_NAME!r} on CPU...")
    model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.model = model
    print(f"CallKit ASR server ready at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
