import os, time

del_dirs = [os.path.curdir]
del_time = 60

for path in del_dirs:
    file_list = os.listdir(path)
    for file in file_list:
        if (time.time() - os.path.getmtime(file)) >= del_time and file != 'cleaner.py':
            os.remove(file)