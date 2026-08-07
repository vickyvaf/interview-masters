import os

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = os.getenv("PORT", "7788")
    # Optimize ONNX CPU execution threads
    os.environ["OMP_NUM_THREADS"] = "2"
    os.environ["ONNXRUNTIME_NUM_THREADS"] = "2"
    print(f"Starting Supertonic 3 Server on {host}:{port}...")
    os.system(f"supertonic serve --host {host} --port {port} --cors '*'")
