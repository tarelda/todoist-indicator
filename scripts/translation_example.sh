#!/bin/sh
LANG=pl
ENCODING=UTF-8
LOCALE=pl_PL.utf8

xgettext --from-code=$ENCODING --output=po/todoist@tarelda.github.com.pot *.js
msginit --no-translator --input po/todoist@tarelda.github.com.pot --output-file=po/$LANG.po --locale=$LOCALE --no-wrap
# apply translations to po file and after that generate final mo file
msgfmt po/$LANG.po -o locale/$LANG/LC_MESSAGES/todoist@tarelda.github.com.mo