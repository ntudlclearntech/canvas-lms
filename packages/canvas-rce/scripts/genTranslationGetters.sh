#!/bin/bash
WHEREAMI=$PWD

cd ./`dirname $0`/../src

##########################################################
echo Genrating getTinymceTranslations.js
cd rce
AWK_CMD=$(cat << FINI
BEGIN {
  FS="."
  print "export default function getTinymceTranslations(locale) {"
  print "  let p"
  print "  switch (locale) {"
}

/\.js/ {
  printf "    case '%s':\n", \$1
  printf "      p = import('./rce/languages/%s')\n", \$1
  print  "      break"
}

END {
  print "    default:"
  print "      p = Promise.resolve(null)"
  print "  }"
  print "  p.then(() => {}).catch(err => {"
  print "    console.error('Failed loading ', locale, err)"
  print "  })"
  print "  return p"
  print "}"
}
FINI
)

$(cat << FINI  > ../getTinymceTranslations.js
/*
 * Copyright (C) 2021 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * this file is generated by scripts/getTranslationGetters. do not edit
 */

FINI
)

ls -1 languages | awk "$AWK_CMD"  >> ../getTinymceTranslations.js
cd ..

##########################################################
echo Generating getRceTranslations.js

AWK_CMD=$(cat << FINI
BEGIN {
  FS="."
  print "export default function getRceTranslations(locale) {"
  print "  let p"
  print "  switch (locale) {"
}

/\.js/ {
  printf "    case '%s':\n", \$1
  printf "      p = import('./locales/%s')\n", \$1
  print  "      break"
}

END {
  print "    default:"
  print "      p = Promise.resolve(null)"
  print "  }"
  print "  return p"
  print "}"
}
FINI
)

$(cat << FINI  > ./getRceTranslations.js
/*
 * Copyright (C) 2021 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * this file is generated by scripts/getTranslationGetters. do not edit
 */

FINI
)

ls -1 locales | awk "$AWK_CMD"  >> ./getRceTranslations.js

echo fini

cd $WHEREAMI
