# Myplanet.io   

This badge may not represent reality because docpad cli tools don't return with correct exit codes on errors therefore the build does not break when it should.
[![Build Status](https://travis-ci.org/myplanetdigital/swat.svg?branch=master)](https://travis-ci.org/myplanetdigital/swat)

## Development with Dummy Content 
	    
	npm install docpad -g  
	npm install
	docpad run --env development [-p 9997]

## Development with Production Content

	npm install docpad grunt-cli -g
	npm install
	grunt
	docpad run --env static

This downloads the external content, so be sure to be selective with your `git add`-ing.

## Deploying to GitHub Pages (dev.myplanet.io)

Any check into this branch or to the [seperate content repository](https://github.com/myplanetdigital/myplanetdigital-content) will trigger a build in [Travis](https://travis-ci.org/) which will then automagically be deployed to http://dev.myplanet.io

## License 

Copyright © 2014 Myplanet Digital. All rights reserved.
 
