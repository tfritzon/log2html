all: log2html example

log2html: log2html.scm log2html_head.html log2html_body.html log2html.css log2html.js config.json
	raco exe $<

example: rpi_boot_example.log
	./log2html $< > bootlog.html

clean:
	rm -f log2html bootlog.html *~

