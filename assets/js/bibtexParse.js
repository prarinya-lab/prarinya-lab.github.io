/* start bibtexParse 0.0.24 */

//Original work by Henrik Muehe (c) 2010
//
//CommonJS port by Mikola Lysenko 2013
//
//Port to Browser lib by ORCID / RCPETERS
//
//Issues:
//no comment handling within strings
//no string concatenation
//no variable values yet
//Grammar implemented here:
//bibtex -> (string | preamble | comment | entry)*;
//string -> '@STRING' '{' key_equals_value '}';
//preamble -> '@PREAMBLE' '{' value '}';
//comment -> '@COMMENT' '{' value '}';
//entry -> '@' key '{' key ',' key_value_list '}';
//key_value_list -> key_equals_value (',' key_equals_value)*;
//key_equals_value -> key '=' value;
//value -> value_quotes | value_braces | key;
//value_quotes -> '"' .*? '"'; // not quite
//value_braces -> '{' .*? '"'; // not quite
function BibtexParser() {
    this.pos = 0;
    this.input = "";
    this.entries = new Array();

    this.currentEntry = "";

    this.setInput = function(t) {
        this.input = t;
    };

    this.getEntries = function() {
        return this.entries;
    };

    this.isWhitespace = function(s) {
        return (s == ' ' || s == '\r' || s == '\t' || s == '\n');
    };

    this.match = function(s, canCommentOut) {
        if (canCommentOut == undefined || canCommentOut == null)
            canCommentOut = true;
        this.skipWhitespace(canCommentOut);
        if (this.input.substring(this.pos, this.pos + s.length) == s) {
            this.pos += s.length;
        } else {
            throw TypeError("Token mismatch: match", "expected " + s + ", found " +
                this.input.substring(this.pos));
        }
        this.skipWhitespace(canCommentOut);
    };

    this.skipWhitespace = function(canCommentOut) {
        while (this.isWhitespace(this.input[this.pos])) {
            this.pos++;
        }
        if (this.input[this.pos] == "%" && canCommentOut == true) {
            while (this.input[this.pos] != "\n") {
                this.pos++;
            }
            this.skipWhitespace(canCommentOut);
        }
    };

    this.value_braces = function() {
        var bracecount = 0;
        this.match("{", false);
        var start = this.pos;
        var escaped = false;
        while (true) {
            if (!escaped) {
                if (this.input[this.pos] == '}') {
                    if (bracecount > 0) {
                        bracecount--;
                    } else {
                        var end = this.pos;
                        this.match("}", false);
                        return this.input.substring(start, end);
                    }
                } else if (this.input[this.pos] == '{') {
                    bracecount++;
                } else if (this.pos >= this.input.length - 1) {
                    throw TypeError("Unterminated value");
                }
            }
            if (this.input[this.pos] == '\\' && escaped == false)
                escaped = true;
            else
                escaped = false;
            this.pos++;
        }
    };

    this.value_quotes = function() {
        this.match('"', false);
        var start = this.pos;
        var escaped = false;
        while (true) {
            if (!escaped) {
                if (this.input[this.pos] == '"') {
                    var end = this.pos;
                    this.match('"', false);
                    return this.input.substring(start, end);
                } else if (this.pos >= this.input.length - 1) {
                    throw TypeError("Unterminated value:", "EOF");
                }
            }
            if (this.input[this.pos] == '\\' && escaped == false)
                escaped = true;
            else
                escaped = false;
            this.pos++;
        }
    };

    this.single_value = function() {
        var start = this.pos;
        if (this.pos >= this.input.length) {
            throw TypeError("Unexpected end of input");
        }
        if (this.input[this.pos] == '{') {
            return this.value_braces();
        } else if (this.input[this.pos] == '"') {
            return this.value_quotes();
        } else {
            var k = this.key();
            if (k.match("^[0-9]+$"))
                return k;
            throw TypeError("Value expected:", "Expected value");
        }
    };

    this.value = function() {
        var values = [];
        values.push(this.single_value());
        while (this.pos < this.input.length && this.input[this.pos] == '#') {
            this.match('#');
            values.push(this.single_value());
        }
        return values.join('');
    };

    this.key = function() {
        var start = this.pos;
        while (true) {
            if (this.pos >= this.input.length) {
                throw TypeError("Unexpected end of input:", "EOF");
            }
            if (this.input[this.pos].match("[a-zA-Z0-9+_:\\./-]")) {
                this.pos++;
            } else {
                this.skipWhitespace(false);
                return this.input.substring(start, this.pos);
            }
        }
    };

    this.key_equals_value = function() {
        var key = this.key();
        if (this.input[this.pos] != '=') {
            throw TypeError("Value expected, equals sign missing:", "= missing");
        }
        this.match('=');
        var val = this.value();
        return [key, val];
    };

    this.key_value_list = function() {
        var kv = this.key_equals_value();
        this.currentEntry['entryTags'] = {};
        this.currentEntry['entryTags'][kv[0]] = kv[1];
        while (this.input[this.pos] == ',') {
            this.match(',');
            // fixes problems with commas at the end of a list
            if (this.input[this.pos] != '}') {
                kv = this.key_equals_value();
                this.currentEntry['entryTags'][kv[0]] = kv[1];
            }
        }
    };

    this.entry_body = function(d) {
        this.currentEntry = {};
        this.currentEntry['citationKey'] = this.key();
        this.currentEntry['entryType'] = d.substring(1);
        this.match(',');
        this.key_value_list();
        this.entries.push(this.currentEntry);
    };

    this.directive = function() {
        this.match('@');
        return "@" + this.key();
    };

    this.preamble = function() {
        this.currentEntry = {};
        this.currentEntry['entryType'] = 'PREAMBLE';
        this.currentEntry['entry'] = this.value_braces();
        this.entries.push(this.currentEntry);
    };

    this.comment = function() {
        this.currentEntry = {};
        this.currentEntry['entryType'] = 'COMMENT';
        this.currentEntry['entry'] = this.value_braces();
        this.entries.push(this.currentEntry);
    };

    this.entry = function(d) {
        this.entry_body(d);
    };

    this.bibtex = function() {
        while (this.pos < this.input.length) {
            var d = this.directive();
            this.match('{');
            if (d == "@STRING") {
                this.string();
            } else if (d == "@PREAMBLE") {
                this.preamble();
            } else if (d == "@COMMENT") {
                this.comment();
            } else {
                this.entry(d);
            }
            this.match('}');
        }
    };
}

