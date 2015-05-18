#!/bin/bash
result=0

echo "################ canvas_quiz_statistics ################"
bundle check || bundle install
bundle exec rspec spec
let result=$result+$?

if [ $result -eq 0 ]; then
	echo "SUCCESS"
else
	echo "FAILURE"
fi

exit $result
