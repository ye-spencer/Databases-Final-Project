def log_failed(info : str):
    info = info.encode("utf-8", "ignore").decode("utf-8")
    with open("error_log.txt", "a", encoding="utf-8") as f:
        f.write("------------------Failed------------------\n")
        f.write(info + "\n")
        f.write("\n\n\n")