function BibtexDisplay() {
    this.fixValue = function(value) {
        value = value.replace(/\\glqq\s?/g, "&bdquo;");
        value = value.replace(/\\grqq\s?/g, '&rdquo;');
        value = value.replace(/\\ /g, '&nbsp;');
        value = value.replace(/\\url/g, '');
        value = value.replace(/---/g, '&mdash;');
        value = value.replace(/{\\"a}/g, '&auml;');
        value = value.replace(/\{\\"o\}/g, '&ouml;');
        value = value.replace(/{\\"u}/g, '&uuml;');
        value = value.replace(/{\\"A}/g, '&Auml;');
        value = value.replace(/{\\"O}/g, '&Ouml;');
        value = value.replace(/{\\"U}/g, '&Uuml;');
        value = value.replace(/\\ss/g, '&szlig;');
        value = value.replace(/\{(.*?)\}/g, '$1');
        return value;
    };

    this.displayBibtex2 = function(input, output) {
        // parse bibtex input
        var b = new BibtexParser();
        b.setInput(input);
        b.bibtex();

        // save old entries to remove them later
        var old = output.find("*");

        // iterate over bibTeX entries
        var entries = b.getEntries();
        for (var i in entries) {
            var entry = entries[i];

            // find template
            var tpl = $(".bibtex_template").clone().removeClass('bibtex_template');

            // find all keys in the entry
            var keys = [];
            for (var key in entry.entryTags) {
                keys.push(key.toUpperCase());
            }

            var entryData = tpl.children("." + entry.entryType.toUpperCase());
            if (entryData.length) {
                entryData.children().each(function(index) {
                    if ($(this).hasClass("if")) {
                        var str = $(this).attr("class").split(" ")[1];
                        var booleanNotFound = str.indexOf("not") != -1;
                        var other_keys = str.split(".")[1].split(",");
                        $.each(other_keys, function(i, value) {
                            var found = $.inArray(value.toUpperCase(), keys) != -1;
                            if (booleanNotFound == found) {
                                $(this).remove();
                            }
                        });
                    }
                });
            }

            // find all values
            tpl.find("span").each(function() {
                var $this = $(this);
                var key = $this.attr("class");
                if (key) {
                    var value = entry.entryTags[key.toLowerCase()];
                    if (value) {
                        value = this.fixValue(value);
                        $this.html(value);
                    }
                }
            });

            output.append(tpl);
            tpl.show();
        }

        // remove old entries
        old.remove();
    };
}
