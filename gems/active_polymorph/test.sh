#!/bin/bash
result=0

echo "################ active_polymorph ################"
bundle check || bundle install
bundle exec rspec spec
let result=$result+$?

if [ $result -eq 0 ]; then
	echo "SUCCESS"
else
	echo "FAILURE"
fi

exit $result
