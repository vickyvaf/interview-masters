import os
import multiprocessing

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = os.getenv("PORT", "7788")
    
    # Maximize ONNX SIMD CPU execution threads across all available CPU cores
    cpu_count = str(os.cpu_count() or multiprocessing.cpu_count() or 4)
    os.environ["OMP_NUM_THREADS"] = cpu_count
    os.environ["MKL_NUM_THREADS"] = cpu_count
    os.environ["OPENBLAS_NUM_THREADS"] = cpu_count
    os.environ["VECLIB_MAXIMUM_THREADS"] = cpu_count
    os.environ["NUMEXPR_NUM_THREADS"] = cpu_count
    os.environ["ONNXRUNTIME_NUM_THREADS"] = cpu_count

    print(f"Starting Supertonic 3 Server on {host}:{port} using {cpu_count} CPU worker threads...")
    os.system(f"supertonic serve --host {host} --port {port} --model supertonic-3 --cors '*'")
