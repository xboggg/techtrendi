#!/usr/bin/env python3
"""Sync deploy: delete stale assets from cPanel FTP, upload new ones, then index.html."""
import ftplib
import os
import sys

FTP_HOST = "198.54.125.234"
FTP_USER = "techbhyx"
FTP_PASS = "jaesn3fhu@*WE-"
REMOTE_ASSETS = "/public_html/assets"
REMOTE_ROOT = "/public_html"

LOCAL_DIST = os.path.join(os.path.dirname(__file__), "dist")
LOCAL_ASSETS = os.path.join(LOCAL_DIST, "assets")

def main():
    print("Connecting to FTP...")
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = "utf-8"

    # Get remote file list
    ftp.cwd(REMOTE_ASSETS)
    remote_files = set(ftp.nlst())
    remote_files.discard(".")
    remote_files.discard("..")
    print(f"Remote assets: {len(remote_files)} files")

    # Get local file list
    local_files = set(os.listdir(LOCAL_ASSETS))
    print(f"Local assets: {len(local_files)} files")

    # Delete stale files
    stale = remote_files - local_files
    print(f"Stale files to delete: {len(stale)}")
    for f in stale:
        try:
            ftp.delete(f)
            print(f"  Deleted: {f}")
        except Exception as e:
            print(f"  Failed to delete {f}: {e}")

    # Upload new/changed files
    new_files = local_files - remote_files
    print(f"New files to upload: {len(new_files)}")
    for f in sorted(new_files):
        local_path = os.path.join(LOCAL_ASSETS, f)
        with open(local_path, "rb") as fp:
            ftp.storbinary(f"STOR {f}", fp)
        print(f"  Uploaded: {f}")

    # Upload index.html last
    ftp.cwd(REMOTE_ROOT)
    index_path = os.path.join(LOCAL_DIST, "index.html")
    with open(index_path, "rb") as fp:
        ftp.storbinary("STOR index.html", fp)
    print("Uploaded: index.html")

    ftp.quit()
    print("Deploy complete!")

if __name__ == "__main__":
    main()
