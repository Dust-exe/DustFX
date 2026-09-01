import requests
import time
import threading
import sys

URL = "http://127.0.0.1:19840/index.html"
NUM_REQUESTS = 5000
CONCURRENCY = 10

def worker(num_requests, results, index):
    start_time = time.time()
    success = 0
    for _ in range(num_requests):
        try:
            resp = requests.get(URL, timeout=5)
            if resp.status_code == 200:
                success += 1
        except Exception:
            pass
    end_time = time.time()
    results[index] = (success, end_time - start_time)

def run_benchmark():
    threads = []
    results = [None] * CONCURRENCY
    requests_per_thread = NUM_REQUESTS // CONCURRENCY

    start_time = time.time()

    for i in range(CONCURRENCY):
        t = threading.Thread(target=worker, args=(requests_per_thread, results, i))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    end_time = time.time()
    total_time = end_time - start_time
    total_success = sum(r[0] for r in results)

    print(f"Total Requests: {total_success}")
    print(f"Total Time: {total_time:.4f} seconds")
    print(f"Requests/sec: {total_success / total_time:.2f}")

if __name__ == "__main__":
    run_benchmark()
