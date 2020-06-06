log2html
========

Render a log to HTML with some customizable coloring rules

I wrote this because I needed to to some boot optimization on an ARM
Linux machine and had a hard time reading 10,000 lines long log files,
trying to figure out where in u-boot, kernel and init time was
wasted. It turned out to also be good for sending logs around
discussing error lines and other peculiarities in the boot log.

`log2html` consists of three tools:
* tslog.py: used to capture a UART console log and timestamp every line
* log2html.scm: used to generate a colored HTML file from the log
* log2html.js: used to annotate and comment lines in the generated log


Prerequisites
-------------

*log2html* requires:
* python, both python2.7 and python3 works, and the pyserial package.
```
$ pip install pyserial
```

* Racket (scheme) version 7.2 or higher, and the _gregor_ package.
```
$ sudo apt install racket
$ raco pkg install gregor
```


Building
--------

Building creates a standalong binary with all the supporting file
included. The idea is to be able to easily ship it to a lab computer
or any other device that may not have network access.

```
$ make
```

It should work well on Linux, probably Unix and most likely mac as
well. I haven't tested that though.


Capturing a Log
---------------

The first step is capturing a log, complete with bootloader (u-boot
and others) and kernel, etc. `tslog.py` is a very simple tool that
opens `/dev/ttyUSB0` and echoes everything to stdout prefixed with a
timestamp.

```
	$ python tslog.py | tee boot.log
```

Since it's helpful to also see the log as it's being captured, use
`tee` to write it to a file. If you need to use a different serial
device, change the line `SERIALDEVICE = "/dev/ttyUSB0"` to use the
needed device. Simmilarirly, if you need a different baudrate (bitrate),
change the line `BAUDRATE = 115200`.

`tslog.py` when you're done, you can type `q` to quit and close the
streams.

If you want to mark a special event that can't be seen in the log,
like display turning on, or similar, you can pre _return_ to add a
marker line that later be edited or commented.


Processing a Log
----------------

After the log have been captured, it's time to process with
`log2html`. It reads the file given as argument and writes to standard
out.

```
	$ log2html rpi_boot_example.log > bootlog.html
```

If you want `log2html` to try to extract a timestamp from the first
line in the log, add the `-l` switch:

```
	$ log2html -l rpi_boot_example.log > bootlog.html
```

You can also set a name on the generated log. `log2html` will add a
timestamp to the title. Or you can set the title explicitely with `-t`:

```
	$ log2html -l -n "RPi Boot Log" rpi_boot_example.log | head -2
	<html><head>
	    <title> Boot Log from 2020-06-06 14:39:08.797085 </title>
```

`log2html` can also be run without compiling:

```
	$ racket log2html.scm -l -n "Boot Log" rpi_boot_example.log > bootlog.html
```

Log Line Coloring
-----------------

To make the log easier to read,`log2html` will try to identify
different kinds of log lines and give them different colors in the
output. It uses regular expressions in the file `config.json` to match
line types and for certain types set that as the default type until a
new type is encountered, making it possible to match lines like
"U-Boot version ...", to color all lines from there as u-boot lines.

It will also, by default, regard all lines with the words: error,
failure or timeout as error lines and higlight them in red.

A line type declaration looks like this:

```
    { "label": "marker",
      "style": "color: white; background: #f00;",
      "regex": "[-]{30}"
    },
```

In this case, it matches the 30 dashes (`-`) that is in a marker line
from `tslog.py` and colors that line white on a red background to make
them stand out.

```
    { "label": "kernel",
      "style": "color: #ffdb70;",
      "regex": "^[0-9]{4}(-[0-9]{2}){2} [0-9]{2}(:[0-9]{2}){2}\\.[0-9]{6} \\[[ ]*[0-9]+\\.[0-9]+",
      "fallb": "syslog"
    },
    { "label": "syslog",
      "style": "color: #1fff57;",
      "regex": "^$"
    }
```

The first declaration matches a typical Linux kernel log line like:

```
[    3.216268] NET: Registered protocol family 10
```

Where every line starts with a timestamp within brackets. It also says
that if a line encountered does not match that, it should fall back to
the _syslog_ declaration.

The configuration file `config.json` is compiled into the binary
together with the HTML template files, the javascript file and the CSS
style sheet.


The Rendered Log
----------------

The rendered log have some features that can be used when viewing a
log in a browser and that can be practical when passing logs around to
others. The functions are all keyboard-driven.

* A comment can be added to one or several log lines by marking the
  lines and type `c`. The lines will be highlighted and a comment will
  be added. The comment text can then entered, finishing by pressing
  the "Save" button or typing `ctr-return`.

* One or several lines can be annotated with one of the types in
  `config.json` by markin the lines and typing `a`. A popup with all
  the types will be shown and the type can be chosen by typing the
  hexadecimal figure next to the type. The popup can be dismissed by
  typing `esc`.

* New types can be added by typing `n`. A popup will be shown where
  color can be chosen and name entered. The popup can be dismissed
  with `esc`.


Saving a Log
------------

After annotating and commenting a log, it can be saved from the
browser to a new `.html`-file with all the added comments and
annotations preserved to the next viewer. Thus, a log can be passed
around with comments and annotations for easier communications between
persons working on the same system.


TODO
----

* Annotate popup can't be dismissed with `esc`.

* `-t` is broken.

* The user interface is a little bit clunky because I wanted the
  `.html` file to be completely standalone with no external
  dependencies on jquery or similar. It is in need of a facelift.

* The logcapturing in `tslog.py` should be built into log2html.scm so
  that it can be run as a standalone binary, possibly rendering the
  log on the fly.

* Or, at the very least, tslog should be a statically linked binary
  that can be compiled to and run on any target system.
