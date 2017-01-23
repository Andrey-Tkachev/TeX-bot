#!usr/bin/python3
import os, time

del_dirs = ['/root/TeX-bot/tex', '/root/TeX-bot/images']
del_time = 60

for path in del_dirs:
    file_list = os.listdir(path)
    for file in file_list:
        if (time.time() - os.path.getmtime(path + '/' + file)) >= del_time and file != 'cleaner.py':
            os.remove(path + '/' + file)
