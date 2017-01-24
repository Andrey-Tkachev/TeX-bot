import os
import time
import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument('-p', '--period', type=int, help='Enter the period in secs')
parser.add_argument('-f', '--file', help='Enter json config filename')
args = parser.parse_args()

del_dirs = []
del_time = 60
del_ignore = ['cleaner.py']

if args.period:
    del_time = args.period

if args.file:
    config = open(args.file, 'r').read()
    json_prs = json.loads(config)
    del_dirs += json_prs['dirs']
    json_prs['ignore'].append(args.file)
    del_ignore += json_prs['ignore']

for path in del_dirs:
    file_list = os.listdir(path)
    for file in file_list:
        if (time.time() - os.path.getmtime(path + '/' + file)) >= del_time and (file not in del_ignore):
            os.remove(path + '/' + file)
