def log_failed(info : str):
    with open("error_log.txt", "a", encoding="utf-8") as f:
        f.write("------------------Failed------------------\n")
        f.write(info + "\n")
        f.write("\n\n\n")