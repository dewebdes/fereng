#!/usr/bin/python
import subprocess, sys
cmd = "snort -A console -i eth0 -c /etc/snort/snort.conf"
p = subprocess.Popen(cmd, shell=True, stderr=subprocess.PIPE)
while True:
    out = p.stderr.read(1)
    if out == '' and p.poll() != None:
        break
    if out != '':
        sys.stdout.write(out)
        sys.stdout.flush()
