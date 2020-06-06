import sys
import select
import datetime
import serial

SERIALDEVICE = "/dev/ttyUSB0"
BAUDRATE = 115200

with serial.Serial(SERIALDEVICE, BAUDRATE) as tty:
    while(True):
        i,o,e = select.select([sys.stdin,tty],[],[])
        for fd in i:
            if fd == sys.stdin:
                c = sys.stdin.readline()
                if c[0] == 'q':
                    exit(0)
                s = "----------------------------------------" + c
            else:
                s = tty.readline()
            sys.stdout.write(str(datetime.datetime.now()))
            sys.stdout.write(' ')
            sys.stdout.write(s.strip() + '\n')
            sys.stdout.flush()
