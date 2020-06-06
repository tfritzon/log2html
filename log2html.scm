#lang racket/base

(require racket/cmdline)
(require web-server/templates)
(require scribble/text)
(require json)
(require gregor)
(require racket/format)

;; Load config
(define config (string->jsexpr
                (string-join
                 (filter (lambda (x) (not (string=? x "\n")))
                         (include/text "config.json")))))

;; Render category styles: { "label": "x", "style": "color: #ff7070;",  "regex": "[0-9]+" }
(define (render-cat-styles l)
  (displayln "<style type=\"text/css\">")
  (render-cat-style l))

(define (render-cat-style l)
  (cond
   [(empty? l) (display "</style>")]
     [else
      (let ([label (hash-ref (car l) 'label)]
            [style (hash-ref (car l) 'style)])
        (printf ".~a { ~a }" label style)
        (displayln "")
        (render-cat-style (cdr l)))]))

;; Render head
(define _css (include/text "log2html.css"))
(define _js (include/text "log2html.js"))
(define (render-head _title)
  (displayln
   (let ([title _title]
	 [css _css]
	 [js _js])
     (include-template "log2html_head.html")))
  (render-cat-styles (hash-ref config 'categories)))

;; Render body preamble
(define (render-body-pre _title)
  (display
   (let ([title _title])
   (include-template "log2html_body.html"))))

;; Render category picker
(define (render-cat-picker l)
    (display "<div id=\"catpick\"><ul id=\"catplist\"><li class=\"def\">0. defualt</li>")
    (render-cat-picker-item 1 l))

(define (render-cat-picker-item n l)
  (cond
   [(empty? l) (display "</ul></div>")]
   [else
    (let ([label (hash-ref (car l) 'label)])
      (printf "<li class=\"~a\">~a. ~a</li>" label n label)
      (displayln "")
      (render-cat-picker-item (+ n 1) (cdr l)))]))

;; Render log
(define extract-ts (make-parameter #f))
(define timestamp (make-parameter (string-replace (datetime->iso8601 (now)) "T" " ")))
(define _name (make-parameter "Log from "))
(define _title (make-parameter (string-append (_name) (timestamp))))
(define (maketitle n)
  (_name n)
  (_title (string-append (string-append n " from ") (timestamp))))
(define file-to-render
  (command-line
   #:once-each
   [("-l" "--timestamp-from-log")
    "Get timestamp from first log line"
    (extract-ts #t)]

   [("-t" "--title") title
    "Set title of log to <argument>"
    (_title title)]

   [("-n" "--name") name
    "Set the name of log to <name> and add a date, either (now) or -l"
    (maketitle name)]
   
   #:args (filename)
   filename))

;; Classify log line according to regexps in config.json
(define default "def")
(define (classify s l)
  (if (empty? l)
      default
      (let ([cat (car l)]
            [regex (hash-ref (car l) 'regex)]
            [label (hash-ref (car l) 'label)])
        (if (regexp-match (pregexp regex) s)
            (if (hash-has-key? cat 'error)
                (if (regexp-match (pregexp (hash-ref cat 'error)) s)
                    "error"
                    label)
                (if (hash-has-key? cat 'fallb)
		    (begin (set! default (hash-ref cat 'fallb))
			   label)
		    label))
            (classify s (cdr l))))))

;; Calculate timestamp and delta-t
(define t0 (make-parameter (iso8601->datetime (string-replace (timestamp) " " "T"))))
(define etsr (pregexp (hash-ref config 'ts-extract-regex)))
(define (delta-t s)
  (/ (microseconds-between
      (t0)
      (iso8601->datetime (string-replace (car (regexp-match etsr s)) " " "T")))
     1000000.0))

;; Render a log line to the output
(define (render n line)
  (let ([dt (delta-t line)])
    (printf "<span class=\"~a\" id=\"l~a\"><span class=\"ln\">~a</span> <span class=\"et\">~a </span> ~a<br /></span>\n"
            (classify line (hash-ref config 'categories))
            n
            n
            (~r dt #:precision '(= 6))
            line)))

(define (get-ts s)
  (if (hash-has-key? config 'ts-extract-regex)
      (car (regexp-match (pregexp (hash-ref config 'ts-extract-regex)) s))
      (s)))

;; Render the preamble, the first line and the rest of the lines
(define (render-file file)
  (let ([line (read-line file 'any)])
    (cond 
     [(extract-ts) (timestamp (get-ts line))])
    (_title (string-append (string-append (_name) " from ") (timestamp)))
    (t0 (iso8601->datetime (string-replace (timestamp) " " "T")))
    (render-head (_title))
    (render-body-pre (_title))
    (render-cat-picker (hash-ref config 'categories))
    (render 0 line)
    (next-line file 1)))

(define (next-line file n)
  (let ((line (read-line file 'any)))
    (unless (eof-object? line)
            (render n line)
            (next-line file (+ n 1)))))

(call-with-input-file file-to-render render-file)

;; Finish off the HTML file
(display "</div></body></html>")
